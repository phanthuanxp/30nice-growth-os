import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, Layers, Plus, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { prisma } from "@/server/db";
import { SiteFactoryCluster } from "./factory-client";
import { SubdomainPlanner } from "./subdomain-planner";
import { SubdomainPlansTable } from "./subdomain-plans-table";

export const metadata: Metadata = { title: "Subdomain Factory" };

export default async function SiteFactoryPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/admin/seo/factory");
  if (!can(session.role, "AGENCY_ADMIN")) redirect("/admin/dashboard");

  const subdomainPlans = await prisma.subdomainPlan.findMany({
    orderBy: [{ status: "asc" }, { seoScore: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: { tenant: { select: { name: true, primaryDomain: true } } },
  }).catch(() => []);

  const clusters = await prisma.keywordCluster.findMany({
    orderBy: { totalVolume: "desc" },
    include: {
      project: { select: { id: true, name: true } },
      assignedTenant: { select: { id: true, name: true, slug: true, primaryDomain: true } },
      members: {
        take: 5,
        include: { keyword: { select: { text: true, searchVolume: true } } },
      },
    },
  }).catch(() => []);

  const assigned = clusters.filter((c) => c.assignedTenantId);
  const pending = clusters.filter((c) => !c.assignedTenantId);

  return (
    <div>
      <PageHeader
        title="Subdomain Factory"
        description="Tạo mạng lưới subdomain tin tức/review/du lịch tiếng Anh từ keyword, địa điểm và tourist entities."
        action={
          <Link href="/admin/seo/keywords">
            <Badge variant="info">
              <Layers className="h-3.5 w-3.5 mr-1" />
              Keyword Engine
            </Badge>
          </Link>
        }
      />

      <SubdomainPlanner />

      <SubdomainPlansTable plans={subdomainPlans} />

      <div className="grid grid-cols-3 gap-4 mb-6 mt-8">
        <StatCard title="Tổng clusters" value={clusters.length} icon={Layers} />
        <StatCard title="Đã có site" value={assigned.length} icon={CheckCircle2} iconColor="text-emerald-600" />
        <StatCard title="Chưa có site" value={pending.length} icon={Clock} iconColor="text-amber-600" />
      </div>

      {clusters.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Chưa có keyword cluster nào"
          description="Vào SEO Keyword Engine → tạo project → import từ khóa → Auto Cluster."
          action={
            <Link href="/admin/seo/keywords">
              <Badge variant="default">Đi đến Keyword Engine</Badge>
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Chưa có site ({pending.length})
              </h2>
              <div className="grid gap-3">
                {pending.map((c) => (
                  <SiteFactoryCluster
                    key={c.id}
                    cluster={{
                      id: c.id,
                      name: c.name,
                      headKeyword: c.headKeyword,
                      totalVolume: c.totalVolume,
                      suggestedSlug: c.suggestedSlug,
                      suggestedDomain: c.suggestedDomain,
                      memberCount: c.members.length,
                      topKeywords: c.members.map((m) => m.keyword.text),
                      projectName: c.project.name,
                      projectId: c.project.id,
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {assigned.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Đã có site ({assigned.length})
              </h2>
              <div className="grid gap-3">
                {assigned.map((c) => (
                  <Card key={c.id} className="p-4 opacity-75">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-700">{c.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {c.headKeyword} · Vol: {c.totalVolume.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-700">{c.assignedTenant!.name}</p>
                          <p className="text-xs text-slate-400">{c.assignedTenant!.primaryDomain}</p>
                        </div>
                        <Link href={`/admin/sites/${c.assignedTenantId}`}>
                          <Badge variant="success">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Badge>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
