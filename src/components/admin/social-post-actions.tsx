"use client";

import { useActionState } from "react";
import { Copy, RotateCcw } from "lucide-react";
import { duplicateExternalPostAsDraftAction, syncMetaPagePostsAction, type MetaPostsActionResult } from "@/server/actions/social-meta";

const initial: MetaPostsActionResult = { ok: false };

export function SyncMetaPostsButton({ pageId }: { pageId: string }) {
  const [state, action, pending] = useActionState(async () => syncMetaPagePostsAction(pageId), initial);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <button disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
        <RotateCcw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
        {pending ? "Đang sync..." : "Sync Facebook posts"}
      </button>
      {state.ok && <span className="text-xs font-medium text-emerald-600">Đã sync {state.synced ?? 0} bài</span>}
      {state.error && <span className="text-xs font-medium text-red-600">{state.error}</span>}
    </form>
  );
}

export function DuplicateExternalPostButton({ postId }: { postId: string }) {
  const [state, action, pending] = useActionState(async () => duplicateExternalPostAsDraftAction(postId), initial);
  return (
    <form action={action} className="inline-flex items-center gap-2">
      <button disabled={pending} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 disabled:opacity-60">
        <Copy className="h-3 w-3" />
        {pending ? "Đang tạo..." : "Duplicate as GFVGO Draft"}
      </button>
      {state.ok && <span className="text-[11px] text-emerald-600">Đã tạo draft</span>}
      {state.error && <span className="text-[11px] text-red-600">{state.error}</span>}
    </form>
  );
}
