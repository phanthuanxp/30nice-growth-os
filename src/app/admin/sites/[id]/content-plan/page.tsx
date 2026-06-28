import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Map as MapIcon } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTenantById } from "@/server/queries/tenants";
import { prisma } from "@/server/db";
import { ContentPlanItemActions } from "@/components/admin/content-plan-item-actions";
import { BatchGenerateDraftsForm } from "@/components/admin/batch-generate-drafts-form";
import { AddContentPlanItemForm } from "@/components/admin/add-content-plan-item-form";
import { CreateContentPlanForm } from "@/components/admin/create-content-plan-form";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `Content Plan — ${tenant.name}` : "Content Plan" };
}

const ITEM_STATUS_VARIANT: Record<string, "neutral" | "info" | "warning" | "success" | "danger"> = {
  PLANNED: "neutral",
  DRAFTING: "info",
  DRAFT: "warning",
  SCHEDULED: "info",
  PUBLISHED: "success",
  SKIPPED: "neutral",
};

const ITEM_STATUS_LABEL: Record<string, string> = {
  PLANNED: "Chờ viết",
  DRAFTING: "Đang viết",
  DRAFT: "Bản nháp",
  SCHEDULED: "Đã lên lịch",
  PUBLISHED: "Đã đăng",
  SKIPPED: "Bỏ qua",
};

export default async function ContentPlanPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  const contentPlan = await prisma.contentPlan.findFirst({
    where: { tenantId: id },
    include: {
      items: { orderBy: [{ priority: "desc" }, { createdAt: "asc" }] },
    },
  }).catch(() => null);

  if (!contentPlan) {
    return (
      <div className="space-y-6">
        <PageHeader title="Content Plan" description={`Kế hoạch nội dung cho ${tenant.name}.`} />
        <Card className="p-8 text-center">
          <MapIcon className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-700 mb-1">Site này chưa có Content Plan</p>
          <p className="text-xs text-slate-400 mb-6">
            Content Plan được tạo tự động khi tạo site từ Subdomain Factory.
            Bạn cũng có thể tạo thủ công bên dưới.
          </p>
          <CreateContentPlanForm tenantId={id} />
        </Card>
      </div>
    );
  }

  // Fetch linked posts
  const postIds = contentPlan.items.map((i) => i.postId).filter(Boolean) as string[];
  const posts =
    postIds.length > 0
      ? await prisma.post
          .findMany({ where: { id: { in: postIds } }, select: { id: true, title: true, status: true, qualityScore: true, seoScore: true } })
          .catch(() => [])
      : [];
  const postMap = new Map(posts.map((p) => [p.id, p]));

  const counts = {
    total: contentPlan.items.length,
    published: contentPlan.items.filter((i) => i.status === "PUBLISHED").length,
    draft: contentPlan.items.filter((i) => ["DRAFT", "DRAFTING"].includes(i.status)).length,
    planned: contentPlan.items.filter((i) => i.status === "PLANNED").length,
  };
  const progress = counts.total > 0 ? Math.round((counts.published / counts.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Plan"
        description={`${contentPlan.title} · ${contentPlan.language?.toUpperCase() ?? "EN"} · ${contentPlan.status}`}
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Tổng bài", value: counts.total, color: "text-slate-800" },
          { label: "Đã publish", value: counts.published, color: "text-emerald-600" },
          { label: "Bản nháp", value: counts.draft, color: "text-amber-600" },
          { label: "Chờ viết", value: counts.planned, color: "text-slate-500" },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700">Tiến độ publish</p>
          <p className="text-sm font-bold text-slate-800">{progress}%</p>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100">
          <div
            className="h-2.5 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.max(progress, 2)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          {counts.published} / {counts.total} bài đã được đăng
        </p>
      </Card>

      {/* Items list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Danh sách bài trong kế hoạch</CardTitle>
            <BatchGenerateDraftsForm tenantId={id} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {contentPlan.items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">
              Chưa có bài nào. Thêm bài bên dưới hoặc tạo site từ Subdomain Factory để tự động điền kế hoạch.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {contentPlan.items.map((item) => {
                const post = item.postId ? postMap.get(item.postId) : null;
                return (
                  <div key={item.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-none w-6 text-xs text-slate-400 font-mono pt-0.5 text-right">
                      {item.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-800 leading-snug">{item.title}</p>
                        <Badge variant={ITEM_STATUS_VARIANT[item.status] ?? "neutral"}>
                          {ITEM_STATUS_LABEL[item.status] ?? item.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.keyword}
                        {item.intent ? ` · ${item.intent}` : ""}
                        {item.articleType !== "travel_guide" ? ` · ${item.articleType}` : ""}
                      </p>
                      {post && (
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/admin/sites/${id}/blog/${post.id}`}
                            className="text-xs text-indigo-600 hover:underline truncate max-w-[280px]"
                          >
                            {post.title}
                          </Link>
                          {post.qualityScore != null && (
                            <Badge variant={post.qualityScore >= 75 ? "success" : "warning"}>
                              Q{post.qualityScore}
                            </Badge>
                          )}
                          {post.seoScore != null && (
                            <Badge variant={post.seoScore >= 75 ? "success" : "warning"}>
                              SEO{post.seoScore}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-none">
                      <ContentPlanItemActions
                        itemId={item.id}
                        tenantId={id}
                        postId={item.postId}
                        postStatus={post?.status}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add new item */}
      <AddContentPlanItemForm contentPlanId={contentPlan.id} tenantId={id} />
    </div>
  );
}
