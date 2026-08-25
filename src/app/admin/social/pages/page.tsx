import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Facebook, Flag, Layers3, RefreshCw, Rocket, ShieldCheck, Unplug } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SocialPageForm, SocialWorkspaceForm, EmptySocialFormNotice } from "@/components/admin/social-forms";
import { SocialStrategyAiButton } from "@/components/admin/social-ai-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSocialPages, getSocialTenants } from "@/server/queries/social";
import { disconnectMetaPageAction, validateMetaConnectionAction } from "@/server/actions/social-meta";
import { getMetaConfigurationStatus } from "@/server/meta/client";
import { tokenVaultConfigured } from "@/server/crypto/token-vault";

export const metadata: Metadata = { title: "Page Factory" };

type LaunchKit = { positioning?: string; promise?: string; description?: string; usernameSuggestion?: string; usernameSuggestions?: string[]; pillars?: { key: string; label: string; ratio: number }[] };

export default async function SocialPagesPage({ searchParams }: { searchParams: Promise<{ metaError?: string; metaConnected?: string }> }) {
  const query = await searchParams;
  const [tenants, pages] = await Promise.all([getSocialTenants(), getSocialPages()]);
  const meta = getMetaConfigurationStatus();
  const metaReady = meta.appId && meta.appSecret && tokenVaultConfigured();
  const workspaces = tenants.flatMap((tenant) => tenant.socialWorkspaces.map((workspace) => ({ id: workspace.id, name: workspace.name, tenantName: tenant.name })));

  return (
    <div className="space-y-6">
      <PageHeader title="Page Factory" description="Thiết kế định vị, nhận diện và nền nội dung cho nhiều Facebook Page theo từng chủ đề." />
      {query.metaConnected && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">Facebook Page đã được kết nối và token đã được mã hóa thành công.</div>}
      {query.metaError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">Không thể kết nối Meta: {query.metaError}</div>}
      {!metaReady && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><p className="font-semibold">Meta Publisher đang khóa an toàn</p><p className="mt-1">Cần cấu hình META_APP_ID, META_APP_SECRET và TOKEN_ENCRYPTION_KEY trên VPS trước khi kết nối Facebook thật. Callback: <code>{meta.redirectUri}</code></p></div>}
      {metaReady && !meta.webhookVerifyToken && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Publisher có thể kết nối, nhưng META_WEBHOOK_VERIFY_TOKEN chưa được cấu hình nên Meta Webhook chưa thể xác minh.</div>}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-indigo-600" />1. Social Workspace</CardTitle><CardDescription>Mỗi tenant có thể có nhiều cụm Page độc lập.</CardDescription></CardHeader>
          <CardContent>{tenants.length ? <SocialWorkspaceForm tenants={tenants.map((tenant) => ({ id: tenant.id, name: tenant.name }))} /> : <EmptySocialFormNotice label="Cần ít nhất một tenant" />}</CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Rocket className="h-4 w-4 text-emerald-600" />2. Tạo Page Launch Kit</CardTitle><CardDescription>Tạo định vị, mô tả, content pillars và quy tắc duyệt cho Page mới.</CardDescription></CardHeader>
          <CardContent>{workspaces.length ? <SocialPageForm workspaces={workspaces} /> : <EmptySocialFormNotice label="Hãy tạo Social Workspace trước" />}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {pages.map((page) => {
          const kit = (page.launchKit ?? {}) as LaunchKit;
          return (
            <Card key={page.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div><CardTitle className="flex items-center gap-2"><Flag className="h-4 w-4 text-blue-600" />{page.name}</CardTitle><CardDescription>{page.workspace.tenant.name} · {page.workspace.name}</CardDescription></div>
                  <Badge variant={page.status === "CONNECTED" ? "success" : page.status === "SETUP" ? "warning" : "neutral"}>{page.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-slate-600">{kit.positioning || page.objective}</p>
                {kit.promise && <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3"><p className="text-xs font-semibold text-indigo-600">Lời hứa giá trị</p><p className="mt-1 text-sm text-indigo-900">{kit.promise}</p></div>}
                <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Mô tả đề xuất</p><p className="mt-1 text-sm text-slate-700">{kit.description || "Chưa có mô tả"}</p></div>
                <div className="flex flex-wrap gap-2">{kit.pillars?.map((pillar) => <Badge key={pillar.key} variant="info">{pillar.label} · {pillar.ratio}%</Badge>)}</div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500"><span>@{kit.usernameSuggestions?.[0] || kit.usernameSuggestion || page.slug}</span><span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />Duyệt trước khi đăng</span></div>
                <SocialStrategyAiButton pageId={page.id} />
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold text-slate-700">Kết nối Meta</p><p className="mt-1 text-xs text-slate-500">{page.connection ? `${page.connection.connectionStatus} · kiểm tra ${page.connection.lastValidatedAt?.toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" }) || "chưa có"}` : "Chưa kết nối Facebook Page thật"}</p></div>{page.connection && <Badge variant={page.connection.connectionStatus === "CONNECTED" ? "success" : "danger"}>{page.connection.connectionStatus}</Badge>}</div>
                  {page.pageUrl && <a href={page.pageUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600"><ExternalLink className="h-3 w-3" />Mở Facebook Page</a>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link aria-disabled={!metaReady} href={metaReady ? `/api/integrations/meta/connect?pageId=${page.id}` : "#"} className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium ${metaReady ? "bg-blue-600 text-white hover:bg-blue-700" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}><Facebook className="h-3.5 w-3.5" />{page.connection ? "Kết nối lại" : "Kết nối Facebook"}</Link>
                    {page.connection && <form action={validateMetaConnectionAction.bind(null, page.id)}><button className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700"><RefreshCw className="h-3.5 w-3.5" />Kiểm tra quyền</button></form>}
                    {page.connection && <form action={disconnectMetaPageAction.bind(null, page.id)}><button className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 px-3 text-xs font-medium text-red-600"><Unplug className="h-3.5 w-3.5" />Ngắt kết nối</button></form>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
