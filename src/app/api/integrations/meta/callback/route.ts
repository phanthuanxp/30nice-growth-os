import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { requireTenantAccess } from "@/server/permissions/guard";
import { encryptToken } from "@/server/crypto/token-vault";
import { exchangeMetaCode, listMetaManagedPages } from "@/server/meta/client";
import { openMetaOauthState } from "@/server/meta/oauth-state";
import { adminPublicUrl } from "@/server/http/public-url";

export const dynamic = "force-dynamic";

function errorRedirect(request: NextRequest, message: string) {
  const response = NextResponse.redirect(adminPublicUrl(`/admin/social/pages?metaError=${encodeURIComponent(message.slice(0, 300))}`));
  response.cookies.delete("30nice_meta_oauth");
  return response;
}

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(adminPublicUrl("/login"));
  const errorDescription = request.nextUrl.searchParams.get("error_description");
  if (errorDescription) return errorRedirect(request, errorDescription);
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const state = openMetaOauthState(request.cookies.get("30nice_meta_oauth")?.value);
  if (!code || !state || state.nonce !== stateParam || state.userId !== user.id) return errorRedirect(request, "OAuth state không hợp lệ hoặc đã hết hạn");

  const page = await prisma.socialPage.findUnique({ where: { id: state.socialPageId }, include: { workspace: { select: { tenantId: true } } } });
  if (!page) return errorRedirect(request, "Không tìm thấy Page nội bộ");
  try {
    await requireTenantAccess(page.workspace.tenantId, "TENANT_ADMIN");
    const longToken = await exchangeMetaCode(code);
    const managedPages = await listMetaManagedPages(longToken.access_token);
    if (managedPages.length === 0) return errorRedirect(request, "Meta không trả về Page nào mà tài khoản có quyền quản trị");
    const availablePages = managedPages.map(({ access_token: _token, ...metadata }) => metadata);
    const encryptedPageTokens = Object.fromEntries(managedPages.map((item) => [item.id, encryptToken(item.access_token)]));
    const oauthSession = await prisma.metaOAuthSession.create({
      data: {
        userId: user.id,
        socialPageId: page.id,
        availablePages: JSON.parse(JSON.stringify(availablePages)) as Prisma.InputJsonValue,
        encryptedPageTokens,
        expiresAt: new Date(Date.now() + 15 * 60_000),
      },
    });
    await prisma.metaOAuthSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    const response = NextResponse.redirect(adminPublicUrl(`/admin/social/pages/connect?sessionId=${oauthSession.id}`));
    response.cookies.delete("30nice_meta_oauth");
    return response;
  } catch (error) {
    return errorRedirect(request, error instanceof Error ? error.message : "Không thể hoàn tất Meta OAuth");
  }
}
