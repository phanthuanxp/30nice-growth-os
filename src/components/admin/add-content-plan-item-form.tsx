"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addContentPlanItemAction } from "@/server/actions/generate-plan-drafts";

export function AddContentPlanItemForm({ contentPlanId, tenantId }: { contentPlanId: string; tenantId: string }) {
  const boundAction = addContentPlanItemAction.bind(null, contentPlanId, tenantId);
  const [state, formAction] = useActionState(boundAction, { ok: false });
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Plus className="h-4 w-4 text-indigo-500" />Thêm bài mới vào kế hoạch</CardTitle></CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input name="title" required className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" placeholder="Tiêu đề bài (VD: Best Hotels in Hanoi)" />
            <input name="keyword" required className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" placeholder="Keyword chính (VD: best hotels hanoi)" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select name="intent" className="h-10 rounded-lg border border-slate-300 px-3 text-sm">
              <option value="INFORMATIONAL">Informational</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="TRANSACTIONAL">Transactional</option>
            </select>
            <select name="articleType" className="h-10 rounded-lg border border-slate-300 px-3 text-sm">
              <option value="travel_guide">Travel Guide</option>
              <option value="review">Review</option>
              <option value="comparison">Comparison</option>
              <option value="faq">FAQ</option>
              <option value="listicle">Listicle</option>
            </select>
            <input name="priority" type="number" defaultValue="50" min="0" max="100" className="h-10 rounded-lg border border-slate-300 px-3 text-sm" placeholder="Priority (0-100)" />
          </div>
          <Button type="submit" size="sm">
            <Plus className="h-3.5 w-3.5" />
            Thêm bài
          </Button>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          {state.ok && <p className="text-xs text-emerald-600">Đã thêm vào kế hoạch!</p>}
        </form>
      </CardContent>
    </Card>
  );
}
