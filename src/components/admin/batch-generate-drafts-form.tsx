"use client";

import { useActionState } from "react";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateMissingDraftsAction } from "@/server/actions/generate-plan-drafts";

export function BatchGenerateDraftsForm({ tenantId }: { tenantId: string }) {
  const [state, formAction] = useActionState(generateMissingDraftsAction, { ok: false });
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="tenantId" value={tenantId} />
      <select name="limit" className="h-8 rounded-md border border-slate-300 px-2 text-xs">
        {[3, 5, 10].map((n) => <option key={n} value={n}>{n} bài</option>)}
      </select>
      <Button size="sm" variant="outline" type="submit">
        <Brain className="h-3.5 w-3.5" />
        Tạo hàng loạt
      </Button>
      {state.error && <p className="text-xs text-amber-600">{state.error}</p>}
      {state.ok && !state.error && <p className="text-xs text-emerald-600">Đã tạo xong!</p>}
    </form>
  );
}
