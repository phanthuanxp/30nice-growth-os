import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History, PencilLine, Share2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { SocialContentEditor } from "@/components/admin/social-content-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GroupDistributionForm, GroupDistributionTargets } from "@/components/admin/social-distribution";
import { getSocialContent, getSocialContentDistribution } from "@/server/queries/social";

export const metadata: Metadata = { title: "Biên tập nội dung Social" };

type MediaBrief = { concept?: string; visualStyle?: string; onImageText?: string; aspectRatio?: string };

function localDateTimeValue(date: Date | null) {
  if (!date) return "";
  const local = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function displayDate(date: Date | null) {
  return date ? date.toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" }) : null;
}

export default async function SocialContentEditorPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const [content, distribution] = await Promise.all([getSocialContent(contentId), getSocialContentDistribution(contentId)]);
  if (!content) notFound();
  const media = (content.mediaBrief ?? {}) as MediaBrief;
  const canDistribute = ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(content.status);

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

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Share2 className="h-4 w-4 text-cyan-600" />Phân phối vào Group</CardTitle>
            <CardDescription>AI viết riêng một caption cho mỗi Group; hệ thống kiểm tra giới hạn, giãn cách và quy tắc trước khi xếp hàng chờ.</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupDistributionForm
              contentId={content.id}
              canDistribute={canDistribute}
              groups={(distribution?.groups ?? []).map((group) => ({
                id: group.id,
                name: group.name,
                mode: group.mode,
                topics: group.topics,
                dailyPostLimit: group.dailyPostLimit,
                cooldownHours: group.cooldownHours,
                allowLinks: group.allowLinks,
                allowPromotion: group.allowPromotion,
                apiVerified: Boolean(group.apiVerifiedAt),
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hàng chờ Group của bài này</CardTitle>
            <CardDescription>Với Group thủ công: copy caption, đăng trong Group rồi dán URL và đánh dấu đã đăng.</CardDescription>
          </CardHeader>
          <CardContent>
            <GroupDistributionTargets
              targets={(distribution?.targets ?? []).map((target) => ({
                id: target.id,
                groupName: target.socialGroup?.name ?? "Group đã xoá",
                groupUrl: target.socialGroup?.groupUrl ?? null,
                caption: target.captionOverride ?? "",
                status: target.status,
                scheduledAt: displayDate(target.scheduledAt),
                publishedAt: displayDate(target.publishedAt),
                postUrl: target.externalPostUrl,
                errorMessage: target.errorMessage,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
