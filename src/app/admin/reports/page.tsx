import type { Metadata } from "next";
import { FileBarChart, TrendingUp, Users, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getMonthlyLeadReport, getContentStats, getTenantComparison } from "@/server/queries/analytics";
import { getAllPosts } from "@/server/queries/posts";

export const metadata: Metadata = { title: "Reports" };

const MONTH_NAMES = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"];

function monthLabel(ym: string) {
  const [, m] = ym.split("-");
  return MONTH_NAMES[(parseInt(m) - 1)] ?? ym;
}

export default async function ReportsPage() {
  let monthlyLeads: { month: string; total: number; won: number; rate: number }[] = [];
  let stats = { publishedPages: 0, publishedPosts: 0, totalLeads: 0, leadsByStatus: {} as Record<string, number> };
  let tenants: { id: string; name: string; pages: number; posts: number; leads: number; newLeads: number; wonLeads: number }[] = [];
  let recentPosts: { id: string; title: string; slug: string; status: string; publishedAt: Date | null }[] = [];
  let isDemo = false;

  try {
    const [monthly, s, tc, posts] = await Promise.all([
      getMonthlyLeadReport(6),
      getContentStats(),
      getTenantComparison(),
      getAllPosts(),
    ]);
    monthlyLeads = monthly;
    stats = s;
    tenants = tc;
    recentPosts = posts.slice(0, 5).map((p) => ({
      id: p.id, title: p.title, slug: p.slug, status: p.status, publishedAt: p.publishedAt,
    }));
  } catch {
    isDemo = true;
    const now = new Date();
    monthlyLeads = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (5 - i));
      const total = 20 + i * 8 + (i * 3) % 10;
      const won = Math.floor(total * 0.18);
      return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, total, won, rate: Math.round((won / total) * 100) };
    });
    stats = { publishedPages: 3, publishedPosts: 2, totalLeads: 10, leadsByStatus: { NEW: 3, QUALIFIED: 4, WON: 2, LOST: 1 } };
    tenants = [
      { id: "cms", name: "30Nice CMS", pages: 18, posts: 126, leads: 42, newLeads: 12, wonLeads: 8 },
      { id: "taxi", name: "Taxi Bắc Ninh", pages: 36, posts: 248, leads: 384, newLeads: 64, wonLeads: 52 },
    ];
  }

  const maxLeads = Math.max(...monthlyLeads.map((m) => m.total), 1);
  const avgRate = monthlyLeads.length > 0
    ? Math.round(monthlyLeads.reduce((s, m) => s + m.rate, 0) / monthlyLeads.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo tổng hợp"
        description="Tổng quan hiệu suất toàn hệ thống."
      />

      {isDemo && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Dữ liệu demo — kết nối database để xem báo cáo thật
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pages đã đăng", value: stats.publishedPages, icon: FileBarChart, color: "text-indigo-600" },
          { label: "Bài viết đã đăng", value: stats.publishedPosts, icon: BookOpen, color: "text-violet-600" },
          { label: "Tổng leads", value: stats.totalLeads, icon: Users, color: "text-sky-600" },
          { label: "Tỉ lệ chốt TB", value: `${avgRate}%`, icon: TrendingUp, color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Monthly leads bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Leads 6 tháng gần nhất
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-28">
            {monthlyLeads.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-slate-700">{m.total}</span>
                <div className="w-full rounded-t-sm overflow-hidden" style={{ height: `${Math.max(8, (m.total / maxLeads) * 80)}px` }}>
                  <div
                    className="w-full h-full"
                    style={{ background: "linear-gradient(to top, #4f46e5, #818cf8)" }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{monthLabel(m.month)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Tổng 6 tháng", value: monthlyLeads.reduce((s, m) => s + m.total, 0) },
              { label: "Chốt 6 tháng", value: monthlyLeads.reduce((s, m) => s + m.won, 0) },
              { label: "Tỉ lệ TB", value: `${avgRate}%` },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly detail table */}
        <Card>
          <CardHeader><CardTitle>Chi tiết từng tháng</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Tháng</TableHeader>
                  <TableHeader>Lead</TableHeader>
                  <TableHeader>Chốt</TableHeader>
                  <TableHeader>Tỉ lệ</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {[...monthlyLeads].reverse().map((m) => (
                  <TableRow key={m.month}>
                    <TableCell className="font-medium text-slate-700">{m.month}</TableCell>
                    <TableCell>{m.total}</TableCell>
                    <TableCell className="text-emerald-700">{m.won}</TableCell>
                    <TableCell>
                      <Badge variant={m.rate >= 20 ? "success" : m.rate >= 10 ? "warning" : "neutral"}>
                        {m.rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tenant performance */}
        <Card>
          <CardHeader><CardTitle>Hiệu suất theo site</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Site</TableHeader>
                  <TableHeader>Nội dung</TableHeader>
                  <TableHeader>Lead</TableHeader>
                  <TableHeader>Chốt</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-slate-800">{t.name}</TableCell>
                    <TableCell>
                      <span className="text-xs text-slate-500">{t.pages}p / {t.posts}b</span>
                    </TableCell>
                    <TableCell>{t.leads}</TableCell>
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

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-violet-500" />Bài viết gần đây</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Tiêu đề</TableHeader>
                  <TableHeader>Trạng thái</TableHeader>
                  <TableHeader>Ngày đăng</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {recentPosts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-slate-800">{p.title}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "PUBLISHED" ? "success" : "warning"}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("vi-VN") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
