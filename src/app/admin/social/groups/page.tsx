import type { Metadata } from "next";
import { ExternalLink, ShieldAlert, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SocialGroupForm, EmptySocialFormNotice } from "@/components/admin/social-forms";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSocialGroups, getSocialTenants } from "@/server/queries/social";

export const metadata: Metadata = { title: "Facebook Group Library" };

export default async function SocialGroupsPage() {
  const [tenants, groups] = await Promise.all([getSocialTenants(), getSocialGroups()]);
  const workspaces = tenants.flatMap((tenant) => tenant.socialWorkspaces.map((workspace) => ({ id: workspace.id, name: workspace.name, tenantName: tenant.name })));
  return (
    <div className="space-y-6">
      <PageHeader title="Facebook Group Library" description="Quản lý Group mục tiêu, quy tắc và chế độ phân phối an toàn theo từng workspace." />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-cyan-600" />Thêm Group</CardTitle><CardDescription>Group mới mặc định ở chế độ thủ công và cần được duyệt.</CardDescription></CardHeader>
          <CardContent>{workspaces.length ? <SocialGroupForm workspaces={workspaces} /> : <EmptySocialFormNotice label="Hãy tạo Social Workspace trước" />}</CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Danh sách Group</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {groups.length === 0 ? <div className="py-12 text-center text-sm text-slate-500">Chưa có Group nào trong thư viện.</div> : groups.map((group) => (
              <div key={group.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><div className="flex items-center gap-2"><p className="font-semibold text-slate-800">{group.name}</p>{group.groupUrl && <a href={group.groupUrl} target="_blank" rel="noreferrer" className="text-indigo-600"><ExternalLink className="h-3.5 w-3.5" /></a>}</div><p className="mt-1 text-xs text-slate-500">{group.workspace.tenant.name} · {group.workspace.name}</p></div>
                  <div className="flex gap-2"><Badge variant={group.status === "APPROVED" ? "success" : "warning"}>{group.status}</Badge><Badge variant="neutral">{group.mode}</Badge></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">{group.topics.map((topic) => <Badge key={topic} variant="info">{topic}</Badge>)}</div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500"><span>Tối đa {group.dailyPostLimit} bài/ngày · giãn {group.cooldownHours} giờ</span><span className="inline-flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5 text-amber-600" />Chưa gọi API ở Phase A</span></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
