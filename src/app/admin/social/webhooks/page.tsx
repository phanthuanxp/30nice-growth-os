import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Clock3, Webhook } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getSocialWebhookDiagnostics } from "@/server/queries/social";

export const metadata: Metadata = { title: "Social Webhooks" };

function safePayloadSummary(payload: unknown) {
  const text = JSON.stringify(payload ?? {});
  return text.replace(/access_token|pageAccessToken|encryptedToken|app_secret/gi, "[redacted]").slice(0, 240);
}

export default async function SocialWebhooksPage() {
  const { pages, events, byPage } = await getSocialWebhookDiagnostics();
  const pending = events.filter((event) => !event.processedAt && !event.errorMessage).length;
  const failed = events.filter((event) => event.errorMessage).length;
  const processed = events.filter((event) => event.processedAt && !event.errorMessage).length;
  return (
    <div className="space-y-6">
      <PageHeader title="Webhook Diagnostics" description="Theo dõi trạng thái webhook Meta theo từng Page, queue xử lý và lỗi an toàn. Không hiển thị secret/raw token." />
      <div className="grid gap-3 md:grid-cols-4"><Card><CardContent className="py-4"><p className="text-xs text-slate-500">Pages</p><p className="text-2xl font-semibold">{pages.length}</p></CardContent></Card><Card><CardContent className="py-4"><p className="text-xs text-slate-500">Pending</p><p className="text-2xl font-semibold">{pending}</p></CardContent></Card><Card><CardContent className="py-4"><p className="text-xs text-slate-500">Processed</p><p className="text-2xl font-semibold">{processed}</p></CardContent></Card><Card><CardContent className="py-4"><p className="text-xs text-slate-500">Failed</p><p className="text-2xl font-semibold">{failed}</p></CardContent></Card></div>
      <div className="grid gap-4 xl:grid-cols-2">{pages.map((page) => {
        const meta = page.launchKit && typeof page.launchKit === "object" && !Array.isArray(page.launchKit) ? (page.launchKit as { meta?: { webhookStatus?: string; lastWebhookProcessedAt?: string; lastWebhookError?: string } }).meta : undefined;
        const pageEvents = page.externalPageId ? byPage.get(page.externalPageId) ?? [] : [];
        const last = pageEvents[0];
        const pagePending = pageEvents.filter((event) => !event.processedAt && !event.errorMessage).length;
        const pageFailed = pageEvents.filter((event) => event.errorMessage).length;
        return <Card key={page.id}><CardHeader><CardTitle className="flex items-start justify-between gap-3"><span className="min-w-0 truncate">{page.name}</span><Badge variant={meta?.webhookStatus === "ACTIVE" ? "success" : "warning"}>{meta?.webhookStatus || "UNKNOWN"}</Badge></CardTitle><CardDescription className="truncate">Page ID {page.externalPageId} · {page.workspace.tenant.name}</CardDescription></CardHeader><CardContent className="space-y-3 text-sm"><div className="grid gap-2 sm:grid-cols-2"><p><span className="text-slate-500">Subscribed fields:</span> feed</p><p><span className="text-slate-500">Pending:</span> {pagePending}</p><p><span className="text-slate-500">Failed:</span> {pageFailed}</p><p><span className="text-slate-500">Last received:</span> {last?.createdAt.toLocaleString("vi-VN") || "—"}</p><p><span className="text-slate-500">Last processed:</span> {last?.processedAt?.toLocaleString("vi-VN") || meta?.lastWebhookProcessedAt || "—"}</p><p className="truncate"><span className="text-slate-500">Last error:</span> {last?.errorMessage || meta?.lastWebhookError || "—"}</p></div></CardContent></Card>;
      })}</div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Webhook className="h-4 w-4" />Recent Webhook Events</CardTitle><CardDescription>Payload summary is sanitized; secret/token markers are redacted.</CardDescription></CardHeader><CardContent className="space-y-3">{events.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">Chưa có webhook event.</p> : events.map((event) => <div key={event.id} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex min-w-0 flex-wrap items-center gap-2"><Badge variant={event.errorMessage ? "danger" : event.processedAt ? "success" : "warning"}>{event.errorMessage ? "FAILED" : event.processedAt ? "PROCESSED" : "PENDING"}</Badge><span className="text-sm font-medium text-slate-800">{event.field || "unknown"}</span><span className="text-xs text-slate-500">Page {event.externalPageId || "—"}</span></div><span className="text-xs text-slate-400">{event.createdAt.toLocaleString("vi-VN")}</span></div><div className="mt-2 flex items-center gap-2 text-xs text-slate-500">{event.errorMessage ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> : event.processedAt ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Clock3 className="h-3.5 w-3.5 text-amber-500" />}<span>processed: {event.processedAt?.toLocaleString("vi-VN") || "—"}</span></div>{event.errorMessage && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{event.errorMessage}</p>}<p className="mt-2 break-words rounded-lg bg-slate-50 p-2 text-xs text-slate-500">{safePayloadSummary(event.payload)}</p></div>)}</CardContent></Card>
    </div>
  );
}
