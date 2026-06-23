"use client";

import { useActionState } from "react";
import { Globe, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createContentSourceAction, importSourceUrlsAction } from "@/server/actions/content-sources";

type TenantOption = { id: string; name: string };
type SourceOption = { id: string; name: string; baseUrl: string };

export function ContentSourceForms({ tenants, sources }: { tenants: TenantOption[]; sources: SourceOption[] }) {
  const [sourceState, sourceAction] = useActionState(createContentSourceAction, { ok: false });
  const [urlState, urlAction] = useActionState(importSourceUrlsAction, { ok: false });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-4 w-4 text-indigo-500" />Add Content Source</CardTitle></CardHeader>
        <CardContent>
          <form action={sourceAction} className="space-y-3">
            <input name="name" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" placeholder="Source name, e.g. Vietnam Travel Guide" />
            <input name="baseUrl" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" placeholder="https://example.com or sitemap/rss URL" />
            <div className="grid grid-cols-2 gap-3">
              <select name="sourceType" className="h-10 rounded-lg border border-slate-300 px-3 text-sm" defaultValue="WEBSITE"><option value="WEBSITE">Website</option><option value="SITEMAP">Sitemap</option><option value="RSS">RSS</option><option value="MANUAL_URL_LIST">Manual URL list</option></select>
              <select name="tenantId" className="h-10 rounded-lg border border-slate-300 px-3 text-sm"><option value="">Global source</option>{tenants.map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input name="language" defaultValue="en" className="h-10 rounded-lg border border-slate-300 px-3 text-sm" />
              <input name="niche" className="h-10 rounded-lg border border-slate-300 px-3 text-sm" placeholder="Vietnam travel / hotels / tours" />
            </div>
            <Button type="submit" size="sm">Save source</Button>
            {sourceState.error && <p className="text-xs text-red-600">{sourceState.error}</p>}
            {sourceState.ok && <p className="text-xs text-emerald-600">Source saved.</p>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-4 w-4 text-indigo-500" />Import Article URLs</CardTitle></CardHeader>
        <CardContent>
          <form action={urlAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select name="sourceId" className="h-10 rounded-lg border border-slate-300 px-3 text-sm"><option value="">No source</option>{sources.map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <select name="tenantId" className="h-10 rounded-lg border border-slate-300 px-3 text-sm"><option value="">No target site yet</option>{tenants.map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
            </div>
            <input name="targetKeyword" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" placeholder="Optional target keyword / cluster" />
            <textarea name="urls" rows={7} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="One article URL per line" />
            <Button type="submit" size="sm">Import URLs to crawl queue</Button>
            {urlState.error && <p className="text-xs text-red-600">{urlState.error}</p>}
            {urlState.ok && <p className="text-xs text-emerald-600">URLs imported as Source Articles.</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
