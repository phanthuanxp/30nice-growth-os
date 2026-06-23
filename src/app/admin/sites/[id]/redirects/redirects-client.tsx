"use client";

import { useState, useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2, ToggleLeft, ToggleRight, ArrowRight, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createRedirectAction,
  updateRedirectAction,
  deleteRedirectAction,
  toggleRedirectAction,
  type ActionResult,
} from "@/server/actions/redirects";

interface RedirectRow {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  active: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      {label}
    </Button>
  );
}

function AddForm({ tenantId }: { tenantId: string }) {
  const action = createRedirectAction.bind(null, tenantId);
  const [state, formAction] = useActionState<ActionResult, FormData>(action, { ok: false });
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Thêm redirect
      </Button>
    );
  }

  return (
    <Card className="p-4 mb-4">
      <form action={(fd) => { formAction(fd); setOpen(false); }} className="space-y-3">
        {state.error && (
          <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{state.error}</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">From Path *</label>
            <input
              name="fromPath"
              required
              placeholder="/old-url"
              className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">To Path / URL *</label>
            <input
              name="toPath"
              required
              placeholder="/new-url hoặc https://..."
              className="h-8 w-full rounded border border-slate-300 px-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Status Code</label>
            <select name="statusCode" defaultValue="301" className="h-8 w-full rounded border border-slate-300 px-2 text-sm bg-white">
              <option value="301">301 — Permanent</option>
              <option value="302">302 — Temporary</option>
              <option value="307">307 — Temporary (method preserved)</option>
              <option value="308">308 — Permanent (method preserved)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Ghi chú</label>
            <input name="note" placeholder="Lý do redirect..." className="h-8 w-full rounded border border-slate-300 px-2 text-sm" />
          </div>
        </div>
        <div className="flex gap-2">
          <SubmitButton label="Lưu redirect" />
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Huỷ
          </Button>
        </div>
      </form>
    </Card>
  );
}

function RedirectRowItem({
  r,
  tenantId,
}: {
  r: RedirectRow;
  tenantId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [toggling, startToggle] = useTransition();
  const [deleting, startDelete] = useTransition();

  const updateAction = updateRedirectAction.bind(null, r.id, tenantId);
  const [editState, editFormAction] = useActionState<ActionResult, FormData>(updateAction, { ok: false });

  const handleToggle = () => {
    startToggle(async () => {
      await toggleRedirectAction(r.id, tenantId, !r.active);
    });
  };

  const handleDelete = () => {
    if (!window.confirm("Xóa redirect này?")) return;
    startDelete(async () => {
      await deleteRedirectAction(r.id, tenantId);
    });
  };

  if (editing) {
    return (
      <tr className="bg-indigo-50">
        <td colSpan={5} className="p-3">
          <form action={(fd) => { editFormAction(fd); setEditing(false); }} className="grid grid-cols-4 gap-2 items-end">
            {editState.error && (
              <p className="col-span-4 text-xs text-red-600">{editState.error}</p>
            )}
            <input name="fromPath" defaultValue={r.fromPath} className="h-8 rounded border border-slate-300 px-2 text-sm" />
            <input name="toPath" defaultValue={r.toPath} className="h-8 rounded border border-slate-300 px-2 text-sm" />
            <select name="statusCode" defaultValue={r.statusCode} className="h-8 rounded border border-slate-300 px-2 text-sm bg-white">
              <option value="301">301</option>
              <option value="302">302</option>
              <option value="307">307</option>
              <option value="308">308</option>
            </select>
            <input name="note" defaultValue={r.note ?? ""} placeholder="Ghi chú" className="h-8 rounded border border-slate-300 px-2 text-sm" />
            <div className="col-span-4 flex gap-2">
              <SubmitButton label="Lưu" />
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>Huỷ</Button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="py-3 px-4">
        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{r.fromPath}</code>
      </td>
      <td className="py-3 px-2 text-slate-400">
        <ArrowRight className="h-3.5 w-3.5" />
      </td>
      <td className="py-3 px-2">
        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700">{r.toPath}</code>
      </td>
      <td className="py-3 px-2">
        <Badge variant={r.active ? "success" : "neutral"}>
          {r.statusCode} {r.active ? "active" : "off"}
        </Badge>
      </td>
      <td className="py-3 px-2 text-slate-400 text-xs">{r.note}</td>
      <td className="py-3 px-2">
        <div className="flex gap-1 justify-end">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            title={r.active ? "Tắt redirect" : "Bật redirect"}
          >
            {r.active ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function RedirectsClient({
  tenantId,
  initialRedirects,
}: {
  tenantId: string;
  initialRedirects: RedirectRow[];
}) {
  return (
    <div>
      <div className="mb-4">
        <AddForm tenantId={tenantId} />
      </div>

      {initialRedirects.length === 0 ? (
        <Card className="p-8 text-center">
          <ArrowRight className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">Chưa có redirect nào</p>
          <p className="text-xs text-slate-400 mt-1">
            Thêm redirect để chuyển hướng URL cũ sang URL mới, bảo toàn SEO.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">{initialRedirects.length} redirect rules</p>
            <p className="text-xs text-slate-400">
              {initialRedirects.filter((r) => r.active).length} đang hoạt động
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-500">From</th>
                <th className="px-2" />
                <th className="text-left px-2 py-2.5 text-xs font-medium text-slate-500">To</th>
                <th className="text-left px-2 py-2.5 text-xs font-medium text-slate-500">Status</th>
                <th className="text-left px-2 py-2.5 text-xs font-medium text-slate-500">Ghi chú</th>
                <th className="px-2" />
              </tr>
            </thead>
            <tbody>
              {initialRedirects.map((r) => (
                <RedirectRowItem key={r.id} r={r} tenantId={tenantId} />
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <p className="text-xs text-slate-400 mt-3">
        Redirect được áp dụng ngay khi request đến server — không cần deploy lại.
      </p>
    </div>
  );
}
