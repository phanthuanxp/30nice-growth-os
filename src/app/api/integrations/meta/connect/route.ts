import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { Prisma } from "@prisma/client";
import { getSession } from "@/server/auth/session";
import { requireTenantAccess } from "@/server/permissions/guard";
import { tokenVaultConfigured } from "@/server/crypto/token-vault";
import { buildMetaAuthorizeUrl, getMetaConfig } from "@/server/meta/client";
import { sealMetaOauthState } from "@/server/meta/oauth-state";
import { adminPublicUrl } from "@/server/http/public-url";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "facebook-page";
}

async function uniquePageSlug(workspaceId: string, name: string) {
  const base = slugify(name);
  let candidate = base;
  let index = 2;
  while (await prisma.socialPage.findUnique({ where: { workspaceId_slug: { workspaceId, slug: candidate } }, select: { id: true } })) {
    candidate = `${base}-${index++}`;
  }
  return candidate;
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(adminPublicUrl("/login"));
  let socialPageId = request.nextUrl.searchParams.get("pageId");
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  try {
    if (!socialPageId && workspaceId) {
      const workspace = await prisma.socialWorkspace.findUnique({ where: { id: workspaceId }, select: { id: true, tenantId: true, name: true } });
      if (!workspace) return NextResponse.redirect(adminPublicUrl("/admin/social/pages?metaError=workspace_not_found"));
      await requireTenantAccess(workspace.tenantId, "TENANT_ADMIN");
      const slug = await uniquePageSlug(workspace.id, "Facebook Page đang có sẵn");
      const page = await prisma.socialPage.create({
        data: {
          workspaceId: workspace.id,
          name: "Facebook Page đang có sẵn",
          slug,
          category: "Facebook Page",
          objective: "Kết nối Facebook Page có sẵn từ Meta OAuth.",
          targetAudience: Prisma.JsonNull,
          brandVoice: Prisma.JsonNull,
          contentPillars: Prisma.JsonNull,
          postingRules: { approvalRequired: true, maxPostsPerDay: 2 },
          launchKit: { source: "existing_facebook_page", workspaceName: workspace.name },
          status: "SETUP",
        },
        select: { id: true },
      });
      socialPageId = page.id;
    }
    if (!socialPageId) return NextResponse.redirect(adminPublicUrl("/admin/social/pages?metaError=missing_page"));
    const page = await prisma.socialPage.findUnique({ where: { id: socialPageId }, include: { workspace: { select: { tenantId: true } } } });
    if (!page) return NextResponse.redirect(adminPublicUrl("/admin/social/pages?metaError=page_not_found"));
    await requireTenantAccess(page.workspace.tenantId, "TENANT_ADMIN");
    getMetaConfig();
    if (!tokenVaultConfigured()) throw new Error("TOKEN_ENCRYPTION_KEY chưa được cấu hình");
    const nonce = randomBytes(24).toString("base64url");
    const state = { nonce, userId: user.id, socialPageId, expiresAt: Date.now() + 10 * 60_000 };
    const response = NextResponse.redirect(buildMetaAuthorizeUrl(nonce));
    response.cookies.set("30nice_meta_oauth", sealMetaOauthState(state), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api",
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "meta_not_configured";
    return NextResponse.redirect(adminPublicUrl(`/admin/social/pages?metaError=${encodeURIComponent(message)}`));
  }
}
