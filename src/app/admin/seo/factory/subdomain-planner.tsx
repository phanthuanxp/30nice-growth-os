"use client";

import { useActionState, useMemo, useState } from "react";
import { Globe, Sparkles, MapPin, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { generateSubdomainSuggestions } from "@/lib/subdomain-factory";
import { generateSubdomainPlansAction } from "@/server/actions/subdomain-plans";

const SAMPLE_KEYWORDS = `halong bay travel guide
best cruises in ha long bay
da nang beach hotels
hoi an old town guide
sapa trekking itinerary
phu quoc island review
hanoi airport transfer guide`;

export function SubdomainPlanner() {
  const [rootDomain, setRootDomain] = useState("domain.com");
  const [keywords, setKeywords] = useState(SAMPLE_KEYWORDS);
  const [topics, setTopics] = useState("Vietnam travel, tourist destinations, hotel reviews, airport guides, itineraries");

  const suggestions = useMemo(() => generateSubdomainSuggestions({ rootDomain, keywords, topics }), [rootDomain, keywords, topics]);
  const [state, formAction] = useActionState(generateSubdomainPlansAction, { ok: false });

  return (
    <form action={formAction}>
    <Card className="mb-6 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/40">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-600" />Subdomain Factory Planner</CardTitle>
            <p className="mt-1 text-sm text-slate-500">Nhập domain gốc + keyword/location/topic để tạo danh sách subdomain dạng <code>halongbay.domain.com</code>, kèm intent và content plan.</p>
          </div>
          <Badge variant="info">AI-ready foundation</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Root domain</span><input name="rootDomain" value={rootDomain} onChange={(e) => setRootDomain(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-mono" placeholder="domain.com" /></label>
          <label className="space-y-1 lg:col-span-2"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Topics / niche hints</span><input name="topics" value={topics} onChange={(e) => setTopics(e.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" placeholder="Vietnam travel, destination guides, hotel reviews..." /></label>
        </div>
        <input type="hidden" name="niche" value={topics} />
        <label className="block space-y-1"><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seed keywords / locations</span><textarea name="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} rows={6} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="One keyword/location per line" /></label>
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-slate-500">Preview locally, then save suggestions to DB for approve/create-site workflow.</p>{state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}{state.ok && <p className="mt-1 text-xs text-emerald-600">Saved suggestions to Subdomain Plans.</p>}</div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setKeywords(SAMPLE_KEYWORDS)}>Reset sample</Button><Button type="submit">Save plans</Button></div></div>
        <div className="grid gap-3 xl:grid-cols-2">
          {suggestions.slice(0, 8).map((item) => (
            <div key={item.domain} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><p className="flex items-center gap-2 font-semibold text-slate-900"><Globe className="h-4 w-4 text-indigo-500" />{item.domain}</p><p className="mt-1 text-xs text-slate-500">Keyword: {item.keyword}</p></div><Badge variant={item.score >= 80 ? "success" : "warning"}>{item.score}/100</Badge></div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-600"><MapPin className="h-3 w-3" />{item.intent}</span><span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-600">{item.subdomain}</span></div>
              <p className="mt-3 text-xs text-slate-500">{item.rationale}</p>
              <div className="mt-3 rounded-lg bg-slate-50 p-3"><p className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-600"><FileText className="h-3 w-3" />Starter content plan</p><ul className="space-y-1 text-xs text-slate-500">{item.contentPlan.slice(0, 4).map((title) => <li key={title}>• {title}</li>)}</ul></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    </form>
  );
}
