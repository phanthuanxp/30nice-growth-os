"use client";

import { useActionState } from "react";
import { FilePenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rewriteReadyArticlesToDraftsAction } from "@/server/actions/rewrite-drafts";

export function RewriteReadyDraftsForm() {
  const [state, action] = useActionState(rewriteReadyArticlesToDraftsAction, { ok: false });
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="limit" type="number" min="1" max="10" defaultValue="3" className="h-8 w-20 rounded-md border border-slate-300 px-2 text-xs" />
      <Button type="submit" size="sm" variant="outline"><FilePenLine className="h-3.5 w-3.5" />Rewrite to drafts</Button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.ok && <span className="text-xs text-emerald-600">Draft generation finished.</span>}
    </form>
  );
}
