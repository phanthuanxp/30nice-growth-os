"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { writeAuditLog } from "@/server/audit/log";
import { createTenant } from "@/server/queries/tenants";
import { generateSubdomainSuggestions, normalizeRootDomain } from "@/lib/subdomain-factory";

export type ActionResult = { ok: boolean; error?: string };
const PRIMARY_HOST = (process.env.PRIMARY_HOST ?? "30nice.vn").toLowerCase();

function ensureAdmin(role: Role) {
  return can(role, "AGENCY_ADMIN");
}

export async function generateSubdomainPlansAction(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!ensureAdmin(session.role)) return { ok: false, error: "Không đủ quyền" };

  const rootDomain = normalizeRootDomain(form.get("rootDomain")?.toString() || PRIMARY_HOST);
  const keywords = form.get("keywords")?.toString() || "";
  const topics = form.get("topics")?.toString() || "";
  const niche = form.get("niche")?.toString() || topics;
  const projectId = form.get("keywordProjectId")?.toString() || undefined;
  const suggestions = generateSubdomainSuggestions({ rootDomain, keywords, topics }).slice(0, 50);
  if (!rootDomain || suggestions.length === 0) return { ok: false, error: "Cần domain và ít nhất một keyword/location" };

  for (const s of suggestions) {
    await prisma.subdomainPlan.upsert({
      where: { rootDomain_subdomain: { rootDomain, subdomain: s.subdomain } },
      update: { keyword: s.keyword, fullDomain: s.domain, niche, intent: s.intent, seoScore: s.score, opportunityScore: s.score, rationale: s.rationale, keywordProjectId: projectId },
      create: { rootDomain, subdomain: s.subdomain, fullDomain: s.domain, keyword: s.keyword, niche, intent: s.intent, seoScore: s.score, opportunityScore: s.score, rationale: s.rationale, keywordProjectId: projectId, createdById: session.id },
    });
  }

  await writeAuditLog({ userId: session.id, action: "subdomain_plans.generate", resource: "SubdomainPlan", metadata: { rootDomain, count: suggestions.length } });
  revalidatePath("/admin/seo/factory");
  return { ok: true };
}

export async function updateSubdomainPlanStatusAction(id: string, status: "APPROVED" | "REJECTED" | "DRAFT"): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login?from=/admin/seo/factory");
  if (!ensureAdmin(session.role)) redirect("/admin/dashboard");
  await prisma.subdomainPlan.update({ where: { id }, data: { status } });
  await writeAuditLog({ userId: session.id, action: "subdomain_plan.status", resource: "SubdomainPlan", resourceId: id, metadata: { status } });
  revalidatePath("/admin/seo/factory");
}

export async function createSiteFromSubdomainPlanAction(id: string): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login?from=/admin/seo/factory");
  if (!ensureAdmin(session.role)) redirect("/admin/dashboard");
  const plan = await prisma.subdomainPlan.findUnique({ where: { id } });
  if (!plan) redirect("/admin/seo/factory");
  if (plan.tenantId) redirect(`/admin/sites/${plan.tenantId}`);
  const org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
  if (!org) redirect("/admin/seo/factory");

  const tenant = await createTenant(org.id, { name: plan.keyword, slug: plan.subdomain, primaryDomain: plan.fullDomain, defaultSeoTitle: `${plan.keyword}: Complete Travel Guide`, defaultSeoDescription: plan.rationale || undefined, status: "ACTIVE" });
  await prisma.domain.create({ data: { tenantId: tenant.id, host: plan.fullDomain, primary: true, verified: false } });

  const contentPlan = await prisma.contentPlan.create({
    data: {
      tenantId: tenant.id,
      subdomainPlanId: plan.id,
      title: `${plan.keyword} Content Plan`,
      goal: `Build topical authority for ${plan.fullDomain}`,
      status: "ACTIVE",
      items: { create: [`${plan.keyword}: Complete Travel Guide`, `Best Time to Visit ${plan.keyword}`, `How to Get to ${plan.keyword}`, `Best Things to Do in ${plan.keyword}`, `${plan.keyword} Itinerary and Travel Tips`, `${plan.keyword} FAQ for First-Time Visitors`].map((title, i) => ({ title, keyword: plan.keyword, intent: plan.intent, priority: 100 - i * 10 })) },
    },
  });
  await prisma.subdomainPlan.update({ where: { id }, data: { tenantId: tenant.id, status: "CREATED" } });
  await writeAuditLog({ userId: session.id, action: "subdomain_plan.create_site", resource: "Tenant", resourceId: tenant.id, metadata: { planId: id, contentPlanId: contentPlan.id } });
  revalidatePath("/admin/seo/factory");
  redirect(`/admin/sites/${tenant.id}`);
}
