"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { writeAuditLog } from "@/server/audit/log";
import {
  createKeywordProject,
  updateKeywordProject,
  deleteKeywordProject,
  getKeywordProject,
} from "@/server/queries/keyword-projects";
import { listKeywords, upsertKeywords } from "@/server/queries/keywords";
import { createCluster, deleteClusters } from "@/server/queries/keyword-clusters";
import { suggestClusters } from "@/server/seo/cluster";
import { classifyIntents } from "@/server/seo/intent";
import { generateTravelKeywords } from "@/server/seo/travel-keywords";
import { generateSubdomainSuggestions, normalizeRootDomain } from "@/lib/subdomain-factory";

export type ActionResult = { ok: boolean; error?: string };

export async function createProjectAction(
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };

  const name = form.get("name")?.toString().trim();
  const description = form.get("description")?.toString().trim();
  const language = form.get("language")?.toString().trim() || "vi";
  const niche = form.get("niche")?.toString().trim();

  if (!name) return { ok: false, error: "Tên project là bắt buộc" };

  const project = await createKeywordProject(session.id, { name, description, language, niche });

  await writeAuditLog({
    userId: session.id,
    action: "keyword_project.create",
    resource: "KeywordProject",
    resourceId: project.id,
  });

  redirect(`/admin/seo/keywords/${project.id}`);
}

export async function updateProjectAction(
  id: string,
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };

  const name = form.get("name")?.toString().trim();
  if (!name) return { ok: false, error: "Tên project là bắt buộc" };

  try {
    await updateKeywordProject(id, session.id, {
      name,
      description: form.get("description")?.toString().trim(),
      language: form.get("language")?.toString().trim() || "vi",
    });
    await writeAuditLog({
      userId: session.id,
      action: "keyword_project.update",
      resource: "KeywordProject",
      resourceId: id,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Không thể cập nhật project" };
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };

  try {
    await deleteKeywordProject(id, session.id);
    await writeAuditLog({
      userId: session.id,
      action: "keyword_project.delete",
      resource: "KeywordProject",
      resourceId: id,
    });
  } catch {
    return { ok: false, error: "Không thể xóa project" };
  }

  redirect("/admin/seo/keywords");
}

export async function generateTravelKeywordsAction(
  projectId: string,
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };

  const project = await getKeywordProject(projectId, session.id);
  if (!project) return { ok: false, error: "Project không tồn tại" };

  const niche = form.get("niche")?.toString().trim() || project.niche || "Vietnam travel news and reviews";
  const destinations = form.get("destinations")?.toString().trim() || "";
  const rootDomain = form.get("rootDomain")?.toString().trim() || undefined;
  const limit = Number(form.get("limit") || 80);

  try {
    const generated = await generateTravelKeywords({ niche, destinations, rootDomain, limit });
    if (generated.length === 0) return { ok: false, error: "Không tạo được keyword" };

    await upsertKeywords(projectId, generated.map((item) => ({
      text: item.keyword,
      intent: item.intent,
      metadata: { category: item.category, source: "travel_keyword_generator", rootDomain },
    })));

    await writeAuditLog({
      userId: session.id,
      action: "keywords.generate_travel",
      resource: "KeywordProject",
      resourceId: projectId,
      metadata: { count: generated.length, niche, rootDomain },
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi tạo keyword du lịch" };
  }
}

export async function importKeywordsAction(
  projectId: string,
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };

  const project = await getKeywordProject(projectId, session.id);
  if (!project) return { ok: false, error: "Project không tồn tại" };

  const raw = form.get("keywords")?.toString() ?? "";
  const lines = raw
    .split(/[\n,]+/)
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);

  if (lines.length === 0) return { ok: false, error: "Không có từ khóa nào" };
  if (lines.length > 1000) return { ok: false, error: "Tối đa 1000 từ khóa mỗi lần import" };

  await upsertKeywords(projectId, lines.map((text) => ({ text })));

  await writeAuditLog({
    userId: session.id,
    action: "keywords.import",
    resource: "KeywordProject",
    resourceId: projectId,
    metadata: { count: lines.length },
  });

  return { ok: true };
}

