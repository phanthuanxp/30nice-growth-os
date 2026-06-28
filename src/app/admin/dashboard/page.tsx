import type { Metadata } from "next";
import Link from "next/link";
import {
  Globe,
  FileText,
  BookOpen,
  Users,
  TrendingUp,
  Search,
  BarChart2,
  Megaphone,
  Palette,
  Image,
  Menu,
  Workflow,
  UploadCloud,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats, getTenantsWithCounts } from "@/server/queries/dashboard";
import { getPageviewsByDay, getLeadsByDay } from "@/server/queries/analytics";
import { tenants as demoTenants, pages as demoPages, posts as demoPosts, leads as demoLeads } from "@/server/queries/demo-data";
import { BarChart } from "@/components/admin/charts/bar-chart";
import { LineChart } from "@/components/admin/charts/line-chart";
import { SingleDonut } from "@/components/admin/charts/donut-chart";

export const metadata: Metadata = { title: "Bảng điều khiển" };

function shortDate(d: string) {
  const parts = d.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
}

function statusVariant(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "PAUSED") return "warning" as const;
  return "neutral" as const;
}

export default async function DashboardPage() {
  let stats = {
    totalSites: demoTenants.length,
    publishedPages: demoPages.filter((p) => p.status === "PUBLISHED").length,
    publishedPosts: demoPosts.filter((p) => p.status === "PUBLISHED").length,
    newLeads: demoLeads.filter((l) => l.status === "NEW").length,
  };
  let tenantsData: Array<{
    id: string;
    name: string;
    primaryDomain: string | null;
    status: string;
    _count: { pages: number; posts: number; leads: number };
  }> = [];
  let pageviewsByDay: { date: string; count: number }[] = [];
  let leadsByDay: { date: string; count: number }[] = [];
  let avgQualityScore = 0;
  let isDemo = true;

  try {
    const [dbStats, dbTenants, pv, ld] = await Promise.all([
      getDashboardStats(),
      getTenantsWithCounts(),
      getPageviewsByDay(30),
      getLeadsByDay(14),
    ]);
    stats = dbStats;
    tenantsData = dbTenants;
    pageviewsByDay = pv;
    leadsByDay = ld;
    isDemo = false;

    // Quick avg quality score from DB
    try {
      const { prisma } = await import("@/server/db");
      const r = await prisma.post.aggregate({ where: { status: "PUBLISHED", qualityScore: { not: null } }, _avg: { qualityScore: true } });
      avgQualityScore = Math.round(r._avg.qualityScore ?? 0);
    } catch { /* ignore */ }
  } catch {
    // DB not available — show demo stats with demo tenant rows
    tenantsData = demoTenants.map((t) => ({
      id: t.id,
      name: t.name,
      primaryDomain: t.primaryDomain,
      status: t.status,
      _count: { pages: t.pages, posts: t.posts, leads: t.leads },
    }));
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl px-6 py-5 text-white"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest opacity-75 mb-1">
          30Nice Growth OS · CMS nâng cấp v2
        </p>
        <h2 className="text-2xl font-bold">Trung tâm quản trị CMS & tăng trưởng</h2>
        <p className="text-sm opacity-80 mt-1">
          Quản lý site, page, blog, media, menu, theme, lead, SEO/AI, analytics và automation trong một admin.
          {isDemo && (
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              Dữ liệu demo
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Trang", desc: "Quản lý landing/page", href: "/admin/pages", icon: FileText },
          { label: "Bài viết", desc: "Bài viết & SEO content", href: "/admin/blog", icon: BookOpen },
          { label: "Media", desc: "Thư viện ảnh/file", href: "/admin/media", icon: Image },
          { label: "Menu", desc: "Menu điều hướng site", href: "/admin/menus", icon: Menu },
          { label: "Giao diện", desc: "Thư viện giao diện", href: "/admin/themes", icon: Palette },
          { label: "Lead", desc: "Inbox khách hàng", href: "/admin/leads", icon: Users },
          { label: "SEO + AI", desc: "Tối ưu & viết nội dung", href: "/admin/seo-ai", icon: Search },
          { label: "Tự động hoá", desc: "Job, import, báo cáo", href: "/admin/automation", icon: Workflow },
          { label: "Nhập dữ liệu", desc: "Nhập dữ liệu website", href: "/admin/import", icon: UploadCloud },
          { label: "Quảng cáo", desc: "Quản lý chiến dịch", href: "/admin/ads", icon: Megaphone },
          { label: "Phân tích", desc: "Traffic & chuyển đổi", href: "/admin/analytics", icon: BarChart2 },
          { label: "Báo cáo", desc: "Báo cáo tăng trưởng", href: "/admin/reports", icon: TrendingUp },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                <item.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{item.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng Sites" value={stats.totalSites} description="tenant đang hoạt động" icon={Globe} iconColor="text-indigo-600" trend={{ value: 12, label: "tháng trước" }} />
        <StatCard title="Pages đã publish" value={stats.publishedPages} description="trên tổng số trang" icon={FileText} iconColor="text-sky-600" />
        <StatCard title="Bài viết đã publish" value={stats.publishedPosts} description="posts đã xuất bản" icon={BookOpen} iconColor="text-violet-600" trend={{ value: 8, label: "tuần trước" }} />
        <StatCard title="Leads mới" value={stats.newLeads} description="cần xử lý" icon={Users} iconColor="text-emerald-600" trend={{ value: 23, label: "hôm qua" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-indigo-500" />
                Pageviews — 30 ngày qua
              </CardTitle>
              <span className="text-xs text-slate-400">{pageviewsByDay.reduce((s, d) => s + d.count, 0).toLocaleString()} lượt</span>
            </div>
          </CardHeader>
          <CardContent>
            <BarChart
              data={pageviewsByDay.map((d) => ({ label: shortDate(d.date), value: d.count }))}
              color="#4f46e5"
              height={110}
              formatValue={(v) => `${v} views`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4 text-indigo-500" />
              Chất lượng nội dung
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <SingleDonut
              percent={avgQualityScore || 74}
              size={88}
              color={avgQualityScore >= 75 ? "#10b981" : avgQualityScore >= 50 ? "#f59e0b" : "#ef4444"}
              label="quality avg"
            />
            <div className="w-full space-y-2">
              {[
                { label: "Posts published", value: stats.publishedPosts, max: Math.max(stats.publishedPosts, 10), color: "#6366f1" },
                { label: "Pages published", value: stats.publishedPages, max: Math.max(stats.publishedPages, 10), color: "#06b6d4" },
                { label: "Leads mới", value: stats.newLeads, max: Math.max(stats.newLeads * 3, 10), color: "#10b981" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-28 shrink-0">{item.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%`, background: item.color }} />
                  </div>
                  <span className="text-xs text-slate-600 w-6 text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              Mức dùng AI Content
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Mock · Phase 3</p>
          </CardHeader>
          <CardContent>
            <LineChart
              data={leadsByDay.map((d) => ({ label: shortDate(d.date), value: d.count }))}
              color="#7c3aed"
              height={80}
              formatValue={(v) => `${v} leads`}
            />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Leads 14 ngày", value: leadsByDay.reduce((s,d)=>s+d.count,0) },
                { label: "Posts published", value: stats.publishedPosts },
                { label: "Sites", value: stats.totalSites },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-slate-50 p-2 text-center">
                  <p className="text-base font-bold text-slate-800">{s.value}</p>
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-amber-500" />
              Phễu quảng cáo / lead
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Mock · Phase 4</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Lượt hiển thị", value: 48200, max: 48200, color: "#e0e7ff" },
                { label: "Lượt nhấp", value: 3840, max: 48200, color: "#a5b4fc" },
                { label: "Leads", value: 426, max: 48200, color: "#6366f1" },
                { label: "Đủ điều kiện", value: 89, max: 48200, color: "#4f46e5" },
                { label: "Chốt được", value: 24, max: 48200, color: "#312e81" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24 shrink-0">{f.label}</span>
                  <div className="flex-1 h-5 rounded-md bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-md" style={{ width: `${Math.max(4, (f.value / f.max) * 100)}%`, background: f.color }} />
                  </div>
                  <span className="text-xs font-medium text-slate-700 w-10 text-right">{f.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-500" />
            Sites đang quản lý
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {tenantsData.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)" }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.primaryDomain}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-center">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{t._count.pages}</p>
                    <p className="text-[10px] text-slate-400">trang</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{t._count.posts}</p>
                    <p className="text-[10px] text-slate-400">bài</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-600">{t._count.leads}</p>
                    <p className="text-[10px] text-slate-400">lead</p>
                  </div>
                  <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
