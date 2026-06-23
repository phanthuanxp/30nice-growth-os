import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Brain, Plus, FileText, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTenantById } from "@/server/queries/tenants";
import { listAiContentJobs } from "@/server/queries/ai-content";
import { SiteSidebar } from "@/components/admin/site-sidebar";
import { NewContentJobForm } from "./new-job-form";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `AI Content — ${tenant.name}` : "AI Content" };
}

const JOB_STATUS: Record<string, { label: string; variant: "neutral" | "info" | "warning" | "success" | "danger" | "default"; icon: typeof Clock }> = {
  PENDING: { label: "Chờ xử lý", variant: "neutral", icon: Clock },
  BRIEF_READY: { label: "Có brief", variant: "info", icon: FileText },
  GENERATING: { label: "Đang tạo...", variant: "warning", icon: Loader2 },
  DRAFT: { label: "Draft xong", variant: "default", icon: CheckCircle2 },
  REVIEW: { label: "Đang review", variant: "warning", icon: Clock },
  PUBLISHED: { label: "Đã đăng", variant: "success", icon: CheckCircle2 },
  FAILED: { label: "Lỗi", variant: "danger", icon: AlertCircle },
};

const CONTENT_TYPE_LABEL: Record<string, string> = {
  BLOG_POST: "Blog",
  LANDING_PAGE: "Landing",
  SERVICE_PAGE: "Dịch vụ",
  FAQ_PAGE: "FAQ",
  REVIEW_PAGE: "Review",
  COMPARISON_PAGE: "So sánh",
};

export default async function AiContentPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  const jobs = await listAiContentJobs(id).catch(() => []);

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
            title="AI Content Engine"
            description="Tạo content chuẩn SEO với AI: brief → draft → publish."
          />

          <NewContentJobForm tenantId={id} />

          {jobs.length === 0 ? (
            <EmptyState
              icon={Brain}
              title="Chưa có content job nào"
              description="Điền form phía trên để tạo content mới với AI."
            />
          ) : (
            <div className="grid gap-3">
              {jobs.map((job) => {
                const st = JOB_STATUS[job.status] ?? JOB_STATUS.PENDING;
                const Icon = st.icon;
                return (
                  <Link key={job.id} href={`/admin/sites/${id}/ai-content/${job.id}`}>
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-800 truncate">{job.title}</h3>
                            <Badge variant={st.variant} className="shrink-0">
                              <Icon className="h-3 w-3 mr-1" />
                              {st.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            {job.targetKeyword && <span>KW: {job.targetKeyword}</span>}
                            <span>{CONTENT_TYPE_LABEL[job.contentType] ?? job.contentType}</span>
                            <span>~{job.targetLength} từ</span>
                            <span>{job.language}</span>
                            <span>{job.createdAt.toLocaleDateString("vi-VN")}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
