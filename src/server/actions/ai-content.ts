"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { writeAuditLog } from "@/server/audit/log";
import { aiGenerate } from "@/server/ai/generate";
import { prisma } from "@/server/db";
import { scorePostDraft } from "@/server/content/quality-score";
import {
  createAiContentJob,
  updateAiContentJob,
  deleteAiContentJob,
  getAiContentJob,
} from "@/server/queries/ai-content";
import type { AiContentType } from "@prisma/client";

export type AiContentResult = { ok: boolean; jobId?: string; postId?: string; error?: string };

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || `ai-content-${Date.now()}`;
}

async function uniquePostSlug(tenantId: string, base: string) {
  let slug = base;
  for (let i = 2; i < 50; i++) {
    const exists = await prisma.post.findUnique({ where: { tenantId_slug: { tenantId, slug } }, select: { id: true } });
    if (!exists) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

export async function createAiContentJobAction(
  tenantId: string,
  _prev: AiContentResult,
  form: FormData,
): Promise<AiContentResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!can(session.role, "EDITOR")) return { ok: false, error: "Không đủ quyền" };

  const title = form.get("title")?.toString().trim();
  const targetKeyword = form.get("targetKeyword")?.toString().trim();
  const keywordsRaw = form.get("keywords")?.toString().trim();
  const contentType = (form.get("contentType")?.toString() ?? "BLOG_POST") as AiContentType;
  const targetLength = parseInt(form.get("targetLength")?.toString() ?? "1000", 10);
  const language = form.get("language")?.toString().trim() ?? "vi";

  if (!title) return { ok: false, error: "Tiêu đề là bắt buộc" };

  const keywords = keywordsRaw
    ? keywordsRaw.split(/[,\n]+/).map((k) => k.trim()).filter(Boolean)
    : [];

  const job = await createAiContentJob(tenantId, session.id, {
    title,
    targetKeyword,
    keywords,
    contentType,
    targetLength,
    language,
  });

  await writeAuditLog({
    userId: session.id,
    action: "ai_content.create_job",
    resource: "AiContentJob",
    resourceId: job.id,
    tenantId,
  });

  revalidatePath(`/admin/sites/${tenantId}/ai-content`);
  return { ok: true, jobId: job.id };
}

const BRIEF_SYSTEM = `Bạn là chuyên gia SEO content. Tạo content brief chi tiết để viết bài đạt top Google. Trả về JSON với format:
{
  "outline": ["H1", "H2...", "H2...", "H2...", "Kết luận"],
  "keyPoints": ["điểm chính 1", "điểm chính 2", "..."],
  "searchIntent": "thông tin | thương mại | giao dịch | điều hướng",
  "suggestedWordCount": 1200,
  "internalLinks": ["chủ đề liên quan cần link"],
  "faqs": [{"q": "câu hỏi", "a": "trả lời ngắn"}]
}
Chỉ trả JSON thuần, không markdown.`;

export async function generateBriefAction(jobId: string, tenantId: string): Promise<AiContentResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };

  const job = await getAiContentJob(jobId, tenantId);
  if (!job) return { ok: false, error: "Job không tồn tại" };

  await updateAiContentJob(jobId, tenantId, { status: "GENERATING" });

  try {
    const prompt = `Tiêu đề bài: ${job.title}
Từ khóa chính: ${job.targetKeyword ?? job.title}
${job.keywords.length > 0 ? `Từ khóa phụ: ${job.keywords.slice(0, 10).join(", ")}` : ""}
Ngôn ngữ: ${job.language}
Loại nội dung: ${job.contentType}
Độ dài mục tiêu: ${job.targetLength} từ`;

    const { text } = await aiGenerate(BRIEF_SYSTEM, prompt);
    const jsonStr = text.trim().replace(/^```json?\s*/i, "").replace(/```\s*$/i, "");
    const brief = JSON.parse(jsonStr) as object;

    await updateAiContentJob(jobId, tenantId, { status: "BRIEF_READY", brief });
    revalidatePath(`/admin/sites/${tenantId}/ai-content/${jobId}`);
    return { ok: true, jobId };
  } catch (e) {
    await updateAiContentJob(jobId, tenantId, {
      status: "FAILED",
      errorMessage: e instanceof Error ? e.message : "Lỗi tạo brief",
    });
    return { ok: false, error: "Không thể tạo brief. Kiểm tra AI provider." };
  }
}

