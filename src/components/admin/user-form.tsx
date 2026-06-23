"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { UserActionState } from "@/server/actions/users";

const ROLE_OPTIONS = [
  { value: "VIEWER", label: "Viewer" },
  { value: "EDITOR", label: "Editor" },
  { value: "TENANT_ADMIN", label: "Tenant Admin" },
  { value: "AGENCY_ADMIN", label: "Agency Admin" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

interface UserFormProps {
  action: (prev: UserActionState, formData: FormData) => Promise<UserActionState>;
  initialData?: {
    email?: string | null;
    name?: string | null;
    role?: string | null;
  };
  isNew?: boolean;
}

export function UserForm({ action, initialData = {}, isNew }: UserFormProps) {
  const [state, formAction] = useActionState(action, {});
  const router = useRouter();

  useEffect(() => {
    if (state.success && isNew) router.push("/admin/users");
  }, [state.success, isNew, router]);

  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && !isNew && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
          Đã lưu thay đổi.
        </div>
      )}

      <Input
        label="Email *"
        name="email"
        type="email"
        defaultValue={initialData.email ?? ""}
        error={fe.email?.[0]}
        placeholder="user@30nice.vn"
        disabled={!isNew}
        required={isNew}
        autoComplete="off"
      />

      <Input
        label="Tên hiển thị *"
        name="name"
        defaultValue={initialData.name ?? ""}
        error={fe.name?.[0]}
        placeholder="Nguyễn Văn A"
        required
      />

      <Select
        label="Role *"
        name="role"
        defaultValue={initialData.role ?? "VIEWER"}
        error={fe.role?.[0]}
        options={ROLE_OPTIONS}
      />

      <Input
        label={isNew ? "Mật khẩu * (tối thiểu 8 ký tự)" : "Mật khẩu mới (để trống = giữ nguyên)"}
        name="password"
        type="password"
        error={fe.password?.[0]}
        placeholder="••••••••"
        required={isNew}
        autoComplete="new-password"
      />

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <SubmitButton label={isNew ? "Tạo user" : "Lưu thay đổi"} />
      </div>
    </form>
  );
}
