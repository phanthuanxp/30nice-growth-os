"use client";

import { useActionState } from "react";
import { CalendarClock, RotateCcw, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bulkScheduleContentPlanAction, scheduleContentPlanItemAction, unscheduleContentPlanItemAction } from "@/server/actions/publishing-controls";

type TenantOption = { id: string; name: string };

export function BulkScheduleForm({ tenants }: { tenants: TenantOption[] }) {
  const [state, action] = useActionState(bulkScheduleContentPlanAction, { ok: false });
  return (
    <form action={action} className="grid gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 lg:grid-cols-6">
      <select name="tenantId" className="h-9 rounded-lg border border-slate-300 px-3 text-sm"><option value="">All sites</option>{tenants.map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
      <input name="startAt" type="date" className="h-9 rounded-lg border border-slate-300 px-3 text-sm" />
      <input name="postsPerDay" type="number" min="1" max="20" defaultValue="3" className="h-9 rounded-lg border border-slate-300 px-3 text-sm" />
      <input name="days" type="number" min="1" max="90" defaultValue="14" className="h-9 rounded-lg border border-slate-300 px-3 text-sm" />
      <Button type="submit" size="sm" className="lg:col-span-2"><WandSparkles className="h-3.5 w-3.5" />Bulk schedule planned/drafts</Button>
      <div className="lg:col-span-6">{state.error && <p className="text-xs text-red-600">{state.error}</p>}{state.ok && <p className="text-xs text-emerald-600">Bulk schedule finished.</p>}</div>
    </form>
  );
}

export function ScheduleItemForm({ itemId, current }: { itemId: string; current?: Date | null }) {
  const action = scheduleContentPlanItemAction.bind(null, itemId);
  const [state, formAction] = useActionState(action, { ok: false });
  const value = current ? new Date(current).toISOString().slice(0, 16) : undefined;
  return (
    <div className="mt-3 space-y-2">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input name="scheduledAt" type="datetime-local" defaultValue={value} className="h-8 min-w-44 rounded-md border border-slate-300 px-2 text-xs" />
        <Button type="submit" size="sm" variant="outline"><CalendarClock className="h-3.5 w-3.5" />Set</Button>
        {current && <button formAction={unscheduleContentPlanItemAction.bind(null, itemId)} className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-600 hover:bg-slate-50" type="submit"><RotateCcw className="h-3.5 w-3.5" />Clear</button>}
      </form>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
