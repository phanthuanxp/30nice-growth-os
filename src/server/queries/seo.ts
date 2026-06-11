import { prisma } from "@/server/db";

export type SeoIssue = {
  type: string;
  resource: "page" | "post";
  id: string;
  title: string;
  severity: "error" | "warning" | "info";
  detail?: string;
};

export type SeoAuditResult = {
  score: number;
  issues: SeoIssue[];
  pageCount: number;
  postCount: number;
  publishedPageCount: number;
  publishedPostCount: number;
};

export async function runSeoAudit(tenantId?: string): Promise<SeoAuditResult> {
  const where = tenantId ? { tenantId } : {};

  const [pages, posts] = await Promise.all([
    prisma.page.findMany({
      where,
      select: {
        id: true, title: true, slug: true,
        seoTitle: true, seoDescription: true,
        status: true, summary: true,
      },
    }),
    prisma.post.findMany({
      where,
      select: {
        id: true, title: true, slug: true,
        seoTitle: true, seoDescription: true,
        excerpt: true, content: true, status: true,
      },
    }),
  ]);

  const publishedPages = pages.filter((p) => p.status === "PUBLISHED");
  const publishedPosts = posts.filter((p) => p.status === "PUBLISHED");
  const issues: SeoIssue[] = [];

  for (const page of publishedPages) {
    if (!page.seoTitle) {
      issues.push({ type: "Thiếu SEO Title", resource: "page", id: page.id, title: page.title, severity: "error" });
    } else if (page.seoTitle.length > 60) {
      issues.push({ type: "SEO Title quá dài", resource: "page", id: page.id, title: page.title, severity: "warning", detail: `${page.seoTitle.length}/60 ký tự` });
    }
    if (!page.seoDescription) {
      issues.push({ type: "Thiếu Meta Description", resource: "page", id: page.id, title: page.title, severity: "error" });
    } else if (page.seoDescription.length > 155) {
      issues.push({ type: "Meta Description quá dài", resource: "page", id: page.id, title: page.title, severity: "warning", detail: `${page.seoDescription.length}/155 ký tự` });
    }
    if (!page.summary) {
      issues.push({ type: "Thiếu mô tả trang", resource: "page", id: page.id, title: page.title, severity: "info" });
    }
  }

  for (const post of publishedPosts) {
    if (!post.seoTitle) {
      issues.push({ type: "Thiếu SEO Title", resource: "post", id: post.id, title: post.title, severity: "error" });
    } else if (post.seoTitle.length > 60) {
      issues.push({ type: "SEO Title quá dài", resource: "post", id: post.id, title: post.title, severity: "warning", detail: `${post.seoTitle.length}/60 ký tự` });
    }
    if (!post.seoDescription) {
      issues.push({ type: "Thiếu Meta Description", resource: "post", id: post.id, title: post.title, severity: "error" });
    }
    if (!post.excerpt) {
      issues.push({ type: "Thiếu Excerpt", resource: "post", id: post.id, title: post.title, severity: "warning" });
    }
    if (post.content.length < 300) {
      issues.push({ type: "Nội dung quá ngắn", resource: "post", id: post.id, title: post.title, severity: "warning", detail: `${post.content.length} ký tự (tối thiểu 300)` });
    }
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const total = publishedPages.length + publishedPosts.length;
  const score = total === 0 ? 100 : Math.max(0, Math.round(100 - errorCount * 10 - warningCount * 3));

  return {
    score,
    issues,
    pageCount: pages.length,
    postCount: posts.length,
    publishedPageCount: publishedPages.length,
    publishedPostCount: publishedPosts.length,
  };
}

export async function saveAuditResult(tenantId: string, score: number, issues: SeoIssue[]) {
  return prisma.seoAudit.create({ data: { tenantId, score, issues } });
}

export async function getLastAudit(tenantId: string) {
  return prisma.seoAudit.findFirst({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}
