"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { importKeywordsAction, type ActionResult } from "@/server/actions/keyword-projects";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      Import
    </Button>
  );
}

export function KeywordImportForm({ projectId }: { projectId: string }) {
  const action = importKeywordsAction.bind(null, projectId);
  const [state, formAction] = useActionState<ActionResult, FormData>(action, { ok: false });
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={formAction} className="space-y-2">
      {state.error && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{state.error}</p>
      )}
      {state.ok && (
        <p className="text-xs text-emerald-600 bg-emerald-50 rounded px-2 py-1">Import thành công!</p>
      )}
      <textarea
        name="keywords"
        rows={5}
        required
        placeholder={"Nhập từ khóa, mỗi dòng 1 từ hoặc phân cách bằng dấu phẩy.\n\nVD:\nthuê xe sân bay nội bài\nxe đưa đón sân bay hà nội\ntaxi sân bay nội bài giá rẻ"}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-y font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <p className="text-xs text-slate-400">Tối đa 1.000 từ khóa mỗi lần. Từ khóa trùng sẽ tự merge.</p>
      <SubmitButton />
    </form>
  );
}
