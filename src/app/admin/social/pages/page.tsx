import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BarChart3, Edit3, ExternalLink, Eye, Facebook, FileText, Flag, Layers3, Link2, RefreshCw, ShieldCheck, Unplug } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SocialPageForm, SocialWorkspaceForm, EmptySocialFormNotice } from "@/components/admin/social-forms";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSocialPages, getSocialTenants } from "@/server/queries/social";
import { disconnectMetaPageAction } from "@/server/actions/social-meta";
import { SocialPageSyncButton } from "@/components/admin/social-page-sync-button";
import { getMetaConfigurationStatus, META_PUBLISH_SCOPES, META_READ_SCOPES } from "@/server/meta/client";
import { tokenVaultConfigured } from "@/server/crypto/token-vault";

export const metadata: Metadata = { title: "Multi-Page Management" };

type LaunchKit = { positioning?: string; promise?: string; description?: string; usernameSuggestion?: string; usernameSuggestions?: string[]; pillars?: { key: string; label: string; ratio: number }[]; meta?: { avatarUrl?: string; lastSyncedAt?: string; webhookStatus?: string; tokenHealth?: string } };

function fmt(value?: Date | string | null) {
  if (!value) return "Chưa có";
  return new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" });
}

function statusInfo(page: Awaited<ReturnType<typeof getSocialPages>>[number], missingRead: string[]) {
  if (!page.connection) return { label: "Needs Reconnect", variant: "warning" as const };
  if (page.connection.tokenExpiresAt && page.connection.tokenExpiresAt <= new Date()) return { label: "Token Expired", variant: "danger" as const };
  if (missingRead.length) return { label: "Permission Missing", variant: "danger" as const };
  if (page.connection.connectionStatus !== "CONNECTED") return { label: "Needs Reconnect", variant: "warning" as const };
  return { label: "Connected", variant: "success" as const };
}

