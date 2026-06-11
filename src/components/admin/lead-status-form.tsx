"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateLeadAction, type LeadActionState } from "@/server/actions/leads";

const STATUS_OPTIONS = [
  { value: "NEW", label: "Mới" },
  { value: "CONTACTED", label: "Đã liên hệ" },
  { value: "QUALIFIED", label: "Tiềm năng" },
  { value: "LOST", label: "Thất bại" },
  { value: "WON", label: "Chốt được" },
];

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-7 px-2.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
    >
      {pending ? "..." : "Lưu"}
    </button>
  );
}

export function LeadStatusForm({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: string;
}) {
  const action = updateLeadAction.bind(null, leadId);
  const [state, formAction] = useActionState<LeadActionState, FormData>(action, {});

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <select
        name="status"
        defaultValue={currentStatus}
        className="h-7 rounded-md border border-slate-300 bg-white pl-2 pr-6 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <SubmitBtn />
      {state.error && (
        <span className="text-xs text-red-500">{state.error}</span>
      )}
    </form>
  );
}
