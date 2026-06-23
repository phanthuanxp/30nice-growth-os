"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateTravelKeywordsAction } from "@/server/actions/keyword-projects";

export function TravelKeywordGenerator({ projectId, defaultNiche }: { projectId: string; defaultNiche?: string | null }) {
  const action = generateTravelKeywordsAction.bind(null, projectId);
  const [state, formAction] = useActionState(action, { ok: false });
  return (
    <Card className="p-4 mb-6 border-indigo-100 bg-indigo-50/30">
      <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-indigo-500" />Travel Keyword Generator</h2>
      <p className="text-xs text-slate-500 mb-3">Tạo keyword tiếng Anh cho site tin tức/review/du lịch: destination, hotel review, itinerary, transport, food, comparison.</p>
      <form action={formAction} className="grid gap-3 lg:grid-cols-4">
        <input name="niche" defaultValue={defaultNiche ?? "Vietnam travel news and reviews"} className="h-9 rounded-lg border border-slate-300 px-3 text-sm lg:col-span-2" placeholder="Niche" />
        <input name="rootDomain" className="h-9 rounded-lg border border-slate-300 px-3 text-sm" placeholder="domain.com" />
        <input name="limit" type="number" min="10" max="200" defaultValue="80" className="h-9 rounded-lg border border-slate-300 px-3 text-sm" />
        <textarea name="destinations" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 text-sm lg:col-span-4" placeholder="Ha Long Bay, Da Nang, Hoi An, Sapa, Phu Quoc..." />
        <div className="lg:col-span-4 flex items-center gap-3">
          <Button type="submit" size="sm"><Sparkles className="h-3.5 w-3.5" />Generate & import keywords</Button>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          {state.ok && <p className="text-xs text-emerald-600">Đã tạo/import keyword. Tải lại trang để xem.</p>}
        </div>
      </form>
    </Card>
  );
}
