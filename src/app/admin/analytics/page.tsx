import type { Metadata } from "next";
import { BarChart2, TrendingUp, Users, Globe } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getLeadsByDay, getLeadSourceBreakdown, getContentStats, getTenantComparison } from "@/server/queries/analytics";

export const metadata: Metadata = { title: "Analytics" };

function MiniBarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-16">
      {data.map((d, i) => (
        <div
          key={i}
          title={`${d.date}: ${d.count} leads`}
          className="flex-1 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
          style={{
            height: `${Math.max(4, (d.count / max) * 100)}%`,
            background: d.count > 0 ? "linear-gradient(to top, #4f46e5, #818cf8)" : "#f1f5f9",
          }}
        />
      ))}
    </div>
  );
}

export default async function AnalyticsPage() {
  let leadsByDay: { date: string; count: number }[] = [];
  let sourceBreakdown: { source: string; total: number; won: number; rate: number }[] = [];
  let stats = { publishedPages: 0, publishedPosts: 0, totalLeads: 0, leadsByStatus: {} as Record<string, number> };
  let tenantComparison: { id: string; name: string; slug: string; pages: number; posts: number; leads: number; newLeads: number; wonLeads: number }[] = [];
  let isDemo = false;

  try {
    [leadsByDay, sourceBreakdown, stats, tenantComparison] = await Promise.all([
      getLeadsByDay(30),
      getLeadSourceBreakdown(),
      getContentStats(),
      getTenantComparison(),
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
        title="Analytics"
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
          <MiniBarChart data={leadsByDay} />
          <div className="flex justify-between mt-2 text-xs text-slate-400">
            <span>{leadsByDay[0]?.date ?? ""}</span>
            <span>{leadsByDay[leadsByDay.length - 1]?.date ?? ""}</span>
          </div>
        </CardContent>
      </Card>

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
            <div className="space-y-2.5">
              {(["NEW","CONTACTED","QUALIFIED","WON","LOST"] as const).map((status) => {
                const count = stats.leadsByStatus[status] ?? 0;
                const pct = stats.totalLeads > 0 ? Math.round((count / stats.totalLeads) * 100) : 0;
                const colors: Record<string, string> = { NEW: "#6366f1", CONTACTED: "#f59e0b", QUALIFIED: "#3b82f6", WON: "#10b981", LOST: "#ef4444" };
                const labels: Record<string, string> = { NEW: "Mới", CONTACTED: "Đã liên hệ", QUALIFIED: "Tiềm năng", WON: "Chốt được", LOST: "Thất bại" };
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-24 shrink-0">{labels[status]}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: colors[status] }} />
                    </div>
                    <span className="text-xs font-medium text-slate-700 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
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
                  <TableHeader>Leads</TableHeader>
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
                <TableHeader>Pages</TableHeader>
                <TableHeader>Bài viết</TableHeader>
                <TableHeader>Tổng leads</TableHeader>
                <TableHeader>Lead mới</TableHeader>
                <TableHeader>Đã chốt</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {tenantComparison.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-slate-800">{t.name}</TableCell>
                  <TableCell>{t.pages}</TableCell>
                  <TableCell>{t.posts}</TableCell>
                  <TableCell>{t.leads}</TableCell>
                  <TableCell>
                    <Badge variant="info">{t.newLeads}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">{t.wonLeads}</Badge>
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