export async function classifyIntentsAction(projectId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };

  const project = await getKeywordProject(projectId, session.id);
  if (!project) return { ok: false, error: "Project không tồn tại" };

  const keywords = await listKeywords(projectId);
  if (keywords.length === 0) return { ok: false, error: "Chưa có từ khóa nào" };

  try {
    const classified = await classifyIntents(keywords.map((k) => k.text));

    await upsertKeywords(
      projectId,
      classified.map((c) => ({ text: c.keyword, intent: c.intent })),
    );

    await writeAuditLog({
      userId: session.id,
      action: "keywords.classify_intent",
      resource: "KeywordProject",
      resourceId: projectId,
      metadata: { count: classified.length },
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi phân loại intent" };
  }
}

export async function autoClusterAction(projectId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };

  const project = await getKeywordProject(projectId, session.id);
  if (!project) return { ok: false, error: "Project không tồn tại" };

  const keywords = await listKeywords(projectId);
  if (keywords.length === 0) return { ok: false, error: "Chưa có từ khóa nào" };

  try {
    const suggestions = await suggestClusters(keywords.map((k) => k.text));
    const kwMap = new Map(keywords.map((k) => [k.text, k.id]));

    await deleteClusters(projectId);

    for (const s of suggestions) {
      const memberIds = s.members
        .map((m) => kwMap.get(m))
        .filter((id): id is string => !!id);
      if (memberIds.length === 0) continue;

      const pillarId = kwMap.get(s.pillar) ?? memberIds[0];
      const totalVolume = s.members
        .map((m) => keywords.find((k) => k.text === m)?.searchVolume ?? 0)
        .reduce((a, b) => a + b, 0);

      await createCluster(projectId, s.label, [pillarId, ...memberIds.filter((id) => id !== pillarId)], s.pillar, totalVolume);
    }

    await writeAuditLog({
      userId: session.id,
      action: "keyword_clusters.auto_cluster",
      resource: "KeywordProject",
      resourceId: projectId,
      metadata: { clusterCount: suggestions.length },
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi tạo cluster" };
  }
}

export async function createSubdomainPlansFromClustersAction(
  projectId: string,
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };

  const project = await getKeywordProject(projectId, session.id);
  if (!project) return { ok: false, error: "Project không tồn tại" };

  const rootDomain = normalizeRootDomain(form.get("rootDomain")?.toString() || "30nice.vn");
  const clusters = await import("@/server/queries/keyword-clusters").then((m) => m.listClusters(projectId));
  if (clusters.length === 0) return { ok: false, error: "Chưa có cluster nào" };

  let count = 0;
  const { prisma } = await import("@/server/db");
  for (const cluster of clusters) {
    const keyword = cluster.headKeyword || cluster.name;
    const suggestion = generateSubdomainSuggestions({ rootDomain, keywords: keyword, topics: project.niche ?? undefined })[0];
    if (!suggestion) continue;
    await prisma.subdomainPlan.upsert({
      where: { rootDomain_subdomain: { rootDomain, subdomain: suggestion.subdomain } },
      update: { keyword, fullDomain: suggestion.domain, niche: project.niche, intent: suggestion.intent, seoScore: suggestion.score, opportunityScore: suggestion.score, rationale: suggestion.rationale, keywordProjectId: projectId },
      create: { rootDomain, subdomain: suggestion.subdomain, fullDomain: suggestion.domain, keyword, niche: project.niche, intent: suggestion.intent, seoScore: suggestion.score, opportunityScore: suggestion.score, rationale: suggestion.rationale, keywordProjectId: projectId, createdById: session.id },
    });
    count++;
  }

  await writeAuditLog({ userId: session.id, action: "subdomain_plans.from_keyword_clusters", resource: "KeywordProject", resourceId: projectId, metadata: { rootDomain, count } });
  return { ok: true };
}

export async function deleteClusterAction(
  clusterId: string,
  projectId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };

  const project = await getKeywordProject(projectId, session.id);
  if (!project) return { ok: false, error: "Không có quyền" };

  try {
    const { deleteCluster } = await import("@/server/queries/keyword-clusters");
    await deleteCluster(clusterId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không thể xóa cluster" };
  }
}
