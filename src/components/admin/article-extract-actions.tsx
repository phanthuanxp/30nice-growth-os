"use client";

import { useActionState } from "react";
import { WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { extractPendingArticlesAction } from "@/server/actions/article-extractor";

export function ExtractPendingArticlesForm() {
  const [state, action] = useActionState(extractPendingArticlesAction, { ok: false });
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input name="limit" type="number" min="1" max="20" defaultValue="5" className="h-8 w-20 rounded-md border border-slate-300 px-2 text-xs" />
      <Button type="submit" size="sm" variant="outline"><WandSparkles className="h-3.5 w-3.5" />Extract pending</Button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.ok && <span className="text-xs text-emerald-600">Extraction finished.</span>}
    </form>
  );
}