const DRAFT_SYSTEM = `Bạn là content writer SEO chuyên nghiệp. Viết bài hoàn chỉnh theo outline cung cấp. Yêu cầu:
- Dùng thẻ HTML: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>
- Từ khóa chính xuất hiện tự nhiên trong tiêu đề, mở bài, và 2-3 lần trong thân bài
- Văn phong tự nhiên, hữu ích, không spam từ khóa
- Kết thúc bằng CTA (call to action)
- Chỉ trả HTML content, không có <html><body> wrapper`;

export async function generateDraftAction(jobId: string, tenantId: string): Promise<AiContentResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };

  const job = await getAiContentJob(jobId, tenantId);
  if (!job) return { ok: false, error: "Job không tồn tại" };
  if (!job.brief) return { ok: false, error: "Chưa có brief. Tạo brief trước." };

  await updateAiContentJob(jobId, tenantId, { status: "GENERATING" });

  try {
    const briefStr = JSON.stringify(job.brief, null, 2);
    const prompt = `Tiêu đề: ${job.title}
Từ khóa chính: ${job.targetKeyword ?? job.title}
${job.keywords.length > 0 ? `Từ khóa phụ: ${job.keywords.slice(0, 8).join(", ")}` : ""}
Ngôn ngữ: ${job.language}
Độ dài mục tiêu: ${job.targetLength} từ

Content Brief:
${briefStr}

Viết bài hoàn chỉnh theo brief trên.`;

    const { text } = await aiGenerate(DRAFT_SYSTEM, prompt);

    const draftText = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    await updateAiContentJob(jobId, tenantId, {
      status: "DRAFT",
      draftHtml: text,
      draftText,
    });

    revalidatePath(`/admin/sites/${tenantId}/ai-content/${jobId}`);
    return { ok: true, jobId };
  } catch (e) {
    await updateAiContentJob(jobId, tenantId, {
      status: "FAILED",
      errorMessage: e instanceof Error ? e.message : "Lỗi viết draft",
    });
    return { ok: false, error: "Không thể viết draft. Kiểm tra AI provider." };
  }
}

export async function deleteAiContentJobAction(jobId: string, tenantId: string): Promise<AiContentResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };

  try {
    await deleteAiContentJob(jobId, tenantId);
    revalidatePath(`/admin/sites/${tenantId}/ai-content`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không thể xóa job" };
  }
}

export async function publishAiJobToPostAction(jobId: string, tenantId: string): Promise<AiContentResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Chưa đăng nhập" };
  if (!can(session.role, "EDITOR")) return { ok: false, error: "Không đủ quyền" };

  const job = await getAiContentJob(jobId, tenantId);
  if (!job) return { ok: false, error: "Job không tồn tại" };
  if (!job.draftHtml) return { ok: false, error: "Chưa có draft. Tạo draft trước." };
  if (job.postId) return { ok: false, postId: job.postId, error: "Draft này đã được lưu thành post." };

  try {
    const baseSlug = slugify(job.title);
    const slug = await uniquePostSlug(tenantId, baseSlug);
    const draftText = job.draftText || job.draftHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const excerpt = draftText.slice(0, 300);

    const qualityReport = scorePostDraft({
      title: job.title,
      content: job.draftHtml,
      excerpt,
      seoTitle: job.seoTitle,
      seoDescription: job.seoDescription,
      keyword: job.targetKeyword,
    });

    const post = await prisma.post.create({
      data: {
        tenantId,
        title: job.title,
        slug,
        excerpt,
        content: job.draftHtml,
        status: "DRAFT",
        seoTitle: (job.seoTitle || job.title).slice(0, 70),
        seoDescription: job.seoDescription,
        twitterCard: "summary_large_image",
        schemaType: "Article",
        qualityScore: qualityReport.qualityScore,
        seoScore: qualityReport.seoScore,
        qualityReport,
      },
    });

    await updateAiContentJob(jobId, tenantId, { status: "REVIEW", postId: post.id });
    await writeAuditLog({ userId: session.id, tenantId, action: "ai_content.save_to_post", resource: "Post", resourceId: post.id, metadata: { jobId } });
    revalidatePath(`/admin/sites/${tenantId}/ai-content/${jobId}`);
    revalidatePath(`/admin/sites/${tenantId}/blog`);
    return { ok: true, jobId, postId: post.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Không thể tạo post" };
  }
}
