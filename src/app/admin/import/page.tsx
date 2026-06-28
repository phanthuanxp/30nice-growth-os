import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, Globe2, Link2, Newspaper, CheckCircle2, Clock, FileText, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImportForm } from "@/components/admin/import-form";
import { ContentSourceForms } from "@/components/admin/content-source-forms";
import { ExtractPendingArticlesForm } from "@/components/admin/article-extract-actions";
import { RewriteReadyDraftsForm } from "@/components/admin/rewrite-draft-actions";
import { ReviewQueueActions } from "@/components/admin/review-queue-actions";
import { CrawlSourceButton } from "@/components/admin/crawl-source-button";
import { FullPipelineButton } from "@/components/admin/full-pipeline-button";
import { getTenants } from "@/server/queries/tenants";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "Source Import / Crawl" };

const ARTICLE_STATUS_VARIANT: Record<string, "neutral" | "info" | "warning" | "success" | "danger"> = {
  DISCOVERED: "neutral",
  EXTRACTED: "info",
  READY_FOR_REWRITE: "info",
  REWRITE_QUEUED: "warning",
  DRAFT_CREATED: "warning",
  SCHEDULED: "info",
  PUBLISHED: "success",
  DUPLICATE: "neutral",
  FAILED: "danger",
};

export default async function ImportPage() {
  let tenants: { id: string; name: string }[] = [];
  let sources: { id: string; name: string; baseUrl: string; sourceType: string; crawlStatus: string; articles: number; lastCrawledAt?: Date | null }[] = [];
  let recentArticles: { id: string; title: string | null; url: string; status: string; targetKeyword: string | null; draftPostId?: string | null; scheduledPublishAt?: Date | null; draftPost?: { id: string; title: string; status: string; qualityScore: number | null; seoScore: number | null } | null }[] = [];
  let pipelineCounts = { discovered: 0, ready: 0, draft: 0, published: 0, failed: 0 };

  try {
    const rows = await getTenants();
    tenants = rows.map((t) => ({ id: t.id, name: t.name }));

    const sourceRows = await prisma.contentSource.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { _count: { select: { articles: true } } },
    });
    sources = sourceRows.map((s) => ({ id: s.id, name: s.name, baseUrl: s.baseUrl, sourceType: s.sourceType, crawlStatus: s.crawlStatus, articles: s._count.articles, lastCrawledAt: s.lastCrawledAt }));

    // Pipeline status counts
    const statusCounts = await prisma.sourceArticle.groupBy({ by: ["status"], _count: { id: true } });
    for (const s of statusCounts) {
      if (s.status === "DISCOVERED") pipelineCounts.discovered += s._count.id;
      else if (s.status === "READY_FOR_REWRITE" || s.status === "EXTRACTED") pipelineCounts.ready += s._count.id;
      else if (s.status === "DRAFT_CREATED" || s.status === "SCHEDULED") pipelineCounts.draft += s._count.id;
      else if (s.status === "PUBLISHED") pipelineCounts.published += s._count.id;
      else if (s.status === "FAILED") pipelineCounts.failed += s._count.id;
    }

    const articleRows = await prisma.sourceArticle.findMany({
      orderBy: { updatedAt: "desc" },
      take: 30,
      select: { id: true, title: true, url: true, status: true, targetKeyword: true, draftPostId: true, scheduledPublishAt: true },
    });
    const draftIds = articleRows.map((a) => a.draftPostId).filter(Boolean) as string[];
    const drafts = draftIds.length
      ? await prisma.post.findMany({ where: { id: { in: draftIds } }, select: { id: true, title: true, status: true, qualityScore: true, seoScore: true } })
      : [];
    const draftMap = new Map(drafts.map((p) => [p.id, p]));
    recentArticles = articleRows.map((a) => ({ ...a, draftPost: a.draftPostId ? draftMap.get(a.draftPostId) ?? null : null }));
  } catch {
    // DB not available
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Source Import / Crawl"
        description="Crawl sitemap/RSS → extract nội dung → AI rewrite → publish. Pipeline tự động chạy thứ Hai & thứ Năm lúc 9h sáng."
      />

      {/* Pipeline status stats */}
      <div className="grid gap-3 sm:grid-cols-5">
        {[
          { label: "Discovered", value: pipelineCounts.discovered, icon: Globe2, color: "text-slate-600" },
          { label: "Ready to rewrite", value: pipelineCounts.ready, icon: FileText, color: "text-indigo-600" },
          { label: "Draft created", value: pipelineCounts.draft, icon: Clock, color: "text-amber-600" },
          { label: "Published", value: pipelineCounts.published, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Failed", value: pipelineCounts.failed, icon: AlertCircle, color: "text-red-500" },
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center">
            <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{s.label}</p>
          </Card>
        ))}
      </div>

      <ContentSourceForms tenants={tenants} sources={sources} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sources with pipeline controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-indigo-500" />Content Sources</CardTitle>
            <CardDescription>Bấm "Full Pipeline" để crawl → extract → rewrite tất cả trong một lần.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sources.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có nguồn crawl nào.</p>
            ) : (
              sources.map((s) => (
                <div key={s.id} className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{s.name}</p>
                      <p className="text-xs text-slate-500 break-all">{s.baseUrl}</p>
                    </div>
                    <Badge variant="info">{s.sourceType}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs text-slate-400">
                      {s.articles} articles · {s.crawlStatus}
                      {s.lastCrawledAt ? ` · Crawled ${new Date(s.lastCrawledAt).toLocaleDateString("vi-VN")}` : ""}
                    </p>
                    <div className="flex items-center gap-2">
                      <CrawlSourceButton sourceId={s.id} sourceType={s.sourceType} />
                      <FullPipelineButton sourceId={s.id} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Article queue */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2"><Newspaper className="h-4 w-4 text-indigo-500" />Article Queue</CardTitle>
                <CardDescription>Bài nguồn trong pipeline, sắp xếp theo thời gian cập nhật mới nhất.</CardDescription>
              </div>
              <div className="space-y-2">
                <ExtractPendingArticlesForm />
                <RewriteReadyDraftsForm />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {recentArticles.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có bài nguồn.</p>
            ) : (
              recentArticles.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{a.title || a.url}</p>
                      <p className="truncate text-xs text-slate-400">{a.url}</p>
                    </div>
                    <Badge variant={ARTICLE_STATUS_VARIANT[a.status] ?? "neutral"}>{a.status}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {a.targetKeyword && <span className="text-xs text-indigo-500">→ {a.targetKeyword}</span>}
                  </div>
                  {a.draftPost && (
                    <div className="mt-2 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={a.draftPost.status === "PUBLISHED" ? "success" : "warning"}>{a.draftPost.status}</Badge>
                        {a.draftPost.qualityScore != null && (
                          <Badge variant={(a.draftPost.qualityScore) >= 75 ? "success" : "warning"}>Q{a.draftPost.qualityScore}</Badge>
                        )}
                        {a.draftPost.seoScore != null && (
                          <Badge variant={(a.draftPost.seoScore) >= 75 ? "success" : "warning"}>SEO{a.draftPost.seoScore}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {a.status === "DRAFT_CREATED" && a.draftPostId && <ReviewQueueActions articleId={a.id} />}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legacy WordPress Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Download className="h-4 w-4 text-slate-400" />Legacy WordPress Import</CardTitle>
          <CardDescription>Giữ lại để migrate dữ liệu cũ; không phải hướng ưu tiên của Travel News CMS.</CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Cần tạo ít nhất một site trước khi nhập dữ liệu WordPress.</p>
              <Link href="/admin/sites/new"><Button variant="outline" size="sm">Tạo site mới <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          ) : (
            <ImportForm tenants={tenants} />
          )}
        </CardContent>
      </Card>

      <Card className="bg-indigo-50 border-indigo-200">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-2">
            <Link2 className="h-4 w-4" />Pipeline tự động
          </p>
          <ul className="space-y-1.5 text-xs text-indigo-700">
            <li>• <strong>Thứ Hai & Thứ Năm 9h sáng</strong>: GitHub Actions tự crawl tất cả nguồn SITEMAP/RSS</li>
            <li>• Extract content từ 30 URL mới nhất → lọc trùng theo content hash</li>
            <li>• AI rewrite 10 bài sẵn sàng → tạo draft Post với quality score</li>
            <li>• Cần thêm GitHub Secret <code className="bg-indigo-100 px-1 rounded">CRON_SECRET</code> và biến môi trường VPS cùng tên</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
