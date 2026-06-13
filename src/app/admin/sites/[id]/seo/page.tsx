import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Search, AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AiWriter } from "@/components/admin/ai-writer";
import { getTenantById } from "@/server/queries/tenants";
import { runSeoAudit } from "@/server/queries/seo";
import { prisma } from "@/server/db";
import { BatchSeoClient, RedirectsClient, RobotsClient } from "./seo-tools-client";
import type { MissingMetaItem, RedirectRule } from "@/server/actions/seo";
import type { AiProvider } from "@/app/api/ai/generate/route";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `SEO — ${tenant.name}` : "SEO" };
}

const SEV_CONFIG = {
  error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50", label: "Lỗi nghiêm trọng" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", label: "Cảnh báo" },
  info: { icon: Info, color: "text-sky-500", bg: "bg-sky-50", label: "Đề xuất" },
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 100" className="w-28 h-28">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" />
        <text x="50" y="46" textAnchor="middle" fontSize="22" fontWeight="bold" fill={color}>{score}</text>
        <text x="50" y="60" textAnchor="middle" fontSize="10" fill="#94a3b8">/100</text>
      </svg>
      <p className="text-sm font-semibold" style={{ color }}>
        {score >= 80 ? "Tốt" : score >= 50 ? "Cần cải thiện" : "Yếu"}
      </p>
    </div>
  );
}

export default async function SiteSeoPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  const audit = await runSeoAudit(id).catch(() => null);

  const [missingPages, missingPosts, redirectsIntegration, robotsIntegration] = await Promise.all([
    prisma.page.findMany({
      where: { tenantId: id, OR: [{ seoTitle: null }, { seoTitle: "" }, { seoDescription: null }, { seoDescription: "" }] },
      select: { id: true, title: true, seoTitle: true, seoDescription: true },
    }).catch(() => []),
    prisma.post.findMany({
      where: { tenantId: id, OR: [{ seoTitle: null }, { seoTitle: "" }, { seoDescription: null }, { seoDescription: "" }] },
      select: { id: true, title: true, seoTitle: true, seoDescription: true },
    }).catch(() => []),
    prisma.integration.findFirst({ where: { tenantId: id, provider: "redirects" }, select: { config: true } }).catch(() => null),
    prisma.integration.findFirst({ where: { tenantId: id, provider: "robots_txt" }, select: { config: true } }).catch(() => null),
  ]);

  const missingMeta: MissingMetaItem[] = [
    ...missingPages.map((p) => ({
      id: p.id, resource: "page" as const, title: p.title,
      missingTitle: !p.seoTitle, missingDescription: !p.seoDescription,
    })),
    ...missingPosts.map((p) => ({
      id: p.id, resource: "post" as const, title: p.title,
      missingTitle: !p.seoTitle, missingDescription: !p.seoDescription,
    })),
  ];

  const redirectRules: RedirectRule[] = (() => {
    const rules = (redirectsIntegration?.config as { rules?: RedirectRule[] } | null)?.rules;
    return Array.isArray(rules) ? rules : [];
  })();
  const robotsContent = (robotsIntegration?.config as { content?: string } | null)?.content ?? "";

  const configuredProviders: AiProvider[] = [];
  if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-api03-...")) configuredProviders.push("claude");
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("sk-...")) configuredProviders.push("openai");
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_KEY") configuredProviders.push("gemini");
  if (process.env.NINER_ROUTER_API_KEY && process.env.NINER_ROUTER_API_KEY !== "YOUR_9ROUTER_KEY") configuredProviders.push("niner_router");

  if (!audit) {
    return (
      <div>
        <PageHeader title="SEO" description={`Phân tích SEO cho ${tenant.name}.`} />
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-500">Không thể tải dữ liệu SEO.</p>
        </Card>
      </div>
    );
  }

  const errors = audit.issues.filter((i) => i.severity === "error");
  const warnings = audit.issues.filter((i) => i.severity === "warning");
  const infos = audit.issues.filter((i) => i.severity === "info");

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO AI Engine"
        description={`Phân tích SEO tự động cho ${tenant.name}.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="flex flex-col items-center justify-center p-6">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Điểm SEO</p>
          <ScoreGauge score={audit.score} />
        </Card>

        <div className="lg:col-span-3 grid grid-cols-3 gap-4">
          {[
            { label: "Lỗi nghiêm trọng", count: errors.length, color: "text-red-600", bg: "bg-red-50" },
            { label: "Cảnh báo", count: warnings.length, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Đề xuất", count: infos.length, color: "text-sky-600", bg: "bg-sky-50" },
          ].map((s) => (
            <Card key={s.label} className={`p-5 ${s.bg}`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-sm text-slate-600 mt-1">{s.label}</p>
            </Card>
          ))}

          <Card className="col-span-3 p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                { label: "Tổng pages", value: audit.pageCount },
                { label: "Pages đã publish", value: audit.publishedPageCount },
                { label: "Tổng bài viết", value: audit.postCount },
                { label: "Bài đã publish", value: audit.publishedPostCount },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-bold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {audit.issues.length === 0 ? (
        <Card className="p-8 flex flex-col items-center text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
          <h3 className="text-base font-semibold text-slate-700">SEO hoàn hảo!</h3>
          <p className="text-sm text-slate-500 mt-1">Không có vấn đề nào được phát hiện.</p>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4 text-indigo-500" />
              Danh sách vấn đề ({audit.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {audit.issues.map((issue, i) => {
                const cfg = SEV_CONFIG[issue.severity];
                const Icon = cfg.icon;
                const editHref = issue.resource === "page"
                  ? `/admin/sites/${id}/pages/${issue.id}`
                  : `/admin/sites/${id}/blog/${issue.id}`;
                return (
                  <div key={i} className="flex items-start gap-3 px-5 py-3">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{issue.type}</span>
                        <Badge variant={issue.resource === "page" ? "info" : "default"} className="text-[10px]">
                          {issue.resource === "page" ? "Page" : "Bài viết"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{issue.title}{issue.detail ? ` · ${issue.detail}` : ""}</p>
                    </div>
                    <Link href={editHref}>
                      <Button variant="outline" size="sm">Sửa</Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <BatchSeoClient tenantId={id} items={missingMeta} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RedirectsClient tenantId={id} rules={redirectRules} />
        <RobotsClient tenantId={id} initial={robotsContent} />
      </div>

      <AiWriter configuredProviders={configuredProviders} />
    </div>
  );
}
