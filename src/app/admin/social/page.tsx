import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Flag, Layers3, MessagesSquare, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSocialOverview } from "@/server/queries/social";

export const metadata: Metadata = { title: "Social Growth OS" };

function statusBadge(status: string) {
  if (status === "CONNECTED" || status === "PUBLISHED" || status === "APPROVED") return "success" as const;
  if (status === "SETUP" || status === "SCHEDULED" || status === "IN_REVIEW") return "warning" as const;
  if (status === "FAILED") return "danger" as const;
  return "neutral" as const;
}

export default async function SocialDashboardPage() {
  const overview = await getSocialOverview();
  const scheduled = overview.contentCounts.SCHEDULED ?? 0;
  const review = overview.contentCounts.IN_REVIEW ?? 0;
  const approved = overview.contentCounts.APPROVED ?? 0;
  const published = overview.contentCounts.PUBLISHED ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Growth OS"
        description="Trung tâm xây dựng và vận hành nhiều Facebook Page theo từng thương hiệu, chủ đề và tenant."
        action={<Link href="/admin/social/pages" className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700">Mở Page Factory</Link>}
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Workspace", value: overview.workspaces, icon: Layers3, color: "text-indigo-600" },
          { label: "Page", value: overview.pageCount, icon: Flag, color: "text-blue-600" },
          { label: "Chờ duyệt", value: review, icon: MessagesSquare, color: "text-amber-600" },
          { label: "Đã duyệt", value: approved, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Hẹn lịch", value: scheduled, icon: CalendarClock, color: "text-violet-600" },
          { label: "Group duyệt", value: overview.groups, icon: UsersRound, color: "text-cyan-600" },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <item.icon className={`h-5 w-5 ${item.color}`} />
            <p className={`mt-3 text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Danh mục Page đang xây dựng</CardTitle></CardHeader>
          <CardContent>
            {overview.pages.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">Chưa có Page. Hãy tạo Social Workspace và Page Launch Kit đầu tiên.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {overview.pages.map((page) => (
                  <Link key={page.id} href={`/admin/social/planner?pageId=${page.id}`} className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/30">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-semibold text-slate-800">{page.name}</p><p className="mt-1 text-xs text-slate-500">{page.workspace.tenant.name} · {page.workspace.name}</p></div>
                      <Badge variant={statusBadge(page.status)}>{page.status}</Badge>
                    </div>
                    <div className="mt-4 flex gap-4 text-xs text-slate-500"><span>{page._count.plans} kế hoạch</span><span>{page._count.contents} nội dung</span></div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tiến độ nội dung</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[{ label: "Ý tưởng", value: overview.contentCounts.IDEA ?? 0 }, { label: "Chờ duyệt", value: review }, { label: "Đã duyệt", value: approved }, { label: "Đã hẹn lịch", value: scheduled }, { label: "Đã đăng", value: published }].map((row) => (
              <div key={row.label} className="flex items-center justify-between"><span className="text-sm text-slate-600">{row.label}</span><span className="text-sm font-bold text-slate-800">{row.value}</span></div>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/admin/social/planner" className="rounded-lg bg-indigo-50 px-3 py-2 text-center text-xs font-semibold text-indigo-700">Kế hoạch</Link>
              <Link href="/admin/social/groups" className="rounded-lg bg-cyan-50 px-3 py-2 text-center text-xs font-semibold text-cyan-700">Group Library</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
