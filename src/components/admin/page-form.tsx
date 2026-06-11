"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SeoPanel } from "@/components/admin/seo-panel";
import type { PageFormState } from "@/server/actions/pages";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Lưu
    </Button>
  );
}

interface Tenant { id: string; name: string }

interface PageFormProps {
  action: (prev: PageFormState, formData: FormData) => Promise<PageFormState>;
  tenants?: Tenant[];
  initialData?: {
    tenantId?: string | null;
    title?: string | null;
    slug?: string | null;
    status?: string;
    summary?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
  };
  isNew?: boolean;
  returnTo?: string;
}

export function PageForm({ action, tenants = [], initialData = {}, isNew, returnTo = "/admin/pages" }: PageFormProps) {
  const [state, formAction] = useActionState(action, {});
  const router = useRouter();
  const [title, setTitle] = useState(initialData.title ?? "");
  const [slug, setSlug] = useState(initialData.slug ?? "");
  const [summary, setSummary] = useState(initialData.summary ?? "");
  const [seoTitle, setSeoTitle] = useState(initialData.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialData.seoDescription ?? "");

  useEffect(() => {
    if (state.success) router.push(returnTo);
  }, [state.success, router, returnTo]);

  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {isNew && tenants.length > 0 && (
        <Select
          label="Site *"
          name="tenantId"
          defaultValue={initialData.tenantId ?? ""}
          options={[
            { value: "", label: "-- Chọn site --" },
            ...tenants.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />
      )}

      {!isNew && initialData.tenantId && (
        <input type="hidden" name="tenantId" value={initialData.tenantId} />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Tiêu đề *"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={fe.title?.[0]}
          placeholder="Trang chủ"
          required
        />
        <Input
          label="Slug (URL)"
          name="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          error={fe.slug?.[0]}
          placeholder="trang-chu (để trống cho homepage)"
        />
      </div>

      <Textarea
        label="Tóm tắt"
        name="summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Mô tả ngắn về trang này..."
        rows={3}
      />

      <Select
        label="Trạng thái"
        name="status"
        defaultValue={initialData.status ?? "DRAFT"}
        options={[
          { value: "DRAFT", label: "Nháp" },
          { value: "PUBLISHED", label: "Đã publish" },
          { value: "ARCHIVED", label: "Lưu trữ" },
        ]}
      />

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">SEO</p>
        <Input
          label={`SEO Title (${seoTitle.length}/60)`}
          name="seoTitle"
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
          error={fe.seoTitle?.[0]}
          placeholder="Tiêu đề SEO (tối đa 60 ký tự)"
        />
        <Input
          label={`SEO Description (${seoDescription.length}/155)`}
          name="seoDescription"
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          error={fe.seoDescription?.[0]}
          placeholder="Mô tả SEO (tối đa 155 ký tự)"
        />
        <SeoPanel
          title={title}
          slug={slug}
          content={summary}
          excerpt=""
          seoTitle={seoTitle}
          seoDescription={seoDescription}
          showExcerpt={false}
          onApply={(data) => {
            if (data.seoTitle !== undefined) setSeoTitle(data.seoTitle);
            if (data.seoDescription !== undefined) setSeoDescription(data.seoDescription);
          }}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton />
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(returnTo)}
        >
          Hủy
        </Button>
      </div>
    </form>
  );
}
