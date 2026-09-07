"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { BadgeCheck, Ban, CheckCircle2, PauseCircle, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  setSocialGroupModeAction,
  setSocialGroupStatusAction,
  updateSocialGroupAction,
  verifySocialGroupApiAccessAction,
  type SocialGroupResult,
} from "@/server/actions/social-groups";

const initialState: SocialGroupResult = { ok: false };

export interface EditableGroup {
  id: string;
  name: string;
  groupUrl: string;
  externalGroupId: string;
  topics: string;
  rules: string;
  dailyPostLimit: number;
  cooldownHours: number;
  allowLinks: boolean;
  allowPromotion: boolean;
  mode: "MANUAL_ONLY" | "API_ALLOWED" | "DISABLED";
  apiVerified: boolean;
}

function Feedback({ state }: { state: SocialGroupResult | null }) {
  if (!state) return null;
  if (state.error) return <p className="text-xs font-medium text-red-600">{state.error}</p>;
  if (state.ok) return <p className="text-xs font-medium text-emerald-600">Đã lưu.</p>;
  return null;
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
      {label}
    </label>
  );
}

export function SocialGroupEditor({ group }: { group: EditableGroup }) {
  const [state, action, pending] = useActionState(updateSocialGroupAction, initialState);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="groupId" value={group.id} />
      <Input name="name" label="Tên Group" defaultValue={group.name} required />
      <Input name="groupUrl" type="url" label="URL Group" defaultValue={group.groupUrl} placeholder="https://www.facebook.com/groups/..." />
      <Input name="externalGroupId" label="Facebook Group ID" defaultValue={group.externalGroupId} placeholder="Bắt buộc nếu muốn đăng qua API" />
      <Input name="topics" label="Chủ đề (phân tách bằng dấu phẩy)" defaultValue={group.topics} />
      <Textarea name="rules" label="Quy tắc của Group" defaultValue={group.rules} />
      <div className="grid grid-cols-2 gap-3">
        <Input name="dailyPostLimit" type="number" min={0} max={20} label="Tối đa bài/ngày" defaultValue={String(group.dailyPostLimit)} required />
        <Input name="cooldownHours" type="number" min={0} max={720} label="Giãn cách (giờ)" defaultValue={String(group.cooldownHours)} required />
      </div>
      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <Checkbox name="allowLinks" label="Cho phép chèn liên kết" defaultChecked={group.allowLinks} />
        <Checkbox name="allowPromotion" label="Cho phép nội dung chào bán" defaultChecked={group.allowPromotion} />
        <p className="text-[11px] text-slate-500">Bỏ chọn thì hệ thống tự gỡ phần vi phạm khỏi caption trước khi đưa vào hàng chờ.</p>
      </div>
      <Button type="submit" size="sm" loading={pending} className="w-full"><Save className="h-3.5 w-3.5" /> Lưu cấu hình Group</Button>
      <Feedback state={state} />
    </form>
  );
}

export function SocialGroupStatusActions({ groupId, status }: { groupId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (next: "APPROVED" | "PAUSED" | "REJECTED") => {
    setError(null);
    startTransition(async () => {
      try {
        await setSocialGroupStatusAction(groupId, next);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Không đổi được trạng thái");
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={pending || status === "APPROVED"} onClick={() => run("APPROVED")}>
          <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending || status === "PAUSED"} onClick={() => run("PAUSED")}>
          <PauseCircle className="h-3.5 w-3.5" /> Tạm dừng
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending || status === "REJECTED"} onClick={() => run("REJECTED")}>
          <Ban className="h-3.5 w-3.5" /> Từ chối
        </Button>
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function SocialGroupModeActions({ group }: { group: Pick<EditableGroup, "id" | "mode" | "apiVerified"> }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const changeMode = (mode: EditableGroup["mode"]) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await setSocialGroupModeAction(group.id, mode);
      } catch (cause) {
        setMessage({ ok: false, text: cause instanceof Error ? cause.message : "Không đổi được chế độ" });
      }
    });
  };

  const verify = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await verifySocialGroupApiAccessAction(group.id);
      setMessage({ ok: result.ok, text: result.ok ? "Đã xác minh quyền API với Group." : result.error ?? "Không xác minh được" });
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={pending || group.mode === "MANUAL_ONLY"} onClick={() => changeMode("MANUAL_ONLY")}>Thủ công</Button>
        <Button type="button" size="sm" variant="outline" disabled={pending || group.mode === "API_ALLOWED"} onClick={() => changeMode("API_ALLOWED")}>
          <BadgeCheck className="h-3.5 w-3.5" /> Bật API
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending || group.mode === "DISABLED"} onClick={() => changeMode("DISABLED")}>Tắt</Button>
        <Button type="button" size="sm" variant="outline" loading={pending} onClick={verify}>
          <ShieldCheck className="h-3.5 w-3.5" /> Xác minh quyền API
        </Button>
      </div>
      {!group.apiVerified && (
        <p className="text-[11px] text-amber-700">Chưa xác minh quyền API. Mọi bài vẫn đi theo luồng đăng thủ công.</p>
      )}
      {message && <p className={`text-xs font-medium ${message.ok ? "text-emerald-600" : "text-red-600"}`}>{message.text}</p>}
    </div>
  );
}
