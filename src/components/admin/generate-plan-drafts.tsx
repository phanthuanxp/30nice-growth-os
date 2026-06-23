"use client";

import { useActionState } from "react";
import { FilePlus2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateDraftForContentPlanItemAction, generateMissingDraftsAction } from "@/server/actions/generate-plan-drafts";

type TenantOption = { id: string; name: string };

export function GenerateMissingDraftsForm({ tenants }: { tenants: TenantOption[] }) {
  const [state, action] = useActionState(generateMissingDraftsAction, { ok: false });
  return (
    <form action={action} className="grid gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 lg:grid-cols-4">
      <select name="tenantId" className="h-9 rounded-lg border border-slate-300 px-3 text-sm"><option value="">All sites</option>{tenants.map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
      <input name="limit" type="number" min="1" max="25" defaultValue="5" className="h-9 rounded-lg border border-slate-300 px-3 text-sm" />
      <Button type="submit" size="sm" className="lg:col-span-2"><WandSparkles className="h-3.5 w-3.5" />Generate missing drafts</Button>
      <div className="lg:col-span-4">{state.error && <p className="text-xs text-amber-700">{state.error}</p>}{state.ok && <p className="text-xs text-emerald-600">Draft generation finished.</p>}</div>
    </form>
  );
}

export function GenerateSingleDraftButton({ itemId, disabled }: { itemId: string; disabled?: boolean }) {
  if (disabled) return null;
  return (
    <form action={generateDraftForContentPlanItemAction.bind(null, itemId)} className="mt-2">
      <Button type="submit" size="sm" variant="outline"><FilePlus2 className="h-3.5 w-3.5" />Generate draft</Button>
    </form>
  );
}
