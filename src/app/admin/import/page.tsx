import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, Globe2, Link2, Newspaper } from "lucide-react";
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
import { getTenants } from "@/server/queries/tenants";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "Source Import / Crawl" };

export default async function ImportPage() {
  let tenants: { id: string; name: string }[] = [];
  let sources: { id: string; name: string; baseUrl: string; sourceType: string; crawlStatus: string; articles: number }[] = [];
  let recentArticles: { id: string; title: string | null; url: string; status: string; targetKeyword: string | null; draftPostId?: string | null; scheduledPublishAt?: Date | null; draftPost?: { title: string; slug: string; status: string; qualityScore: number | null; seoScore: number | null } | null }[] = [];
  try {
    const rows = await getTenants();
    tenants = rows.map((t) => ({ id: t.id, name: t.name }));
    const sourceRows = await prisma.contentSource.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { _count: { select: { articles: true } } } });
    sources = sourceRows.map((s) => ({ id: s.id, name: s.name, baseUrl: s.baseUrl, sourceType: s.sourceType, crawlStatus: s.crawlStatus, articles: s._count.articles }));
    const articleRows = await prisma.sourceArticle.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, title: true, url: true, status: true, targetKeyword: true, draftPostId: true, scheduledPublishAt: true } });
    const draftIds = articleRows.map((a) => a.draftPostId).filter(Boolean) as string[];
    const drafts = draftIds.length ? await prisma.post.findMany({ where: { id: { in: draftIds } }, select: { id: true, title: true, slug: true, status: true, qualityScore: true, seoScore: true } }) : [];
    const draftMap = new Map(drafts.map((p) => [p.id, p]));
    recentArticles = articleRows.map((a) => ({ ...a, draftPost: a.draftPostId ? draftMap.get(a.draftPostId) ?? null : null }));
  } catch {
    // DB not available or migration pending
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Source Import / Crawl" description="Quản lý nguồn bài du lịch tiếng Anh, import URL crawl, chuẩn bị dữ liệu cho AI rewrite + SEO publish." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Sources</p><p className="text-2xl font-semibold">{sources.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Recent Articles</p><p className="text-2xl font-semibold">{recentArticles.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Target Sites</p><p className="text-2xl font-semibold">{tenants.length}</p></CardContent></Card>
      </div>

      <ContentSourceForms tenants={tenants} sources={sources} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-indigo-500" />Content Sources</CardTitle><CardDescription>Website, sitemap, RSS hoặc manual URL list dùng làm nguồn bài.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {sources.length === 0 ? <p className="text-sm text-slate-500">Chưa có nguồn crawl nào.</p> : sources.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3"><div><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-slate-500 break-all">{s.baseUrl}</p></div><Badge variant="info">{s.sourceType}</Badge></div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">{s.articles} articles · {s.crawlStatus}</p>
                  <CrawlSourceButton sourceId={s.id} sourceType={s.sourceType} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Newspaper className="h-4 w-4 text-indigo-500" />Recent Source Articles</CardTitle><CardDescription>Bài nguồn đã được import/discover, chờ extract/rewrite.</CardDescription></div><div className="space-y-2"><ExtractPendingArticlesForm /><RewriteReadyDraftsForm /></div></div></CardHeader>
          <CardContent className="space-y-3">
            {recentArticles.length === 0 ? <p className="text-sm text-slate-500">Chưa có bài nguồn.</p> : recentArticles.map((a) => (
              <div key={a.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{a.title || a.url}</p><p className="truncate text-xs text-slate-500">{a.url}</p></div><Badge variant="neutral">{a.status}</Badge></div>
                <div className="mt-2 flex flex-wrap items-center gap-2">{a.targetKeyword && <p className="text-xs text-indigo-500">Target: {a.targetKeyword}</p>}{a.status === "READY_FOR_REWRITE" && <Badge variant="success">Ready for AI rewrite</Badge>}{a.status === "DRAFT_CREATED" && <Badge variant="info">In review</Badge>}{a.status === "SCHEDULED" && <Badge variant="warning">Scheduled</Badge>}{a.status === "PUBLISHED" && <Badge variant="success">Published</Badge>}</div>
                {a.draftPost && <div className="mt-2 space-y-1"><p className="text-xs text-slate-500">Draft: {a.draftPost.title} · {a.draftPost.status}{a.scheduledPublishAt ? ` · ${new Date(a.scheduledPublishAt).toLocaleString()}` : ""}</p><div className="flex flex-wrap gap-2"><Badge variant={(a.draftPost.qualityScore ?? 0) >= 75 ? "success" : "warning"}>Quality {a.draftPost.qualityScore ?? "—"}</Badge><Badge variant={(a.draftPost.seoScore ?? 0) >= 75 ? "success" : "warning"}>SEO {a.draftPost.seoScore ?? "—"}</Badge>{((a.draftPost.qualityScore ?? 100) < 60 || (a.draftPost.seoScore ?? 100) < 60) && <Badge variant="warning">Review before publish</Badge>}</div></div>}
                {a.status === "DRAFT_CREATED" && a.draftPostId && <ReviewQueueActions articleId={a.id} />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Download className="h-4 w-4 text-slate-400" />Legacy WordPress Import</CardTitle><CardDescription>Giữ lại để migrate dữ liệu cũ; không phải hướng ưu tiên của Travel News CMS.</CardDescription></CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="space-y-3"><p className="text-sm text-slate-500">Cần tạo ít nhất một site trước khi nhập dữ liệu WordPress.</p><Link href="/admin/sites/new"><Button variant="outline" size="sm">Tạo site mới<ArrowRight className="h-4 w-4" /></Button></Link></div>
          ) : <ImportForm tenants={tenants} />}
        </CardContent>
      </Card>

      <Card className="bg-sky-50 border-sky-200">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-semibold text-sky-800 mb-2 flex items-center gap-2"><Link2 className="h-4 w-4" />Phase 3A scope</p>
          <ul className="space-y-1.5 text-xs text-sky-700"><li>• Lưu nguồn crawl và URL bài viết.</li><li>• Dedupe theo URL/content hash.</li><li>• Chuẩn bị hàng đợi cho bước extract → AI rewrite → SEO publish.</li></ul>
        </CardContent>
      </Card>
    </div>
  );
}
