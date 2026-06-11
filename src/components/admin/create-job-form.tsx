"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createJobAction, type JobFormState } from "@/server/actions/automation";

const JOB_TYPE_OPTIONS = [
  { value: "seo_check", label: "Kiểm tra SEO" },
  { value: "auto_publish", label: "Tự động đăng bài lên lịch" },
  { value: "lead_notify", label: "Thông báo lead mới (webhook)" },
  { value: "wp_import", label: "Nhập từ WordPress" },
];

function SubmitBtn() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="sm" loading={pending}>Tạo tác vụ</Button>;
}

export function CreateJobForm({ tenants }: { tenants: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState<JobFormState, FormData>(createJobAction, {});
  const [jobType, setJobType] = useState("seo_check");
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Site"
          name="tenantId"
          options={[
            { value: "", label: "-- Chọn site --" },
            ...tenants.map((t) => ({ value: t.id, label: t.name })),
          ]}
        />
        <Select
          label="Loại tác vụ"
          name="type"
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
          options={JOB_TYPE_OPTIONS}
        />
      </div>

      {jobType === "lead_notify" && (
        <Input
          label="Webhook URL"
          name="webhookUrl"
          placeholder="https://hooks.zapier.com/..."
          type="url"
        />
      )}

      {jobType === "wp_import" && (
        <Input
          label="WordPress URL"
          name="wpBaseUrl"
          placeholder="https://cms.30nice.vn"
          type="url"
        />
      )}

      <SubmitBtn />
    </form>
  );
}
