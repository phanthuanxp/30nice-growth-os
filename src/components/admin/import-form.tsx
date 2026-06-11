"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { runWordPressImportAction, type ImportFormState } from "@/server/actions/import";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Đang nhập dữ liệu..." : "Bắt đầu nhập"}
    </Button>
  );
}

export function ImportForm({ tenants }: { tenants: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState<ImportFormState, FormData>(
    runWordPressImportAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state.result && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm space-y-1">
          <p className="font-semibold text-emerald-800">Kết quả nhập dữ liệu</p>
          <p className="text-emerald-700">
            Trang: <strong>{state.result.pages.imported}</strong> nhập ·{" "}
            {state.result.pages.skipped} bỏ qua
          </p>
          <p className="text-emerald-700">
            Bài viết: <strong>{state.result.posts.imported}</strong> nhập ·{" "}
            {state.result.posts.skipped} bỏ qua
          </p>
          {[...state.result.pages.errors, ...state.result.posts.errors].length > 0 && (
            <div className="mt-2 text-amber-700 text-xs">
              {[...state.result.pages.errors, ...state.result.posts.errors]
                .slice(0, 5)
                .map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
        </div>
      )}

      <Select
        label="Site đích *"
        name="tenantId"
        options={[
          { value: "", label: "-- Chọn site để nhập vào --" },
          ...tenants.map((t) => ({ value: t.id, label: t.name })),
        ]}
      />

      <Input
        label="WordPress URL *"
        name="wpBaseUrl"
        type="url"
        placeholder="https://cms.30nice.vn"
        required
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Nội dung cần nhập</p>
        <div className="flex flex-col gap-2">
          {[
            { name: "importPages", label: "Trang (Pages)" },
            { name: "importPosts", label: "Bài viết (Posts) + Danh mục" },
          ].map((opt) => (
            <label key={opt.name} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name={opt.name}
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
              />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
        <strong>Lưu ý:</strong> Dữ liệu trùng slug sẽ được cập nhật (upsert). WordPress API cần cho phép truy cập công khai ({" "}
        <code>/wp-json/wp/v2/posts</code>).
      </div>

      <SubmitBtn />
    </form>
  );
}
