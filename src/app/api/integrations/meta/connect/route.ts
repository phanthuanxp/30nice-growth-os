import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { requireTenantAccess } from "@/server/permissions/guard";
import { tokenVaultConfigured } from "@/server/crypto/token-vault";
import { buildMetaAuthorizeUrl, getMetaConfig } from "@/server/meta/client";
import { sealMetaOauthState } from "@/server/meta/oauth-state";
import { adminPublicUrl } from "@/server/http/public-url";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(adminPublicUrl("/login"));
  const socialPageId = request.nextUrl.searchParams.get("pageId");
  if (!socialPageId) return NextResponse.redirect(adminPublicUrl("/admin/social/pages?metaError=missing_page"));
  const page = await prisma.socialPage.findUnique({ where: { id: socialPageId }, include: { workspace: { select: { tenantId: true } } } });
  if (!page) return NextResponse.redirect(adminPublicUrl("/admin/social/pages?metaError=page_not_found"));
  try {
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
      path: "/api/integrations/meta",
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "meta_not_configured";
    return NextResponse.redirect(adminPublicUrl(`/admin/social/pages?metaError=${encodeURIComponent(message)}`));
  }
}
