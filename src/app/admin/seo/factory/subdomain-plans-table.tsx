import Link from "next/link";
import { Check, X, Rocket, RotateCcw } from "lucide-react";
import type { SubdomainPlanStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { createSiteFromSubdomainPlanAction, updateSubdomainPlanStatusAction } from "@/server/actions/subdomain-plans";

interface PlanRow {
  id: string;
  fullDomain: string;
  keyword: string;
  intent: string | null;
  seoScore: number;
  opportunityScore: number;
  status: SubdomainPlanStatus;
  rationale: string | null;
  tenantId: string | null;
  tenant?: { name: string; primaryDomain: string | null } | null;
}

const statusVariant = {
  DRAFT: "neutral",
  APPROVED: "info",
  CREATED: "success",
  REJECTED: "warning",
} as const;

function SmallSubmit({ children }: { children: React.ReactNode }) {
  return <button className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-600 hover:bg-slate-50" type="submit">{children}</button>;
}

export function SubdomainPlansTable({ plans }: { plans: PlanRow[] }) {
  if (plans.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Saved Subdomain Plans</h2>
        <Badge variant="info">{plans.length} plans</Badge>
      </div>
      <div className="grid gap-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-semibold text-slate-900">{plan.fullDomain}</p>
                  <Badge variant={statusVariant[plan.status]}>{plan.status}</Badge>
                  <Badge variant={plan.seoScore >= 80 ? "success" : "warning"}>SEO {plan.seoScore}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{plan.keyword}</p>
                <p className="mt-1 text-xs text-slate-400">{plan.intent ?? "Travel guide"} · opportunity {plan.opportunityScore}/100</p>
                {plan.rationale && <p className="mt-2 text-xs text-slate-500">{plan.rationale}</p>}
                {plan.tenantId && <Link className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:underline" href={`/admin/sites/${plan.tenantId}`}>Open created site →</Link>}
              </div>
              <div className="flex flex-wrap gap-2">
                {plan.status !== "APPROVED" && plan.status !== "CREATED" && (
                  <form action={updateSubdomainPlanStatusAction.bind(null, plan.id, "APPROVED")}><SmallSubmit><Check className="h-3.5 w-3.5" />Approve</SmallSubmit></form>
                )}
                {plan.status !== "REJECTED" && plan.status !== "CREATED" && (
                  <form action={updateSubdomainPlanStatusAction.bind(null, plan.id, "REJECTED")}><SmallSubmit><X className="h-3.5 w-3.5" />Reject</SmallSubmit></form>
                )}
                {plan.status === "REJECTED" && (
                  <form action={updateSubdomainPlanStatusAction.bind(null, plan.id, "DRAFT")}><SmallSubmit><RotateCcw className="h-3.5 w-3.5" />Restore</SmallSubmit></form>
                )}
                {plan.status === "APPROVED" && !plan.tenantId && (
                  <form action={createSiteFromSubdomainPlanAction.bind(null, plan.id)}><SmallSubmit><Rocket className="h-3.5 w-3.5" />Create site</SmallSubmit></form>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
