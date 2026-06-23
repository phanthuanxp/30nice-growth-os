"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { createProjectAction, type ActionResult } from "@/server/actions/keyword-projects";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Tạo project
    </Button>
  );
}

export function KeywordProjectForm() {
  const [state, action] = useActionState<ActionResult, FormData>(createProjectAction, { ok: false });

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">
          Tên project <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          required
          placeholder="VD: Airport Transfer Keywords Q3 2026"
          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">Niche / Chủ đề</label>
        <input
          name="niche"
          placeholder="VD: airport-transfer, travel, review-hotel"
          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">Mô tả</label>
        <textarea
          name="description"
          rows={2}
          placeholder="Mục tiêu, ghi chú..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-1">Ngôn ngữ</label>
        <select
          name="language"
          defaultValue="vi"
          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="vi">Tiếng Việt (vi)</option>
          <option value="en">English (en)</option>
          <option value="ja">Japanese (ja)</option>
          <option value="ko">Korean (ko)</option>
          <option value="zh">Chinese (zh)</option>
        </select>
      </div>

      <SubmitButton />
    </form>
  );
}
