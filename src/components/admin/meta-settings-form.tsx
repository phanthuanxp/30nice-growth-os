"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";
import { saveMetaSettingsAction, type MetaSettingsActionState } from "@/server/actions/meta-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: MetaSettingsActionState = {};

export function MetaSettingsForm({ defaults }: { defaults: { appId: string; redirectUri: string; graphVersion: string; hasAppSecret: boolean; hasTokenKey: boolean; hasWebhookToken: boolean } }) {
  const [state, action, pending] = useActionState(saveMetaSettingsAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <Input name="appId" label="Meta App ID" defaultValue={defaults.appId} required placeholder="1234567890" />
      <Input name="appSecret" label="Meta App Secret" type="password" required={!defaults.hasAppSecret} placeholder={defaults.hasAppSecret ? "Đã lưu — để trống để giữ nguyên" : "Nhập App Secret"} />
      <Input name="tokenEncryptionKey" label="Token Encryption Key" type="password" required={!defaults.hasTokenKey} placeholder={defaults.hasTokenKey ? "Đã lưu — để trống để giữ nguyên" : "Tối thiểu 32 ký tự, dùng để mã hóa Page token"} />
      <Input name="webhookVerifyToken" label="Webhook Verify Token" type="password" placeholder={defaults.hasWebhookToken ? "Đã lưu — để trống để giữ nguyên" : "Tùy chọn nhưng nên cấu hình"} />
      <Input name="redirectUri" label="OAuth Callback URL" defaultValue={defaults.redirectUri} required />
      <Input name="graphVersion" label="Meta Graph API Version" defaultValue={defaults.graphVersion || "v26.0"} required />
      <Button type="submit" loading={pending} className="w-full"><ShieldCheck className="h-4 w-4" /> Lưu cấu hình Meta</Button>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm font-medium text-emerald-600">Đã lưu. Page Factory có thể kết nối Facebook Page.</p>}
    </form>
  );
}
