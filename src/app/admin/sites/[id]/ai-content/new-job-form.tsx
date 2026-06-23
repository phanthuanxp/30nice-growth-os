"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createAiContentJobAction, type AiContentResult } from "@/server/actions/ai-content";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      Tạo Content Job
    </Button>
  );
}

export function NewContentJobForm({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const action = createAiContentJobAction.bind(null, tenantId);
  const [state, formAction] = useActionState<AiContentResult, FormData>(action, { ok: false });

  if (state.ok && state.jobId) {
    router.push(`/admin/sites/${tenantId}/ai-content/${state.jobId}`);
  }

  return (
    <Card className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-slate-700">Tạo content mới</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <form action={formAction} className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-3">
          {state.error && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{state.error}</p>
          )}

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Tiêu đề bài *</label>
            <input
              name="title"
              required
              placeholder="VD: Dịch vụ thuê xe sân bay Nội Bài giá rẻ 2026"
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Từ khóa chính</label>
              <input
                name="targetKeyword"
                placeholder="thuê xe sân bay nội bài"
                className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Loại nội dung</label>
              <select name="contentType" defaultValue="BLOG_POST" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm bg-white">
                <option value="BLOG_POST">Bài blog</option>
                <option value="LANDING_PAGE">Landing page</option>
                <option value="SERVICE_PAGE">Trang Dịch vụ</option>
                <option value="FAQ_PAGE">FAQ</option>
                <option value="REVIEW_PAGE">Review</option>
                <option value="COMPARISON_PAGE">So sánh</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Độ dài (số từ)</label>
              <select name="targetLength" defaultValue="1000" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm bg-white">
                <option value="500">~500 từ (ngắn)</option>
                <option value="1000">~1000 từ (chuẩn)</option>
                <option value="1500">~1500 từ (dài)</option>
                <option value="2000">~2000 từ (rất dài)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Ngôn ngữ</label>
              <select name="language" defaultValue="vi" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm bg-white">
                <option value="vi">Tiếng Việt</option>
                <option value="en">Tiếng Anh</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Từ khóa phụ (mỗi dòng hoặc cách nhau dấu phẩy)</label>
            <textarea
              name="keywords"
              rows={2}
              placeholder="xe đưa đón sân bay, giá xe sân bay, taxi sân bay nội bài..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex gap-2">
            <SubmitButton />
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Huỷ</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
