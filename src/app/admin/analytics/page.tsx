import type { Metadata } from "next";
import { BarChart2, TrendingUp, Users, Globe } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getLeadsByDay, getLeadSourceBreakdown, getContentStats, getTenantComparison,
  getPageviewsByDay, getTopPages, getDeviceBreakdown, getTopReferrers, getTrafficSummary,
} from "@/server/queries/analytics";
import { Smartphone, Eye, MousePointerClick } from "lucide-react";
import { BarChart } from "@/components/admin/charts/bar-chart";
import { LineChart } from "@/components/admin/charts/line-chart";
import { DonutChart } from "@/components/admin/charts/donut-chart";

export const metadata: Metadata = { title: "Analytics" };

function shortDate(d: string) {
  const parts = d.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
}

export default async function AnalyticsPage() {
  let leadsByDay: { date: string; count: number }[] = [];
  let sourceBreakdown: { source: string; total: number; won: number; rate: number }[] = [];
  let stats = { publishedPages: 0, publishedPosts: 0, totalLeads: 0, leadsByStatus: {} as Record<string, number> };
  let tenantComparison: { id: string; name: string; slug: string; pages: number; posts: number; leads: number; newLeads: number; wonLeads: number }[] = [];
  let pageviewsByDay: { date: string; count: number }[] = [];
  let topPages: { path: string; views: number }[] = [];
  let devices = { mobile: 0, desktop: 0 };
  let referrers: { referrer: string; views: number }[] = [];
  let traffic = { pageviews: 0, leads: 0, conversionRate: 0 };
  let isDemo = false;

  try {
    [leadsByDay, sourceBreakdown, stats, tenantComparison, pageviewsByDay, topPages, devices, referrers, traffic] = await Promise.all([
      getLeadsByDay(30),
      getLeadSourceBreakdown(),
      getContentStats(),
      getTenantComparison(),
      getPageviewsByDay(30),
      getTopPages(30),
      getDeviceBreakdown(30),
      getTopReferrers(30),
      getTrafficSummary(30),
    ]);
  } catch {
    isDemo = true;
    // Generate demo chart data
    leadsByDay = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return { date: d.toISOString().split("T")[0], count: (i * 3 + 5) % 8 };
    });
    sourceBreakdown = [
      { source: "/taxi-bac-ninh", total: 42, won: 8, rate: 19 },
      { source: "/lien-he", total: 28, won: 6, rate: 21 },
      { source: "(direct)", total: 18, won: 3, rate: 17 },
      { source: "/dich-vu", total: 12, won: 2, rate: 17 },
    ];
    stats = { publishedPages: 2, publishedPosts: 1, totalLeads: 2, leadsByStatus: { NEW: 1, QUALIFIED: 1 } };
    tenantComparison = [
      { id: "cms", name: "30Nice CMS", slug: "cms-30nice", pages: 18, posts: 126, leads: 42, newLeads: 12, wonLeads: 8 },
      { id: "taxi", name: "Taxi Bắc Ninh", slug: "taxibacninh", pages: 36, posts: 248, leads: 384, newLeads: 64, wonLeads: 52 },
    ];
  }

  const totalToday = leadsByDay[leadsByDay.length - 1]?.count ?? 0;
  const totalWeek = leadsByDay.slice(-7).reduce((s, d) => s + d.count, 0);
  const wonRate = stats.leadsByStatus["WON"] && stats.totalLeads
    ? Math.round((stats.leadsByStatus["WON"] / stats.totalLeads) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Phân tích"
        description="Phân tích traffic, leads và hiệu suất nội dung."
      />

      {isDemo && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Dữ liệu demo — kết nối database để xem analytics thật
        </div>
      )}

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Leads hôm nay", value: totalToday, icon: Users, color: "text-indigo-600" },
          { label: "Leads 7 ngày", value: totalWeek, icon: TrendingUp, color: "text-emerald-600" },
          { label: "Tổng leads", value: stats.totalLeads, icon: Users, color: "text-sky-600" },
          { label: "Tỉ lệ chốt", value: `${wonRate}%`, icon: BarChart2, color: "text-violet-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Lead trend chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Leads theo ngày — 30 ngày qua
            </CardTitle>
            <span className="text-xs text-slate-400">
              Tổng: {leadsByDay.reduce((s, d) => s + d.count, 0)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <BarChart
            data={leadsByDay.map((d) => ({ label: shortDate(d.date), value: d.count }))}
            color="#4f46e5"
            height={120}
          />
        </CardContent>
      </Card>

      {/* Traffic (pageviews tự build) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pageviews 30 ngày", value: traffic.pageviews.toLocaleString("vi-VN"), icon: Eye, color: "text-cyan-600" },
          { label: "Bài đăng 30 ngày", value: traffic.leads, icon: Users, color: "text-indigo-600" },
          { label: "Tỉ lệ chuyển đổi", value: `${traffic.conversionRate.toFixed(1)}%`, icon: MousePointerClick, color: "text-emerald-600" },
          { label: "Mobile / Desktop", value: `${devices.mobile} / ${devices.desktop}`, icon: Smartphone, color: "text-violet-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-500" />
              Pageviews theo ngày — 30 ngày qua
            </CardTitle>
            <span className="text-xs text-slate-400">
              Tracking tự động trên mọi trang public
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <LineChart
            data={pageviewsByDay.map((d) => ({ label: shortDate(d.date), value: d.count }))}
            color="#06b6d4"
            height={110}
            formatValue={(v) => `${v} lượt`}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-indigo-500" />
              Top trang được xem
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topPages.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Chưa có dữ liệu pageview</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {topPages.map((p) => {
                  const max = topPages[0]?.views ?? 1;
                  return (
                    <div key={p.path} className="px-5 py-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-xs text-slate-700 truncate">{p.path}</code>
                        <span className="text-xs font-semibold text-slate-500 shrink-0 ml-3">{p.views}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500" style={{ width: `${(p.views / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              Nguồn truy cập (referrer)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {referrers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Chưa có referrer — đa số truy cập trực tiếp</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {referrers.map((r) => (
                  <div key={r.referrer} className="flex items-center justify-between px-5 py-2.5">
                    <span className="text-sm text-slate-700 truncate">{r.referrer}</span>
                    <Badge variant="info" className="shrink-0 ml-3">{r.views} lượt</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead status breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              Phân loại leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              segments={[
                { label: "Mới", value: stats.leadsByStatus["NEW"] ?? 0, color: "#6366f1" },
                { label: "Đã liên hệ", value: stats.leadsByStatus["CONTACTED"] ?? 0, color: "#f59e0b" },
                { label: "Tiềm năng", value: stats.leadsByStatus["QUALIFIED"] ?? 0, color: "#3b82f6" },
                { label: "Chốt được", value: stats.leadsByStatus["WON"] ?? 0, color: "#10b981" },
                { label: "Thất bại", value: stats.leadsByStatus["LOST"] ?? 0, color: "#ef4444" },
              ]}
              centerValue={stats.totalLeads}
              centerLabel="tổng"
            />
          </CardContent>
        </Card>

        {/* Source breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-500" />
              Nguồn leads top 10
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Trang nguồn</TableHeader>
                  <TableHeader>Lead</TableHeader>
                  <TableHeader>Chốt</TableHeader>
                  <TableHeader>Tỉ lệ</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {sourceBreakdown.map((s) => (
                  <TableRow key={s.source}>
                    <TableCell>
                      <code className="text-xs bg-slate-100 rounded px-1.5 py-0.5 text-slate-600">{s.source}</code>
                    </TableCell>
                    <TableCell className="font-medium text-slate-700">{s.total}</TableCell>
                    <TableCell className="text-emerald-700">{s.won}</TableCell>
                    <TableCell>
                      <Badge variant={s.rate >= 20 ? "success" : s.rate >= 10 ? "warning" : "neutral"}>
                        {s.rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {sourceBreakdown.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-8">Chưa có dữ liệu</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Tenant comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-500" />
            So sánh hiệu suất theo site
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Site</TableHeader>
                <TableHeader>Trang</TableHeader>
                <TableHeader>Bài viết</TableHeader>
                <TableHeader>Trạng thái</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {tenantComparison.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-slate-800">{t.name}</TableCell>
                  <TableCell>{t.pages}</TableCell>
                  <TableCell>{t.posts}</TableCell>
                  <TableCell>
                    <Badge variant="success">Active</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
