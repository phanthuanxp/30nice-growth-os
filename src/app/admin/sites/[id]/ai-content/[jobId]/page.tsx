import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Brain, FileText, Pen, Tag } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTenantById } from "@/server/queries/tenants";
import { getAiContentJob } from "@/server/queries/ai-content";
import { SiteSidebar } from "@/components/admin/site-sidebar";
import { AiContentJobClient } from "./job-client";

interface Props {
  params: Promise<{ id: string; jobId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { jobId, id } = await params;
  const job = await getAiContentJob(jobId, id).catch(() => null);
  return { title: job ? `${job.title} — AI Content` : "AI Content Job" };
}

const JOB_STATUS_VARIANT: Record<string, "neutral" | "info" | "warning" | "success" | "danger" | "default"> = {
  PENDING: "neutral",
  BRIEF_READY: "info",
  GENERATING: "warning",
  DRAFT: "default",
  REVIEW: "warning",
  PUBLISHED: "success",
  FAILED: "danger",
};

const JOB_STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xử lý",
  BRIEF_READY: "Có brief",
  GENERATING: "Đang tạo...",
  DRAFT: "Bản nháp xong",
  REVIEW: "Đang review",
  PUBLISHED: "Đã đăng",
  FAILED: "Lỗi",
};

export default async function AiContentJobPage({ params }: Props) {
  const { id, jobId } = await params;
  const [tenant, job] = await Promise.all([
    getTenantById(id).catch(() => null),
    getAiContentJob(jobId, id).catch(() => null),
  ]);

  if (!tenant || !job) notFound();

  const brief = job.brief as Record<string, unknown> | null;

  return (
    <div className="flex flex-1 overflow-hidden">
      <SiteSidebar
        siteId={id}
        siteName={tenant.name}
        siteSlug={tenant.slug}
        primaryDomain={tenant.primaryDomain}
      />
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title={job.title}
            description={`${job.contentType} · ${job.targetKeyword ?? ""} · ${job.language}`}
            action={
              <div className="flex items-center gap-2">
                <Badge variant={JOB_STATUS_VARIANT[job.status] ?? "neutral"}>
                  {JOB_STATUS_LABEL[job.status] ?? job.status}
                </Badge>
                <Link href={`/admin/sites/${id}/ai-content`}>
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4" /> Danh sách
                  </Button>
                </Link>
              </div>
            }
          />

          {job.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {job.keywords.map((kw) => (
                <span key={kw} className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Error state */}
          {job.status === "FAILED" && job.errorMessage && (
            <Card className="p-4 mb-4 bg-red-50 border-red-200">
              <p className="text-sm text-red-700">
                <strong>Lỗi:</strong> {job.errorMessage}
              </p>
            </Card>
          )}

          {/* Brief preview */}
          {brief && (
            <Card className="p-4 mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" /> Content Brief
              </h3>
              {Array.isArray(brief.outline) && brief.outline.length > 0 ? (
                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-500 mb-1">Outline:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    {(brief.outline as string[]).map((h, i) => (
                      <li key={i} className="text-sm text-slate-700">{String(h)}</li>
                    ))}
                  </ol>
                </div>
              ) : null}
              {Array.isArray(brief.faqs) && brief.faqs.length > 0 ? (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">FAQs:</p>
                  <div className="space-y-1">
                    {(brief.faqs as { q: string; a: string }[]).slice(0, 3).map((faq, i) => (
                      <div key={i} className="text-xs">
                        <p className="font-medium text-slate-700">Q: {String(faq.q)}</p>
                        <p className="text-slate-500 ml-2">A: {String(faq.a)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          )}

          {/* Draft preview */}
          {job.draftHtml && (
            <Card className="p-4 mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Pen className="h-4 w-4 text-emerald-500" /> Draft Content
                {job.draftText && (
                  <span className="text-xs text-slate-400 font-normal">
                    ~{Math.round(job.draftText.split(/\s+/).length)} từ
                  </span>
                )}
              </h3>
              <div
                className="prose prose-sm max-w-none text-slate-700"
                dangerouslySetInnerHTML={{ __html: job.draftHtml }}
              />
            </Card>
          )}

          {/* Actions */}
          <AiContentJobClient
            jobId={jobId}
            tenantId={id}
            status={job.status}
            hasBrief={!!brief}
            hasDraft={!!job.draftHtml}
          />
        </div>
      </main>
    </div>
  );
}
