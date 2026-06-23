"use client";

import { useActionState } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSubdomainPlansFromClustersAction } from "@/server/actions/keyword-projects";

export function ClusterToSubdomainForm({ projectId, clusterCount }: { projectId: string; clusterCount: number }) {
  const action = createSubdomainPlansFromClustersAction.bind(null, projectId);
  const [state, formAction] = useActionState(action, { ok: false });
  if (clusterCount === 0) return null;
  return (
    <Card className="p-4 mb-6">
      <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Compass className="h-4 w-4 text-indigo-500" />Push Clusters to Subdomain Factory</h2>
      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input name="rootDomain" className="h-9 rounded-lg border border-slate-300 px-3 text-sm font-mono" placeholder="domain.com" defaultValue="domain.com" />
        <Button type="submit" size="sm" variant="outline"><Compass className="h-3.5 w-3.5" />Create subdomain plans</Button>
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
        {state.ok && <p className="text-xs text-emerald-600">Đã tạo Subdomain Plans từ clusters. Qua Subdomain Factory để duyệt.</p>}
      </form>
    </Card>
  );
}
