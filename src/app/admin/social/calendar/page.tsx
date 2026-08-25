import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSocialCalendar, getSocialPages } from "@/server/queries/social";

export const metadata: Metadata = { title: "Social Calendar" };

function parseMonth(value?: string) {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    if (month >= 1 && month <= 12) return { year, month };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function monthValue(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function SocialCalendarPage({ searchParams }: { searchParams: Promise<{ pageId?: string; month?: string }> }) {
  const { pageId, month: monthParam } = await searchParams;
  const { year, month } = parseMonth(monthParam);
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  const previous = new Date(Date.UTC(year, month - 2, 1));
  const next = new Date(Date.UTC(year, month, 1));
  const [pages, contents] = await Promise.all([getSocialPages(), getSocialCalendar({ socialPageId: pageId, from, to })]);
  const firstWeekday = (from.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const hrefFor = (monthTarget: string) => `/admin/social/calendar?month=${monthTarget}${pageId ? `&pageId=${pageId}` : ""}`;
  return (
    <div className="space-y-6">
      <PageHeader title="Social Calendar" description="Theo dõi lịch nội dung của nhiều Page theo tháng, trạng thái và ngày đăng dự kiến." />
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-end md:justify-between">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="month" value={monthValue(from)} />
            <label className="space-y-1 text-xs font-semibold text-slate-600">Facebook Page
              <select name="pageId" defaultValue={pageId || ""} className="block h-9 min-w-64 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal">
                <option value="">Tất cả Page</option>
                {pages.map((page) => <option key={page.id} value={page.id}>{page.name} · {page.workspace.tenant.name}</option>)}
              </select>
            </label>
            <button className="h-9 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white">Lọc lịch</button>
          </form>
          <div className="flex items-center gap-3">
            <Link href={hrefFor(monthValue(previous))} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></Link>
            <p className="min-w-36 text-center font-semibold text-slate-800">Tháng {month}/{year}</p>
            <Link href={hrefFor(monthValue(next))} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></Link>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="grid min-w-[900px] grid-cols-7 border-b border-slate-200 bg-slate-50">
          {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"].map((label) => <div key={label} className="px-3 py-2 text-center text-xs font-semibold text-slate-500">{label}</div>)}
        </div>
        <div className="grid min-w-[900px] grid-cols-7">
          {cells.map((day, index) => {
            const dayContents = day ? contents.filter((content) => content.scheduledAt?.getUTCDate() === day) : [];
            return <div key={index} className="min-h-36 border-b border-r border-slate-100 p-2">
              {day && <><p className="mb-2 text-xs font-semibold text-slate-500">{day}</p>{dayContents.map((content) => (
                <Link key={content.id} href={`/admin/social/planner/${content.id}`} className="mb-2 block rounded-lg bg-indigo-50 p-2 transition hover:bg-indigo-100">
                  <div className="flex items-start justify-between gap-1"><p className="line-clamp-2 text-xs font-semibold text-indigo-900">{content.title || content.topic}</p><Pencil className="h-3 w-3 shrink-0 text-indigo-500" /></div>
                  <p className="mt-1 truncate text-[10px] text-indigo-600">{content.socialPage.name}</p>
                  <Badge variant={content.status === "APPROVED" || content.status === "SCHEDULED" ? "success" : content.status === "IN_REVIEW" ? "warning" : "neutral"}>{content.status}</Badge>
                </Link>
              ))}</>}
            </div>;
          })}
        </div>
      </div>
      {contents.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center"><CalendarDays className="mx-auto h-6 w-6 text-slate-400" /><p className="mt-2 text-sm text-slate-500">Tháng này chưa có nội dung được lên lịch.</p></div>}
    </div>
  );
}
