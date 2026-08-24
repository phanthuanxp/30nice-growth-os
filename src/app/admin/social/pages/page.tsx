import type { Metadata } from "next";
import { Flag, Layers3, Rocket, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SocialPageForm, SocialWorkspaceForm, EmptySocialFormNotice } from "@/components/admin/social-forms";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSocialPages, getSocialTenants } from "@/server/queries/social";

export const metadata: Metadata = { title: "Page Factory" };

type LaunchKit = { positioning?: string; description?: string; usernameSuggestion?: string; pillars?: { key: string; label: string; ratio: number }[] };

export default async function SocialPagesPage() {
  const [tenants, pages] = await Promise.all([getSocialTenants(), getSocialPages()]);
  const workspaces = tenants.flatMap((tenant) => tenant.socialWorkspaces.map((workspace) => ({ id: workspace.id, name: workspace.name, tenantName: tenant.name })));

  return (
    <div className="space-y-6">
      <PageHeader title="Page Factory" description="Thiết kế định vị, nhận diện và nền nội dung cho nhiều Facebook Page theo từng chủ đề." />

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
                <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-500">Mô tả đề xuất</p><p className="mt-1 text-sm text-slate-700">{kit.description || "Chưa có mô tả"}</p></div>
                <div className="flex flex-wrap gap-2">{kit.pillars?.map((pillar) => <Badge key={pillar.key} variant="info">{pillar.label} · {pillar.ratio}%</Badge>)}</div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500"><span>@{kit.usernameSuggestion || page.slug}</span><span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />Duyệt trước khi đăng</span></div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
