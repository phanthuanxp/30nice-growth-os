"use client";

import { useState, useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Globe, Plus, ChevronDown, ChevronUp, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSiteFromClusterAction, type FactoryResult } from "@/server/actions/site-factory";

interface ClusterInfo {
  id: string;
  name: string;
  headKeyword: string | null;
  totalVolume: number;
  suggestedSlug: string | null;
  suggestedDomain: string | null;
  memberCount: number;
  topKeywords: string[];
  projectName: string;
  projectId: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      <Globe className="h-3.5 w-3.5" />
      Tạo site
    </Button>
  );
}

export function SiteFactoryCluster({ cluster }: { cluster: ClusterInfo }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const action = createSiteFromClusterAction.bind(null, cluster.id);
  const [state, formAction] = useActionState<FactoryResult, FormData>(action, { ok: false });

  if (state.ok && state.tenantId) {
    router.push(`/admin/sites/${state.tenantId}`);
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-4 w-4 text-indigo-500 shrink-0" />
            <h3 className="font-semibold text-slate-800 truncate">{cluster.name}</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            {cluster.headKeyword && <span>Pillar: {cluster.headKeyword}</span>}
            {cluster.totalVolume > 0 && <span>Vol: {cluster.totalVolume.toLocaleString()}</span>}
            <span>{cluster.memberCount} từ khóa</span>
            <span className="text-indigo-500">• {cluster.projectName}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {cluster.topKeywords.slice(0, 4).map((kw) => (
              <span key={kw} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                {kw}
              </span>
            ))}
          </div>
        </div>

        <Button
          size="sm"
          variant={open ? "outline" : "default"}
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Đóng
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" /> Tạo site
            </>
          )}
        </Button>
      </div>

      {open && (
        <form action={formAction} className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {state.error && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{state.error}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Tên site *
              </label>
              <input
                name="name"
                required
                defaultValue={cluster.name}
                className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Slug (URL)
              </label>
              <input
                name="slug"
                defaultValue={cluster.suggestedSlug ?? ""}
                placeholder="auto-generate"
                className="h-8 w-full rounded border border-slate-300 px-2 text-sm font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Domain
              </label>
              <input
                name="domain"
                defaultValue={cluster.suggestedDomain ?? ""}
                placeholder="slug.30nice.vn (auto)"
                className="h-8 w-full rounded border border-slate-300 px-2 text-sm font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 block mb-1">SEO Title</label>
              <input
                name="seoTitle"
                defaultValue={cluster.headKeyword ?? cluster.name}
                className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 block mb-1">SEO Description</label>
              <input
                name="seoDesc"
                placeholder="Mô tả ngắn cho site..."
                className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <SubmitButton />
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
