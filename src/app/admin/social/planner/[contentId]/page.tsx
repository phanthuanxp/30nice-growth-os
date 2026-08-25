import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History, PencilLine } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SocialContentEditor } from "@/components/admin/social-content-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSocialContent } from "@/server/queries/social";

export const metadata: Metadata = { title: "Biên tập nội dung Social" };

type MediaBrief = { concept?: string; visualStyle?: string; onImageText?: string; aspectRatio?: string };

function localDateTimeValue(date: Date | null) {
  if (!date) return "";
  const local = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default async function SocialContentEditorPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const content = await getSocialContent(contentId);
  if (!content) notFound();
  const media = (content.mediaBrief ?? {}) as MediaBrief;

  return (
    <div className="space-y-6">
      <Link href="/admin/social/planner" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"><ArrowLeft className="h-4 w-4" />Quay lại Content Planner</Link>
      <PageHeader title="Biên tập nội dung Social" description={`${content.socialPage.name} · ${content.plan?.title || "Nội dung độc lập"}`} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PencilLine className="h-4 w-4 text-indigo-600" />Nội dung bài viết</CardTitle>
            <CardDescription>Mỗi lần lưu sẽ tạo một phiên bản lịch sử và đưa bài về bản nháp để duyệt lại.</CardDescription>
          </CardHeader>
          <CardContent>
            <SocialContentEditor content={{
              id: content.id,
              topic: content.topic,
              title: content.title || content.topic,
              hook: content.hook || "",
              caption: content.caption || "",
              callToAction: content.callToAction || "",
              hashtags: content.hashtags.join(" "),
              format: content.format,
              scheduledAt: localDateTimeValue(content.scheduledAt),
              mediaConcept: media.concept || "",
              visualStyle: media.visualStyle || "",
              onImageText: media.onImageText || "",
              aspectRatio: media.aspectRatio || "4:5",
            }} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Trạng thái hiện tại</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <Badge variant={content.status === "APPROVED" || content.status === "SCHEDULED" ? "success" : content.status === "IN_REVIEW" ? "warning" : "neutral"}>{content.status}</Badge>
              <p>Tenant: {content.socialPage.workspace.tenant.name}</p>
              <p>Workspace: {content.socialPage.workspace.name}</p>
              <p>Lịch: {content.scheduledAt?.toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" }) || "Chưa đặt"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><History className="h-4 w-4" />Lịch sử phiên bản</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {content.revisions.length === 0 ? <p className="text-sm text-slate-400">Chưa có phiên bản cũ.</p> : content.revisions.map((revision) => (
                <div key={revision.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex justify-between gap-2"><span className="text-xs font-semibold text-slate-700">Phiên bản {revision.version}</span><span className="text-[11px] text-slate-400">{revision.createdAt.toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" })}</span></div>
                  <p className="mt-1 text-xs text-slate-500">{revision.changeNote || "Cập nhật nội dung"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
