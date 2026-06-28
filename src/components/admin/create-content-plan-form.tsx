"use client";

import { useActionState } from "react";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createContentPlanAction } from "@/server/actions/generate-plan-drafts";

export function CreateContentPlanForm({ tenantId }: { tenantId: string }) {
  const boundAction = createContentPlanAction.bind(null, tenantId);
  const [state, formAction] = useActionState(boundAction, { ok: false });
  return (
    <form action={formAction} className="inline-flex flex-col items-center gap-3">
      <input name="title" className="h-10 w-72 rounded-lg border border-slate-300 px-3 text-sm" placeholder="Tên kế hoạch (VD: Ha Long Bay Content Plan)" />
      <Button type="submit" size="sm">
        <Map className="h-3.5 w-3.5" />
        Tạo Content Plan
      </Button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
