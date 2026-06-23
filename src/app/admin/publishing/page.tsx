import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, KanbanSquare, Newspaper, Clock } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/server/db";
import { BulkScheduleForm, ScheduleItemForm } from "@/components/admin/publishing-controls";
import { GenerateMissingDraftsForm, GenerateSingleDraftButton } from "@/components/admin/generate-plan-drafts";

export const metadata: Metadata = { title: "Publishing Calendar" };

type BoardItem = {
  id: string;
  title: string;
  keyword: string;
  status: string;
  priority: number;
  scheduledAt: Date | null;
  postId: string | null;
  postQuality?: { qualityScore: number | null; seoScore: number | null } | null;
  planTitle: string;
  siteName: string | null;
};

const COLUMNS = [
  { key: "PLANNED", label: "Planned", variant: "neutral" as const },
  { key: "DRAFT", label: "Draft", variant: "info" as const },
  { key: "SCHEDULED", label: "Scheduled", variant: "warning" as const },
  { key: "PUBLISHED", label: "Published", variant: "success" as const },
];

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function statusVariant(status: string) {
  if (status === "PUBLISHED") return "success";
  if (status === "SCHEDULED") return "warning";
  if (status === "DRAFT") return "info";
  return "neutral";
}

export default async function PublishingPage({ searchParams }: { searchParams?: Promise<{ tenantId?: string; status?: string }> }) {
  const params = await searchParams;
  const tenantFilter = params?.tenantId || "";
  const statusFilter = params?.status || "";
  let items: BoardItem[] = [];
  let scheduledArticles: { id: string; title: string | null; scheduledPublishAt: Date | null; draftPostId: string | null; tenant: { name: string } | null }[] = [];
  let tenants: { id: string; name: string }[] = [];
  let isDemo = false;

  try {
    const [planItems, articles, tenantRows] = await Promise.all([
      prisma.contentPlanItem.findMany({
        where: { status: statusFilter ? statusFilter as never : { in: ["PLANNED", "DRAFT", "SCHEDULED", "PUBLISHED"] }, contentPlan: tenantFilter ? { tenantId: tenantFilter } : undefined },
        orderBy: [{ status: "asc" }, { priority: "desc" }, { scheduledAt: "asc" }],
        take: 200,
        include: { contentPlan: { include: { tenant: { select: { name: true } } } } },
      }),
      prisma.sourceArticle.findMany({
        where: { status: { in: ["SCHEDULED", "DRAFT_CREATED", "PUBLISHED"] }, tenantId: tenantFilter || undefined },
        orderBy: [{ scheduledPublishAt: "asc" }, { updatedAt: "desc" }],
        take: 100,
        include: { tenant: { select: { name: true } } },
      }),
      prisma.tenant.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    ]);
    tenants = tenantRows;
    const postIds = planItems.map((item) => item.postId).filter(Boolean) as string[];
    const qualityPosts = postIds.length ? await prisma.post.findMany({ where: { id: { in: postIds } }, select: { id: true, qualityScore: true, seoScore: true } }) : [];
    const qualityMap = new Map(qualityPosts.map((post) => [post.id, post]));
    items = planItems.map((item) => ({
      id: item.id,
      title: item.title,
      keyword: item.keyword,
      status: item.status,
      priority: item.priority,
      scheduledAt: item.scheduledAt,
      postId: item.postId,
      postQuality: item.postId ? qualityMap.get(item.postId) ?? null : null,
      planTitle: item.contentPlan.title,
      siteName: item.contentPlan.tenant?.name ?? null,
    }));
    scheduledArticles = articles;
  } catch {
    isDemo = true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const calendarEntries = [
    ...items.filter((i) => i.scheduledAt).map((i) => ({ id: i.id, title: i.title, site: i.siteName, date: i.scheduledAt!, status: i.status, type: "plan" })),
    ...scheduledArticles.filter((a) => a.scheduledPublishAt).map((a) => ({ id: a.id, title: a.title || "Untitled draft", site: a.tenant?.name ?? null, date: a.scheduledPublishAt!, status: "SCHEDULED", type: "article" })),
  ];

  const summary = {
    planned: items.filter((i) => i.status === "PLANNED").length,
    draft: items.filter((i) => i.status === "DRAFT").length,
    scheduled: items.filter((i) => i.status === "SCHEDULED").length + scheduledArticles.filter((a) => a.scheduledPublishAt).length,
    published: items.filter((i) => i.status === "PUBLISHED").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Publishing Calendar" description="Theo dõi content plan, draft, lịch đăng và trạng thái xuất bản cho mạng lưới site/subdomain." />

      {isDemo && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Cần database/migration để xem publishing calendar thật.</div>}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Planned", value: summary.planned, icon: KanbanSquare, color: "text-slate-600" },
          { label: "Draft", value: summary.draft, icon: Newspaper, color: "text-indigo-600" },
          { label: "Scheduled", value: summary.scheduled, icon: Clock, color: "text-amber-600" },
          { label: "Published", value: summary.published, icon: CalendarDays, color: "text-emerald-600" },
        ].map((s) => <Card key={s.label} className="p-4"><s.icon className={`mb-2 h-5 w-5 ${s.color}`} /><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-slate-500">{s.label}</p></Card>)}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-500" />Scheduling Controls</CardTitle><CardDescription>Bulk schedule các item Planned/Draft theo site và tần suất đăng.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2"><BulkScheduleForm tenants={tenants} /><GenerateMissingDraftsForm tenants={tenants} /></div>
          <form className="flex flex-wrap items-center gap-3" action="/admin/publishing">
            <select name="tenantId" defaultValue={tenantFilter} className="h-9 rounded-lg border border-slate-300 px-3 text-sm"><option value="">All sites</option>{tenants.map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
            <select name="status" defaultValue={statusFilter} className="h-9 rounded-lg border border-slate-300 px-3 text-sm"><option value="">All statuses</option>{COLUMNS.map((c)=><option key={c.key} value={c.key}>{c.label}</option>)}</select>
            <button className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50" type="submit">Filter</button>
            <Link className="text-sm text-slate-500 hover:text-slate-800" href="/admin/publishing">Reset</Link>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-500" />14-day Publishing Calendar</CardTitle><CardDescription>Bài đã schedule từ review queue hoặc content plan.</CardDescription></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-7">
            {days.map((day) => {
              const entries = calendarEntries.filter((e) => dayKey(e.date) === dayKey(day));
              return (
                <div key={dayKey(day)} className="min-h-32 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-xs font-semibold text-slate-700">{day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                  <div className="mt-2 space-y-2">
                    {entries.length === 0 ? <p className="text-[11px] text-slate-400">No posts</p> : entries.map((entry) => (
                      <div key={`${entry.type}-${entry.id}`} className="rounded-lg bg-white p-2 shadow-sm">
                        <p className="line-clamp-2 text-[11px] font-medium text-slate-700">{entry.title}</p>
                        <div className="mt-1 flex items-center justify-between gap-2"><span className="truncate text-[10px] text-slate-400">{entry.site || "Global"}</span><Badge variant={statusVariant(entry.status)}>{entry.status}</Badge></div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const colItems = items.filter((i) => i.status === col.key).slice(0, 40);
          return (
            <Card key={col.key}>
              <CardHeader><CardTitle className="flex items-center justify-between text-sm"><span>{col.label}</span><Badge variant={col.variant}>{colItems.length}</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {colItems.length === 0 ? <p className="text-sm text-slate-400">No items</p> : colItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800 line-clamp-2">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.keyword}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400"><span>{item.siteName || "No site"}</span><span>Priority {item.priority}</span>{item.scheduledAt && <span>{item.scheduledAt.toLocaleDateString("vi-VN")}</span>}</div>
                    {item.postQuality && <div className="mt-2 flex flex-wrap gap-2"><Badge variant={(item.postQuality.qualityScore ?? 0) >= 75 ? "success" : "warning"}>Quality {item.postQuality.qualityScore ?? "—"}</Badge><Badge variant={(item.postQuality.seoScore ?? 0) >= 75 ? "success" : "warning"}>SEO {item.postQuality.seoScore ?? "—"}</Badge></div>}
                    {item.postId && <Link className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:underline" href={`/admin/blog/${item.postId}`}>Open draft/post →</Link>}
                    <GenerateSingleDraftButton itemId={item.id} disabled={Boolean(item.postId) || item.status === "PUBLISHED"} />
                    {item.status !== "PUBLISHED" && <ScheduleItemForm itemId={item.id} current={item.scheduledAt} />}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
