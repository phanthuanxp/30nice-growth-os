"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { selectMetaPageAction, type MetaActionResult } from "@/server/actions/social-meta";

type ManagedPage = { id: string; name: string; category?: string; tasks?: string[] };
const initialState: MetaActionResult = { ok: false };

export function MetaPageSelector({ oauthSessionId, pages }: { oauthSessionId: string; pages: ManagedPage[] }) {
  const [state, action, pending] = useActionState(selectMetaPageAction, initialState);
  const router = useRouter();
  useEffect(() => {
    if (state.ok) router.replace("/admin/social/pages?metaConnected=1");
  }, [router, state.ok]);
  return (
    <div className="space-y-3">
      {pages.map((page) => {
        const canPublish = !page.tasks || page.tasks.includes("CREATE_CONTENT");
        return (
          <form key={page.id} action={action} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <input type="hidden" name="oauthSessionId" value={oauthSessionId} />
            <input type="hidden" name="externalPageId" value={page.id} />
            <div><p className="font-semibold text-slate-800">{page.name}</p><p className="text-xs text-slate-500">{page.category || "Facebook Page"} · ID {page.id}</p>{!canPublish && <p className="mt-1 text-xs font-medium text-red-600">Thiếu tác vụ CREATE_CONTENT</p>}</div>
            <Button type="submit" loading={pending} disabled={!canPublish}><Facebook className="h-4 w-4" />Kết nối Page này</Button>
          </form>
        );
      })}
      {state.error && <p className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{state.error}</p>}
    </div>
  );
}
