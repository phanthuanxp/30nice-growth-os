import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Facebook } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/admin/page-header";
import { MetaPageSelector } from "@/components/admin/meta-page-selector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/server/db";
import { requireAuth } from "@/server/auth/session";
import { checkTenantAccess } from "@/server/permissions/guard";

export const metadata: Metadata = { title: "Chọn Facebook Page" };
const pagesSchema = z.array(z.object({ id: z.string(), name: z.string(), category: z.string().optional(), tasks: z.array(z.string()).optional() }));

export default async function MetaPageConnectPage({ searchParams }: { searchParams: Promise<{ sessionId?: string }> }) {
  const { sessionId } = await searchParams;
  const user = await requireAuth();
  if (!sessionId) notFound();
  const oauthSession = await prisma.metaOAuthSession.findFirst({
    where: { id: sessionId, userId: user.id },
    include: { socialPage: { include: { workspace: { select: { tenantId: true } } } } },
  });
  if (!oauthSession) notFound();
  const hasAccess = await checkTenantAccess(oauthSession.socialPage.workspace.tenantId, "TENANT_ADMIN");
  if (!hasAccess) redirect("/admin/social/pages?metaError=unauthorized");
  if (oauthSession.consumedAt) redirect("/admin/social/pages?metaConnected=1");
  if (oauthSession.expiresAt <= new Date()) redirect("/admin/social/pages?metaError=session_expired");
  const parsed = pagesSchema.safeParse(oauthSession.availablePages);
  if (!parsed.success) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title="Chọn Facebook Page" description={`Liên kết một Facebook Page thật với ${oauthSession.socialPage.name}.`} />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Facebook className="h-4 w-4 text-blue-600" />Page Sếp đang quản trị</CardTitle><CardDescription>Hệ thống chỉ lưu Page access token đã mã hóa. Mỗi Facebook Page chỉ được gắn với một Page nội bộ.</CardDescription></CardHeader>
        <CardContent><MetaPageSelector oauthSessionId={oauthSession.id} pages={parsed.data} /></CardContent>
      </Card>
    </div>
  );
}
