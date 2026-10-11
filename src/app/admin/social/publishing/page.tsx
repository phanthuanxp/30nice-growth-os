import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BarChart3, CheckCircle2, Clock3, ExternalLink, RefreshCw, Rocket } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { publishSocialTargetNowAction, retrySocialPublishTargetAction } from "@/server/actions/social-meta";
import { getSocialPages, getSocialPublishing } from "@/server/queries/social";

export const metadata: Metadata = { title: "Social Publisher" };

export default async function SocialPublishingPage({ searchParams }: { searchParams: Promise<{ pageId?: string }> }) {
  const { pageId } = await searchParams;
  const [pages, publishing] = await Promise.all([getSocialPages(), getSocialPublishing(pageId)]);
  const cards = [
    { label: "Đang chờ", value: publishing.counts.SCHEDULED || 0, icon: Clock3, color: "text-blue-600" },
    { label: "Đã đăng", value: publishing.counts.PUBLISHED || 0, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Cần xử lý", value: publishing.counts.FAILED || 0, icon: AlertTriangle, color: "text-red-600" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader title="Facebook Page Publisher" description="Theo dõi hàng đợi đăng Page, lỗi Meta và hiệu quả cơ bản của từng bài." />
      <div className="grid gap-4 md:grid-cols-3">{cards.map((card) => <Card key={card.label}><CardContent className="flex items-center justify-between pt-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p><p className="mt-1 text-3xl font-bold text-slate-900">{card.value}</p></div><card.icon className={`h-7 w-7 ${card.color}`} /></CardContent></Card>)}</div>

      <Card><CardContent className="pt-6"><form method="get" className="flex flex-wrap items-end gap-3"><label className="space-y-1 text-xs font-semibold text-slate-600">Facebook Page<select name="pageId" defaultValue={pageId || ""} className="block h-9 min-w-64 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal"><option value="">Tất cả Page</option>{pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}</select></label><button className="h-9 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white">Lọc</button></form></CardContent></Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Rocket className="h-4 w-4 text-indigo-600" />Hàng đợi xuất bản</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead><tr className="border-b border-slate-200 text-xs uppercase text-slate-500"><th className="pb-3">Nội dung</th><th className="pb-3">Page</th><th className="pb-3">Lịch</th><th className="pb-3">Trạng thái</th><th className="pb-3">Insight</th><th className="pb-3">Thao tác</th></tr></thead>
            <tbody>{publishing.targets.map((target) => (
              <tr key={target.id} className="border-b border-slate-100 align-top">
                <td className="py-4 pr-4"><Link href={`/admin/social/planner/${target.content.id}`} className="font-semibold text-slate-800 hover:text-indigo-600">{target.content.title || target.content.topic}</Link>{target.errorMessage && <p className="mt-1 max-w-xs text-xs text-red-600">{target.errorMessage}</p>}<p className="mt-1 text-[11px] text-slate-400">Lần thử {target.attempts}/{target.maxAttempts}</p></td>
                <td className="py-4 pr-4"><p className="font-medium text-slate-700">{target.socialPage.name}</p><p className="text-xs text-slate-400">{target.socialPage.connection?.connectionStatus || "Chưa kết nối"}</p></td>
                <td className="py-4 pr-4 text-xs text-slate-600">{target.scheduledAt?.toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" }) || "—"}</td>
                <td className="py-4 pr-4"><Badge variant={target.status === "PUBLISHED" ? "success" : target.status === "FAILED" ? "danger" : "info"}>{target.status}</Badge>{target.permanentFailure && <p className="mt-1 text-[10px] font-semibold text-red-600">Cần xử lý thủ công</p>}</td>
                <td className="py-4 pr-4 text-xs text-slate-600">{target.insight ? <div className="space-y-1"><p className="inline-flex items-center gap-1"><BarChart3 className="h-3 w-3" />{target.insight.engagements} tương tác</p><p>{target.insight.reactions} cảm xúc · {target.insight.comments} bình luận · {target.insight.shares} chia sẻ</p></div> : "—"}</td>
                <td className="py-4"><div className="flex flex-wrap gap-2">{target.status === "SCHEDULED" && <form action={publishSocialTargetNowAction.bind(null, target.id)}><button className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">Đăng ngay</button></form>}{target.status === "FAILED" && <form action={retrySocialPublishTargetAction.bind(null, target.id)}><button className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"><RefreshCw className="h-3 w-3" />Thử lại</button></form>}{target.externalPostUrl && <a href={target.externalPostUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"><ExternalLink className="h-3 w-3" />Xem bài</a>}</div></td>
              </tr>
            ))}</tbody>
          </table>
          {publishing.targets.length === 0 && <p className="py-12 text-center text-sm text-slate-400">Chưa có bài nào trong hàng đợi. Hãy duyệt và hẹn lịch trong Content Planner.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
