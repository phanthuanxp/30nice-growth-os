"use client";

import { useState, useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { MessageSquare, Activity, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { updateLeadAction, addLeadNoteAction } from "@/server/actions/leads";
import type { LeadStatus } from "@prisma/client";

const STATUS_OPTIONS: { value: LeadStatus; label: string; color: string }[] = [
  { value: "NEW", label: "Mới", color: "bg-sky-500" },
  { value: "CONTACTED", label: "Đã liên hệ", color: "bg-amber-500" },
  { value: "QUALIFIED", label: "Tiềm năng", color: "bg-indigo-500" },
  { value: "WON", label: "Chốt được", color: "bg-emerald-500" },
  { value: "LOST", label: "Thất bại", color: "bg-red-500" },
];

const STATUS_VARIANT: Record<string, "info" | "warning" | "default" | "success" | "danger" | "neutral"> = {
  NEW: "info",
  CONTACTED: "warning",
  QUALIFIED: "default",
  WON: "success",
  LOST: "danger",
};

interface Note { id: string; body: string; createdAt: string; }
interface ActivityItem { id: string; type: string; title: string; detail: string | null; createdAt: string; }
interface StatusEntry { id: string; fromStatus: string | null; toStatus: string; note: string | null; createdAt: string; }

interface Props {
  leadId: string;
  tenantId: string;
  currentStatus: LeadStatus;
  notes: Note[];
  activities: ActivityItem[];
  statusHistory: StatusEntry[];
}

function NoteSubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="sm" loading={pending}>Lưu note</Button>;
}

export function LeadDetailClient({ leadId, tenantId, currentStatus, notes, activities, statusHistory }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [statusPending, startStatusTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<"notes" | "activity" | "history">("notes");

  const updateAction = updateLeadAction.bind(null, leadId);
  const [noteState, noteFormAction] = useActionState<{ success?: boolean; error?: string }, FormData>(
    async (_prev, fd) => {
      const body = fd.get("body")?.toString().trim() ?? "";
      return addLeadNoteAction(tenantId, leadId, body);
    },
    {},
  );

  const handleStatusChange = (newStatus: LeadStatus) => {
    startStatusTransition(async () => {
      const fd = new FormData();
      fd.append("status", newStatus);
      const res = await updateAction({}, fd);
      if (res.success) {
        setStatus(newStatus);
        setStatusMsg("Đã cập nhật trạng thái");
        setTimeout(() => setStatusMsg(null), 2000);
      } else {
        setStatusMsg(res.error ?? "Lỗi");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Status picker */}
      <Card className="p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Trạng thái</h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStatusChange(s.value)}
              disabled={statusPending || status === s.value}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border-2 ${
                status === s.value
                  ? `${s.color} text-white border-transparent`
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        {statusMsg && (
          <p className={`text-xs mt-2 flex items-center gap-1 ${statusMsg.includes("Lỗi") ? "text-red-500" : "text-emerald-600"}`}>
            <CheckCircle className="h-3 w-3" /> {statusMsg}
          </p>
        )}
      </Card>

      {/* Add note */}
      <Card className="p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Thêm ghi chú</h3>
        <form action={noteFormAction} className="space-y-2">
          {noteState.error && (
            <p className="text-xs text-red-600">{noteState.error}</p>
          )}
          {noteState.success && (
            <p className="text-xs text-emerald-600">Đã thêm ghi chú!</p>
          )}
          <textarea
            name="body"
            rows={3}
            required
            placeholder="Ghi chú cuộc gọi, kết quả liên hệ, thông tin thêm..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <NoteSubmitButton />
        </form>
      </Card>

      {/* Timeline tabs */}
      <Card className="overflow-hidden">
        <div className="flex border-b border-slate-100">
          {(["notes", "activity", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-semibold transition-colors ${
                tab === t
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "notes" ? `Ghi chú (${notes.length})` : t === "activity" ? `Hoạt động (${activities.length})` : `Lịch sử (${statusHistory.length})`}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
          {tab === "notes" && (
            notes.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Chưa có ghi chú nào</p>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="h-3 w-3 text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">{n.body}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(n.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))
            )
          )}

          {tab === "activity" && (
            activities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Chưa có hoạt động nào</p>
            ) : (
              activities.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="h-3 w-3 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{a.title}</p>
                    {a.detail && <p className="text-xs text-slate-500">{a.detail}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(a.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))
            )
          )}

          {tab === "history" && (
            statusHistory.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Chưa có lịch sử trạng thái</p>
            ) : (
              statusHistory.map((s) => (
                <div key={s.id} className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="h-3 w-3 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      {s.fromStatus && (
                        <>
                          <Badge variant={STATUS_VARIANT[s.fromStatus] ?? "neutral"}>{s.fromStatus}</Badge>
                          <span className="text-slate-400">→</span>
                        </>
                      )}
                      <Badge variant={STATUS_VARIANT[s.toStatus] ?? "neutral"}>{s.toStatus}</Badge>
                    </div>
                    {s.note && <p className="text-xs text-slate-500 mt-0.5">{s.note}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(s.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </Card>
    </div>
  );
}
