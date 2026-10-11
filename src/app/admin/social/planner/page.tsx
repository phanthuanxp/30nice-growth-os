import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Check, Clock3, FilePenLine, FileText, Lightbulb, Pencil, RotateCcw, Send, SkipForward } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SocialPlanForm, EmptySocialFormNotice } from "@/components/admin/social-forms";
import { SocialPlanAiButton, SocialPlanBulkActions } from "@/components/admin/social-ai-actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSocialPages, getSocialPlans } from "@/server/queries/social";
import { scheduleSocialContentAction, updateSocialContentStatusAction } from "@/server/actions/social";

export const metadata: Metadata = { title: "Social Content Planner" };

const COLUMNS = [
  { key: "IDEA", label: "Ý tưởng", icon: Lightbulb, variant: "neutral" as const },
  { key: "DRAFT", label: "Bản nháp AI", icon: FilePenLine, variant: "info" as const },
  { key: "IN_REVIEW", label: "Chờ duyệt", icon: Clock3, variant: "warning" as const },
  { key: "APPROVED", label: "Đã duyệt", icon: Check, variant: "success" as const },
  { key: "SCHEDULED", label: "Đã hẹn lịch", icon: CalendarDays, variant: "info" as const },
];

export default async function SocialPlannerPage({ searchParams }: { searchParams: Promise<{ pageId?: string }> }) {
  const { pageId } = await searchParams;
  const [pages, plans] = await Promise.all([getSocialPages(), getSocialPlans(pageId)]);
  const contents = plans.flatMap((plan) => plan.contents.map((content) => ({ ...content, planTitle: plan.title, pageName: plan.socialPage.name })));

  return (
    <div className="space-y-6">
      <PageHeader title="Social Content Planner" description="Tạo và duyệt kế hoạch nội dung 30 ngày riêng cho từng Facebook Page." />

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-indigo-600" />Tạo kế hoạch 30 ngày</CardTitle><CardDescription>Tạo khung 30 ngày, sau đó dùng AI viết caption và media brief hoàn chỉnh theo chiến lược của Page.</CardDescription></CardHeader>
        <CardContent>{pages.length ? <SocialPlanForm pages={pages.map((page) => ({ id: page.id, name: `${page.name} · ${page.workspace.tenant.name}` }))} /> : <EmptySocialFormNotice label="Hãy tạo Page Launch Kit trước" />}</CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-5">
        {COLUMNS.map((column) => {
          const items = contents.filter((content) => content.status === column.key).slice(0, 40);
          return (
            <Card key={column.key}>
              <CardHeader><CardTitle className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><column.icon className="h-4 w-4" />{column.label}</span><Badge variant={column.variant}>{items.length}</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {items.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">Chưa có nội dung</p> : items.map((content) => (
                  <div key={content.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-slate-800">{content.title || content.topic}</p><Badge variant="neutral">{content.format}</Badge></div>
                    <p className="mt-1 text-xs text-slate-500">{content.pageName}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400"><span>{content.pillar}</span><span>{content.scheduledAt?.toLocaleDateString("vi-VN") || "Chưa hẹn"}</span></div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Link href={`/admin/social/planner/${content.id}`} className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-medium text-indigo-700"><Pencil className="h-3 w-3" />Biên tập</Link>
                      {(content.status === "IDEA" || content.status === "DRAFT") && <form action={updateSocialContentStatusAction.bind(null, content.id, "IN_REVIEW")}><button className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700"><Send className="h-3 w-3" />Gửi duyệt</button></form>}
                      {content.status === "IN_REVIEW" && <form action={updateSocialContentStatusAction.bind(null, content.id, "APPROVED")}><button className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700"><Check className="h-3 w-3" />Duyệt</button></form>}
                      {content.status === "IN_REVIEW" && <form action={updateSocialContentStatusAction.bind(null, content.id, "DRAFT")}><button className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600"><RotateCcw className="h-3 w-3" />Trả lại</button></form>}
                      {content.status === "APPROVED" && <form action={scheduleSocialContentAction.bind(null, content.id)}><button className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700"><CalendarDays className="h-3 w-3" />Hẹn lịch</button></form>}
                      {(content.status === "IDEA" || content.status === "DRAFT" || content.status === "IN_REVIEW") && <form action={updateSocialContentStatusAction.bind(null, content.id, "SKIPPED")}><button className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600"><SkipForward className="h-3 w-3" />Bỏ qua</button></form>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {plans.length > 0 && <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate-600" />Các kế hoạch đã tạo</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{plans.map((plan) => <div key={plan.id} className="space-y-4 rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-2"><p className="font-semibold text-slate-800">{plan.title}</p><Badge variant={plan.status === "ACTIVE" ? "success" : "neutral"}>{plan.status}</Badge></div><p className="text-xs text-slate-500">{plan.socialPage.name} · {plan.contents.length} nội dung</p><p className="text-xs text-slate-400">{plan.startDate.toLocaleDateString("vi-VN")} – {plan.endDate.toLocaleDateString("vi-VN")}</p><SocialPlanAiButton planId={plan.id} /><SocialPlanBulkActions planId={plan.id} /></div>)}</CardContent></Card>}
    </div>
  );
}
