"use client";

import { useState, useTransition } from "react";
import {
  Sparkles, Loader2, CheckCircle2, XCircle, ArrowRight,
  Plus, Trash2, FileCode, Save, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  aiFillSeoMeta, addRedirectAction, deleteRedirectAction, saveRobotsAction,
  type MissingMetaItem, type RedirectRule,
} from "@/server/actions/seo";

// ===== Batch AI SEO =====

type ItemState = "idle" | "running" | "done" | "error";

export function BatchSeoClient({ tenantId, items }: { tenantId: string; items: MissingMetaItem[] }) {
  const [states, setStates] = useState<Record<string, ItemState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);

  const runOne = async (item: MissingMetaItem) => {
    setStates((s) => ({ ...s, [item.id]: "running" }));
    const res = await aiFillSeoMeta(tenantId, { id: item.id, resource: item.resource });
    if (res.error) {
      setStates((s) => ({ ...s, [item.id]: "error" }));
      setErrors((e) => ({ ...e, [item.id]: res.error! }));
    } else {
      setStates((s) => ({ ...s, [item.id]: "done" }));
    }
    return !res.error;
  };

  const runAll = async () => {
    setRunning(true);
    // Sequential to avoid AI rate limits
    for (const item of items) {
      if (states[item.id] === "done") continue;
      const ok = await runOne(item);
      if (!ok && errors[item.id]?.includes("provider")) break;
    }
    setRunning(false);
  };

  const pendingCount = items.filter((i) => states[i.id] !== "done").length;

  if (items.length === 0) {
    return (
      <Card className="p-8 flex flex-col items-center text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
        <p className="text-sm font-medium text-slate-700">Tất cả pages và bài viết đã có SEO Title + Meta Description.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-indigo-500" />
          Batch AI SEO — {pendingCount} mục thiếu meta
        </CardTitle>
        <Button onClick={runAll} disabled={running || pendingCount === 0}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {running ? "Đang chạy..." : "Auto-fill tất cả"}
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {items.map((item) => {
            const state = states[item.id] ?? "idle";
            return (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                <div className="shrink-0">
                  {state === "running" && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
                  {state === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {state === "error" && <XCircle className="h-4 w-4 text-red-500" />}
                  {state === "idle" && <Sparkles className="h-4 w-4 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-800 truncate">{item.title}</span>
                    <Badge variant={item.resource === "page" ? "info" : "default"} className="text-[10px]">
                      {item.resource === "page" ? "Page" : "Bài viết"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {state === "error"
                      ? errors[item.id]
                      : [item.missingTitle && "Thiếu SEO Title", item.missingDescription && "Thiếu Meta Description"]
                          .filter(Boolean)
                          .join(" · ")}
                  </p>
                </div>
                {state !== "done" && (
                  <Button size="sm" variant="outline" disabled={running || state === "running"} onClick={() => runOne(item)}>
                    <Sparkles className="h-3.5 w-3.5" />
                    AI fill
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Redirect Manager =====

export function RedirectsClient({ tenantId, rules }: { tenantId: string; rules: RedirectRule[] }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<"301" | "302">("301");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const add = () =>
    startTransition(async () => {
      setError(null);
      const res = await addRedirectAction(tenantId, { from, to, type });
      if (res.error) setError(res.error);
      else {
        setFrom("");
        setTo("");
      }
    });

  const remove = (f: string) =>
    startTransition(async () => {
      await deleteRedirectAction(tenantId, f);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-indigo-500" />
          Redirect Manager (301/302)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-2 mb-1">
          <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/duong-dan-cu" className="h-9 text-sm flex-1" />
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="/duong-dan-moi hoặc URL đầy đủ" className="h-9 text-sm flex-1" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "301" | "302")}
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
          >
            <option value="301">301 — Vĩnh viễn</option>
            <option value="302">302 — Tạm thời</option>
          </select>
          <Button onClick={add} disabled={pending || !from || !to}>
            <Plus className="h-4 w-4" />
            Thêm
          </Button>
        </div>
        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

        {rules.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            Chưa có redirect nào. Dùng khi đổi slug để giữ thứ hạng SEO của URL cũ.
          </p>
        ) : (
          <div className="mt-3 space-y-1.5">
            {rules.map((r) => (
              <div key={r.from} className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 ${pending ? "opacity-60" : ""}`}>
                <code className="text-xs text-slate-700 truncate flex-1">{r.from}</code>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                <code className="text-xs text-slate-700 truncate flex-1">{r.to}</code>
                <Badge variant={r.type === "301" ? "success" : "warning"} className="text-[10px] shrink-0">{r.type}</Badge>
                <Button size="icon" variant="ghost" onClick={() => remove(r.from)} aria-label="Xóa redirect">
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== robots.txt Editor =====

const ROBOTS_PLACEHOLDER = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /login`;

export function RobotsClient({ tenantId, initial }: { tenantId: string; initial: string }) {
  const [content, setContent] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () =>
    startTransition(async () => {
      setError(null);
      setSaved(false);
      const res = await saveRobotsAction(tenantId, content);
      if (res.error) setError(res.error);
      else setSaved(true);
    });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-indigo-500" />
          robots.txt
        </CardTitle>
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu
        </Button>
      </CardHeader>
      <CardContent>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={ROBOTS_PLACEHOLDER}
          rows={7}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <p className="text-[11px] text-slate-400 mt-2">
          Để trống = dùng mặc định. Dòng <code className="bg-slate-100 px-1 rounded">Sitemap:</code> được tự động thêm — không cần khai báo.
        </p>
        {saved && <p className="text-xs text-emerald-600 mt-1">Đã lưu — robots.txt cập nhật ngay lập tức.</p>}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </CardContent>
    </Card>
  );
}