export default async function SocialPagesPage({ searchParams }: { searchParams: Promise<{ metaError?: string; metaConnected?: string }> }) {
  const query = await searchParams;
  const [tenants, pages] = await Promise.all([getSocialTenants(), getSocialPages()]);
  const meta = getMetaConfigurationStatus();
  const metaReady = meta.appId && meta.appSecret && tokenVaultConfigured();
  const workspaces = tenants.flatMap((tenant) => tenant.socialWorkspaces.map((workspace) => ({ id: workspace.id, name: workspace.name, tenantName: tenant.name })));
  const connectedCount = pages.filter((page) => page.connection && page.externalPageId).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Multi-Page Management" description="Dashboard quản lý nhiều Facebook Page theo tenant/workspace, token health, scopes và webhook." />
      {query.metaConnected && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">Facebook Page đã được kết nối và token đã được mã hóa thành công.</div>}
      {query.metaError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">Không thể kết nối Meta: {query.metaError}</div>}
      {!metaReady && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><p className="font-semibold">Meta Integration chưa đủ cấu hình</p><p className="mt-1">Cần cấu hình Meta App ID, App Secret và Token Encryption Key trong Settings. Callback: <code>{meta.redirectUri}</code></p></div>}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="py-4"><p className="text-xs text-slate-500">Total Pages</p><p className="text-2xl font-bold text-slate-900">{pages.length}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-slate-500">Connected</p><p className="text-2xl font-bold text-emerald-700">{connectedCount}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-slate-500">Publish Scope</p><p className="text-sm font-semibold text-slate-800">{meta.requestPublishScope ? "Requested" : "Not requested"}</p></CardContent></Card>
        <Card><CardContent className="py-4"><p className="text-xs text-slate-500">Webhook Token</p><p className="text-sm font-semibold text-slate-800">{meta.webhookVerifyToken ? "Configured" : "Missing"}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-indigo-600" />Social Workspace</CardTitle><CardDescription>Mỗi tenant có thể có nhiều cụm Page độc lập.</CardDescription></CardHeader>
          <CardContent>{tenants.length ? <SocialWorkspaceForm tenants={tenants.map((tenant) => ({ id: tenant.id, name: tenant.name }))} /> : <EmptySocialFormNotice label="Cần ít nhất một tenant" />}</CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-4 w-4 text-blue-600" />Kết nối Facebook Page có sẵn</CardTitle><CardDescription>Chọn workspace rồi đăng nhập Meta để chọn Page sếp đang quản trị.</CardDescription></CardHeader>
          <CardContent>
            {workspaces.length ? (
              <form action="/api/meta/login" className="space-y-3">
                <select name="workspaceId" required className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800">{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name} · {workspace.tenantName}</option>)}</select>
                <button disabled={!metaReady} className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold ${metaReady ? "bg-blue-600 text-white hover:bg-blue-700" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}><Facebook className="h-4 w-4" /> Kết nối Page Facebook có sẵn</button>
                <p className="text-xs text-slate-500">Không yêu cầu quyền đăng bài mặc định; nếu thiếu publish scope, UI chỉ báo Publishing unavailable.</p>
              </form>
            ) : <EmptySocialFormNotice label="Hãy tạo Social Workspace trước" />}
          </CardContent>
        </Card>
      </div>

      <details className="rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">Tùy chọn nâng cao: tạo Page Launch Kit mới</summary>
        <div className="mt-4">{workspaces.length ? <SocialPageForm workspaces={workspaces} /> : <EmptySocialFormNotice label="Hãy tạo Social Workspace trước" />}</div>
      </details>

      <div className="grid gap-4 xl:grid-cols-2">
        {pages.map((page) => {
          const kit = (page.launchKit ?? {}) as LaunchKit;
          const scopes = page.connection?.grantedScopes ?? [];
          const missingRead = META_READ_SCOPES.filter((scope) => !scopes.includes(scope));
          const missingPublish = META_PUBLISH_SCOPES.filter((scope) => !scopes.includes(scope));
          const canPublish = missingPublish.length === 0 || scopes.includes("task:CREATE_CONTENT");
          const status = statusInfo(page, missingRead);
          const webhookActive = kit.meta?.webhookStatus === "ACTIVE";
          return (
            <Card key={page.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">{kit.meta?.avatarUrl ? <Image src={kit.meta.avatarUrl} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized /> : <div className="flex h-full w-full items-center justify-center"><Facebook className="h-6 w-6 text-blue-500" /></div>}</div>
                  <div className="min-w-0 flex-1"><CardTitle className="truncate">{page.name}</CardTitle><CardDescription>{page.workspace.tenant.name} · {page.workspace.name}</CardDescription><p className="mt-1 text-xs text-slate-500">Facebook Page ID: {page.externalPageId || "Chưa kết nối"}</p></div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Category</p><p className="mt-1 text-slate-800">{page.category || "Facebook Page"}</p></div>
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Token Health</p><p className="mt-1 text-slate-800">{status.label}</p></div>
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Last Validated</p><p className="mt-1 text-slate-800">{fmt(page.connection?.lastValidatedAt)}</p></div>
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Last Synced</p><p className="mt-1 text-slate-800">{fmt(kit.meta?.lastSyncedAt || page.updatedAt)}</p></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={webhookActive ? "success" : "warning"}>{webhookActive ? "Webhook Active" : "Webhook Error"}</Badge>
                  <Badge variant={canPublish ? "success" : "warning"}>{canPublish ? "canPublish" : "Publishing unavailable"}</Badge>
                  {page.connection ? <Badge variant="info">{page.connection.connectionStatus}</Badge> : <Badge variant="warning">Needs Reconnect</Badge>}
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-500">Granted scopes</p>
                  <div className="flex flex-wrap gap-1.5">{scopes.length ? scopes.map((scope) => <Badge key={scope} variant="neutral">{scope}</Badge>) : <span className="text-xs text-slate-400">Chưa có</span>}</div>
                </div>
                {(missingRead.length || missingPublish.length) && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><p className="font-semibold">Missing scopes</p>{missingRead.length > 0 && <p>Read/admin: {missingRead.join(", ")}</p>}{missingPublish.length > 0 && <p>Publish: {missingPublish.join(", ")} — Publishing unavailable, không lỗi.</p>}</div>}
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {page.pageUrl && <a href={page.pageUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700"><Eye className="h-3.5 w-3.5" /> View</a>}
                  {page.externalPageId && <SocialPageSyncButton pageId={page.id} />}
                  <Link href={metaReady ? `/api/integrations/meta/connect?pageId=${page.id}` : "#"} className={`inline-flex h-8 items-center gap-1 rounded-md px-3 text-xs font-medium ${metaReady ? "bg-blue-600 text-white hover:bg-blue-700" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}><RefreshCw className="h-3.5 w-3.5" /> Reconnect</Link>
                  {page.connection && <form action={disconnectMetaPageAction.bind(null, page.id)}><button className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 px-3 text-xs font-medium text-red-600"><Unplug className="h-3.5 w-3.5" /> Disconnect</button></form>}
                  <Link href={`/admin/social/pages/${page.id}/posts`} className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700"><FileText className="h-3.5 w-3.5" /> View Posts</Link>
                  <Link href={`/admin/social/analytics?pageId=${page.id}`} className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700"><BarChart3 className="h-3.5 w-3.5" /> View Insights</Link>
                  <Link href="/admin/social/planner" className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700"><Edit3 className="h-3.5 w-3.5" /> Create Draft</Link>
                  {page.pageUrl && <a href={page.pageUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700"><ExternalLink className="h-3.5 w-3.5" /> Facebook</a>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
