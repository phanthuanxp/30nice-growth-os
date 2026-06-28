"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { writeAuditLog } from "@/server/audit/log";
import { createTenant } from "@/server/queries/tenants";

const PRIMARY_HOST = (process.env.PRIMARY_HOST ?? "30nice.vn").toLowerCase();

export type FactoryResult = { ok: boolean; tenantId?: string; error?: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export async function createSiteFromClusterAction(
  clusterId: string,
  _prev: FactoryResult,
  form: FormData,
): Promise<FactoryResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!can(session.role, "AGENCY_ADMIN")) return { ok: false, error: "Không đủ quyền" };

  const cluster = await prisma.keywordCluster.findUnique({
    where: { id: clusterId },
    include: { project: true },
  });
  if (!cluster) return { ok: false, error: "Cluster không tồn tại" };
  if (cluster.assignedTenantId) return { ok: false, error: "Cluster đã được gắn với site rồi" };

  const nameInput = form.get("name")?.toString().trim();
  const slugInput = form.get("slug")?.toString().trim();
  const domainInput = form.get("domain")?.toString().trim();
  const seoTitle = form.get("seoTitle")?.toString().trim();
  const seoDesc = form.get("seoDesc")?.toString().trim();

  if (!nameInput) return { ok: false, error: "Tên site là bắt buộc" };

  const slug = slugInput || slugify(nameInput);
  const domain = domainInput || `${slug}.${PRIMARY_HOST}`;

  try {
    const org = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
    if (!org) return { ok: false, error: "Chưa có organization nào" };

    const tenant = await createTenant(org.id, {
      name: nameInput,
      slug,
      primaryDomain: domain,
      defaultSeoTitle: seoTitle || cluster.name,
      defaultSeoDescription: seoDesc,
      status: "ACTIVE",
    });

    await prisma.domain.create({
      data: { tenantId: tenant.id, host: domain, primary: true, verified: false },
    });

    // Link cluster to this tenant
    await prisma.keywordCluster.update({
      where: { id: clusterId },
      data: {
        assignedTenantId: tenant.id,
        suggestedSlug: slug,
        suggestedDomain: domain,
      },
    });

    // Create ContentPlan with starter items from cluster keywords
    const headKw = cluster.headKeyword || nameInput;
    const memberKeywords = await prisma.keywordClusterMember.findMany({
      where: { clusterId },
      include: { keyword: { select: { text: true, intent: true } } },
      orderBy: { isPrimary: "desc" },
      take: 10,
    });
    const starterTitles = [
      `${headKw}: Complete Travel Guide`,
      `Best Time to Visit ${headKw}`,
      `How to Get to ${headKw}`,
      `Best Things to Do in ${headKw}`,
      `${headKw} Itinerary and Travel Tips`,
      `${headKw} FAQ for First-Time Visitors`,
    ];
    await prisma.contentPlan.create({
      data: {
        tenantId: tenant.id,
        title: `${nameInput} Content Plan`,
        goal: `Build topical authority for ${domain}`,
        status: "ACTIVE",
        items: {
          create: starterTitles.map((title, i) => {
            const memberKw = memberKeywords[i]?.keyword;
            return {
              title,
              keyword: memberKw?.text || headKw,
              intent: memberKw?.intent || "INFORMATIONAL",
              priority: 100 - i * 10,
            };
          }),
        },
      },
    });

    await writeAuditLog({
      userId: session.id,
      action: "site_factory.create_site",
      resource: "Tenant",
      resourceId: tenant.id,
      metadata: { clusterId, slug, domain },
    });

    revalidatePath("/admin/sites");
    revalidatePath(`/admin/seo/keywords/${cluster.projectId}`);

    return { ok: true, tenantId: tenant.id };
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return { ok: false, error: "Slug hoặc domain đã tồn tại. Thử tên khác." };
    }
    return { ok: false, error: "Không thể tạo site" };
  }
}

export async function suggestSlugFromCluster(clusterName: string): Promise<string> {
  return slugify(clusterName);
}
