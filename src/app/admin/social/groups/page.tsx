import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ShieldAlert, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SocialGroupForm, EmptySocialFormNotice } from "@/components/admin/social-forms";
import { SocialGroupEditor, SocialGroupModeActions, SocialGroupStatusActions } from "@/components/admin/social-group-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getGroupDistributionQueue, getSocialGroups, getSocialTenants } from "@/server/queries/social";

export const metadata: Metadata = { title: "Facebook Group Library" };

const DATE_OPTIONS = { timeZone: "Asia/Bangkok" } as const;

function statusVariant(status: string) {
  if (status === "APPROVED") return "success" as const;
  if (status === "REJECTED") return "danger" as const;
  if (status === "PAUSED") return "warning" as const;
  return "neutral" as const;
}

function targetVariant(status: string) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  if (status === "MANUAL_REQUIRED") return "warning" as const;
  return "neutral" as const;
}

function rulesText(rules: unknown): string {
  if (rules && typeof rules === "object" && !Array.isArray(rules)) {
    const summary = (rules as Record<string, unknown>).summary;
    if (typeof summary === "string") return summary;
  }
  return "";
}

export default async function SocialGroupsPage() {
  const [tenants, groups, queue] = await Promise.all([getSocialTenants(), getSocialGroups(), getGroupDistributionQueue()]);
  const workspaces = tenants.flatMap((tenant) => tenant.socialWorkspaces.map((workspace) => ({ id: workspace.id, name: workspace.name, tenantName: tenant.name })));

  return (
    <div className="space-y-6">
      <PageHeader title="Facebook Group Library" description="Quản lý Group mục tiêu, quy tắc và chế độ phân phối an toàn theo từng workspace." />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-cyan-600" />Thêm Group</CardTitle>
            <CardDescription>Group mới mặc định ở chế độ thủ công và cần được duyệt.</CardDescription>
          </CardHeader>
          <CardContent>{workspaces.length ? <SocialGroupForm workspaces={workspaces} /> : <EmptySocialFormNotice label="Hãy tạo Social Workspace trước" />}</CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Danh sách Group</CardTitle>
            <CardDescription>Chỉ Group đã duyệt mới được đưa vào hàng chờ phân phối.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groups.length === 0 ? <div className="py-12 text-center text-sm text-slate-500">Chưa có Group nào trong thư viện.</div> : groups.map((group) => (
              <details key={group.id} className="rounded-xl border border-slate-200 p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800">{group.name}</p>
                        {group.groupUrl && <a href={group.groupUrl} target="_blank" rel="noreferrer" className="text-indigo-600"><ExternalLink className="h-3.5 w-3.5" /></a>}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{group.workspace.tenant.name} · {group.workspace.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={statusVariant(group.status)}>{group.status}</Badge>
                      <Badge variant="neutral">{group.mode}</Badge>
                      {group.mode === "API_ALLOWED" && !group.apiVerifiedAt && <Badge variant="warning">Chưa xác minh</Badge>}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">{group.topics.map((topic) => <Badge key={topic} variant="info">{topic}</Badge>)}</div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>
                      Tối đa {group.dailyPostLimit} bài/ngày · giãn {group.cooldownHours} giờ · hôm nay {group.postsToday} bài
                      {group.lastPostedAt && ` · gần nhất ${group.lastPostedAt.toLocaleString("vi-VN", DATE_OPTIONS)}`}
                    </span>
                    {(!group.allowLinks || !group.allowPromotion) && (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {[!group.allowLinks && "cấm liên kết", !group.allowPromotion && "cấm chào bán"].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                  {group.statusReason && <p className="mt-2 text-xs text-amber-700">{group.statusReason}</p>}
                </summary>

                <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2">
                  <SocialGroupEditor group={{
                    id: group.id,
                    name: group.name,
                    groupUrl: group.groupUrl ?? "",
                    externalGroupId: group.externalGroupId ?? "",
                    topics: group.topics.join(", "),
                    rules: rulesText(group.rules),
                    dailyPostLimit: group.dailyPostLimit,
                    cooldownHours: group.cooldownHours,
                    allowLinks: group.allowLinks,
                    allowPromotion: group.allowPromotion,
                    mode: group.mode,
                    apiVerified: Boolean(group.apiVerifiedAt),
                  }} />
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái duyệt</p>
                      <SocialGroupStatusActions groupId={group.id} status={group.status} />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Chế độ phân phối</p>
                      <SocialGroupModeActions group={{ id: group.id, mode: group.mode, apiVerified: Boolean(group.apiVerifiedAt) }} />
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hàng chờ phân phối Group</CardTitle>
          <CardDescription>Mỗi Group nhận một caption biến thể riêng. Group thủ công cần người thao tác và đánh dấu đã đăng.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.length === 0 ? <div className="py-10 text-center text-sm text-slate-500">Chưa có bài nào được phân phối vào Group.</div> : queue.map((target) => (
            <div key={target.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/admin/social/planner/${target.content.id}`} className="font-medium text-indigo-600 hover:text-indigo-800">
                    {target.content.title || target.content.topic}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {target.socialPage.name} → {target.socialGroup?.name ?? "Group đã xoá"}
                    {target.scheduledAt && ` · ${target.scheduledAt.toLocaleString("vi-VN", DATE_OPTIONS)}`}
                  </p>
                </div>
                <Badge variant={targetVariant(target.status)}>{target.status}</Badge>
              </div>
              {target.captionOverride && <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-slate-600">{target.captionOverride}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs">
                {target.externalPostUrl && <a href={target.externalPostUrl} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 hover:text-indigo-800">Xem bài đã đăng</a>}
                {target.errorMessage && <span className="text-amber-700">{target.errorMessage}</span>}
                <Link href={`/admin/social/planner/${target.content.id}`} className="ml-auto font-medium text-slate-500 hover:text-slate-700">Mở bài để xử lý</Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
