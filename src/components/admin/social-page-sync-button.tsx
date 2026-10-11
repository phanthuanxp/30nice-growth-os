"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { syncMetaPageAction, type MetaActionResult } from "@/server/actions/social-meta";

const initialState: MetaActionResult = { ok: false };

export function SocialPageSyncButton({ pageId }: { pageId: string }) {
  const [state, action, pending] = useActionState(syncMetaPageAction.bind(null, pageId), initialState);
  return (
    <form action={action} className="inline-flex flex-col gap-1">
      <button className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 disabled:opacity-60" disabled={pending}>
        <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} /> Sync
      </button>
      {state.error && <span className="text-[11px] font-medium text-red-600">{state.error}</span>}
      {state.ok && <span className="text-[11px] font-medium text-emerald-600">Đã sync</span>}
    </form>
  );
}
