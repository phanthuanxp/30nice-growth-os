import type { Metadata } from "next";
import { Megaphone, TrendingUp, Target, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getLeadSourceBreakdown } from "@/server/queries/analytics";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "Ads & Nguồn traffic" };

export default async function AdsPage() {
  let sourceData: { source: string; total: number; won: number; rate: number }[] = [];
  let domainData: { domain: string; total: number; won: number }[] = [];
  let isDemo = false;

  try {
    sourceData = await getLeadSourceBreakdown();

    // Domain breakdown
    const leads = await prisma.lead.findMany({
      select: { sourceDomain: true, status: true },
    });
    const byDomain: Record<string, { total: number; won: number }> = {};
    for (const l of leads) {
      const key = l.sourceDomain ?? "(không rõ)";
      if (!byDomain[key]) byDomain[key] = { total: 0, won: 0 };
      byDomain[key].total++;
      if (l.status === "WON") byDomain[key].won++;
    }
    domainData = Object.entries(byDomain)
      .map(([domain, d]) => ({ domain, ...d }))
      .sort((a, b) => b.total - a.total);
  } catch {
    isDemo = true;
    sourceData = [
      { source: "/taxi-bac-ninh", total: 142, won: 28, rate: 20 },
      { source: "/dat-xe", total: 98, won: 22, rate: 22 },
      { source: "/lien-he", total: 64, won: 11, rate: 17 },
      { source: "(direct)", total: 48, won: 6, rate: 13 },
      { source: "/gia-cuoc", total: 34, won: 4, rate: 12 },
    ];
    domainData = [
      { domain: "taxibacninh.vn", total: 286, won: 56 },
      { domain: "cms.30nice.vn", total: 42, won: 8 },
      { domain: "taxivandon.com", total: 58, won: 11 },
    ];
  }

  const totalLeads = sourceData.reduce((s, d) => s + d.total, 0);
  const totalWon = sourceData.reduce((s, d) => s + d.won, 0);
  const overallRate = totalLeads > 0 ? Math.round((totalWon / totalLeads) * 100) : 0;

  // Funnel data
  const funnel = [
    { label: "Lượt truy cập (ước tính)", value: totalLeads * 18, color: "#e0e7ff" },
    { label: "Tương tác trang", value: totalLeads * 4, color: "#a5b4fc" },
    { label: "Leads gửi form", value: totalLeads, color: "#6366f1" },
    { label: "Tiềm năng (Qualified)", value: Math.round(totalLeads * 0.3), color: "#4f46e5" },
    { label: "Chốt được (Won)", value: totalWon, color: "#312e81" },
  ];
  const funnelMax = funnel[0].value;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ads & Nguồn traffic"
        description="Theo dõi hiệu quả các kênh thu hút khách hàng từ dữ liệu leads."
      />

      {isDemo && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Dữ liệu demo — kết nối database để xem số liệu thật
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng leads", value: totalLeads, icon: Target, color: "text-indigo-600" },
          { label: "Đã chốt", value: totalWon, icon: TrendingUp, color: "text-emerald-600" },
          { label: "Tỉ lệ chốt", value: `${overallRate}%`, icon: Megaphone, color: "text-violet-600" },
          { label: "Kênh hiệu quả nhất", value: sourceData[0]?.source ?? "—", icon: DollarSign, color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${s.color} truncate`}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-amber-500" />
              Phễu chuyển đổi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {funnel.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-36 shrink-0">{f.label}</span>
                  <div className="flex-1 h-6 rounded-md bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-md flex items-center pl-2"
                      style={{ width: `${Math.max(4, (f.value / funnelMax) * 100)}%`, background: f.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-700 w-12 text-right">
                    {f.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Domain breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Leads theo domain</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Domain</TableHeader>
                  <TableHeader>Leads</TableHeader>
                  <TableHeader>Chốt</TableHeader>
                  <TableHeader>Tỉ lệ</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {domainData.map((d) => {
                  const rate = d.total > 0 ? Math.round((d.won / d.total) * 100) : 0;
                  return (
                    <TableRow key={d.domain}>
                      <TableCell>
                        <code className="text-xs bg-slate-100 rounded px-1.5 py-0.5">{d.domain}</code>
                      </TableCell>
                      <TableCell className="font-medium">{d.total}</TableCell>
                      <TableCell className="text-emerald-700">{d.won}</TableCell>
                      <TableCell>
                        <Badge variant={rate >= 20 ? "success" : rate >= 10 ? "warning" : "neutral"}>{rate}%</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Source page breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-500" />
            Trang nguồn thu hút leads
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Trang</TableHeader>
                <TableHeader>Tổng leads</TableHeader>
                <TableHeader>Chốt được</TableHeader>
                <TableHeader>Tỉ lệ</TableHeader>
                <TableHeader>Hiệu quả</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {sourceData.map((s) => (
                <TableRow key={s.source}>
                  <TableCell>
                    <code className="text-xs bg-slate-100 rounded px-1.5 py-0.5 text-slate-600">{s.source}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full bg-indigo-400" style={{ width: `${(s.total / (sourceData[0]?.total || 1)) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{s.total}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-emerald-700 font-medium">{s.won}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{s.rate}%</TableCell>
                  <TableCell>
                    <Badge variant={s.rate >= 20 ? "success" : s.rate >= 10 ? "warning" : "neutral"}>
                      {s.rate >= 20 ? "Cao" : s.rate >= 10 ? "Trung bình" : "Thấp"}
                    </Badge>
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
