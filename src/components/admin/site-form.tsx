"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SiteFormState } from "@/server/actions/sites";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Lưu thay đổi
    </Button>
  );
}

interface SiteFormProps {
  action: (prev: SiteFormState, formData: FormData) => Promise<SiteFormState>;
  initialData?: {
    name?: string | null;
    slug?: string | null;
    primaryDomain?: string | null;
    businessName?: string | null;
    businessPhone?: string | null;
    businessEmail?: string | null;
    businessAddress?: string | null;
    defaultSeoTitle?: string | null;
    defaultSeoDescription?: string | null;
    brandPrimary?: string | null;
    brandSecondary?: string | null;
    status?: string;
  };
  isNew?: boolean;
}

export function SiteForm({ action, initialData = {}, isNew }: SiteFormProps) {
  const [state, formAction] = useActionState(action, {});
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.push("/admin/sites");
  }, [state.success, router]);

  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Tên site *"
          name="name"
          defaultValue={initialData.name ?? ""}
          error={fe.name?.[0]}
          placeholder="Taxi Bắc Ninh"
          required
        />
        <Input
          label="Slug *"
          name="slug"
          defaultValue={initialData.slug ?? ""}
          error={fe.slug?.[0]}
          placeholder="taxibacninh"
          disabled={!isNew}
          required
        />
      </div>

      <Input
        label="Domain chính"
        name="primaryDomain"
        defaultValue={initialData.primaryDomain ?? ""}
        error={fe.primaryDomain?.[0]}
        placeholder="taxibacninh.vn"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Tên doanh nghiệp"
          name="businessName"
          defaultValue={initialData.businessName ?? ""}
          placeholder="Công ty TNHH..."
        />
        <Input
          label="Số điện thoại"
          name="businessPhone"
          defaultValue={initialData.businessPhone ?? ""}
          placeholder="1900 xxxx"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email liên hệ"
          name="businessEmail"
          type="email"
          defaultValue={initialData.businessEmail ?? ""}
          error={fe.businessEmail?.[0]}
          placeholder="hello@example.com"
        />
        <Input
          label="Địa chỉ"
          name="businessAddress"
          defaultValue={initialData.businessAddress ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="SEO Title mặc định"
          name="defaultSeoTitle"
          defaultValue={initialData.defaultSeoTitle ?? ""}
        />
        <Input
          label="Màu chính (hex)"
          name="brandPrimary"
          defaultValue={initialData.brandPrimary ?? ""}
          placeholder="#4f46e5"
        />
      </div>

      <Select
        label="Trạng thái"
        name="status"
        defaultValue={initialData.status ?? "ACTIVE"}
        options={[
          { value: "ACTIVE", label: "Hoạt động" },
          { value: "PAUSED", label: "Tạm dừng" },
          { value: "ARCHIVED", label: "Lưu trữ" },
        ]}
      />

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton />
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/sites")}
        >
          Hủy
        </Button>
      </div>
    </form>
  );
}
