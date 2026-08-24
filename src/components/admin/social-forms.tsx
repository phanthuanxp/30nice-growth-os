"use client";

import { useActionState } from "react";
import { BriefcaseBusiness, CalendarPlus, Flag, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createSocialGroupAction,
  createSocialPageAction,
  createSocialPlanAction,
  createSocialWorkspaceAction,
  type SocialActionResult,
} from "@/server/actions/social";

const initialState: SocialActionResult = { ok: false };

function ResultMessage({ state }: { state: SocialActionResult }) {
  if (state.error) return <p className="text-xs font-medium text-red-600">{state.error}</p>;
  if (state.ok) return <p className="text-xs font-medium text-emerald-600">Đã lưu thành công.</p>;
  return null;
}

export function SocialWorkspaceForm({ tenants }: { tenants: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createSocialWorkspaceAction, initialState);
  return (
    <form action={action} className="space-y-3">
      <Select name="tenantId" label="Doanh nghiệp / tenant" required options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))} />
      <Input name="name" label="Tên Social Workspace" placeholder="VD: 30Nice Social Network" required />
      <Textarea name="objective" label="Mục tiêu tổng" placeholder="Quản lý các Page dịch vụ, xây thương hiệu và thu lead..." />
      <Button type="submit" loading={pending} className="w-full">
        <BriefcaseBusiness className="h-4 w-4" /> Tạo workspace
      </Button>
      <ResultMessage state={state} />
    </form>
  );
}

export function SocialPageForm({ workspaces }: { workspaces: { id: string; name: string; tenantName: string }[] }) {
  const [state, action, pending] = useActionState(createSocialPageAction, initialState);
  return (
    <form action={action} className="space-y-3">
      <Select name="workspaceId" label="Workspace" required options={workspaces.map((workspace) => ({ value: workspace.id, label: `${workspace.name} · ${workspace.tenantName}` }))} />
      <Input name="name" label="Tên Page dự kiến" placeholder="VD: Đi Hà Giang Cùng 30Nice" required />
      <Input name="category" label="Chủ đề / ngành" placeholder="Du lịch Hà Giang, thuê xe, làm đẹp..." required />
      <Textarea name="objective" label="Mục tiêu Page" placeholder="Tăng người theo dõi, nhận khách inbox và xây thương hiệu..." required />
      <Textarea name="audience" label="Khách hàng mục tiêu" placeholder="Người 25–45 tuổi tại Hà Nội đang tìm lịch trình du lịch..." required />
      <Input name="brandVoice" label="Giọng thương hiệu" defaultValue="Thân thiện, thực tế, đáng tin cậy" required />
      <Button type="submit" loading={pending} className="w-full">
        <Flag className="h-4 w-4" /> Tạo Page Launch Kit
      </Button>
      <ResultMessage state={state} />
    </form>
  );
}

export function SocialPlanForm({ pages }: { pages: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createSocialPlanAction, initialState);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="space-y-3">
      <Select name="socialPageId" label="Facebook Page" required options={pages.map((page) => ({ value: page.id, label: page.name }))} />
      <Input name="title" label="Tên kế hoạch" placeholder="Kế hoạch xây Page 30 ngày" required />
      <Textarea name="objective" label="Mục tiêu chiến dịch" placeholder="Xây nền nội dung, tăng tương tác và tạo khách inbox..." />
      <Input name="startDate" type="date" label="Ngày bắt đầu" defaultValue={today} required />
      <Button type="submit" loading={pending} className="w-full">
        <CalendarPlus className="h-4 w-4" /> Tạo lịch nội dung 30 ngày
      </Button>
      <ResultMessage state={state} />
    </form>
  );
}

export function SocialGroupForm({ workspaces }: { workspaces: { id: string; name: string; tenantName: string }[] }) {
  const [state, action, pending] = useActionState(createSocialGroupAction, initialState);
  return (
    <form action={action} className="space-y-3">
      <Select name="workspaceId" label="Workspace" required options={workspaces.map((workspace) => ({ value: workspace.id, label: `${workspace.name} · ${workspace.tenantName}` }))} />
      <Input name="name" label="Tên Facebook Group" placeholder="VD: Review Du lịch Hà Giang" required />
      <Input name="groupUrl" type="url" label="URL Group" placeholder="https://www.facebook.com/groups/..." />
      <Input name="topics" label="Chủ đề phù hợp" placeholder="du lịch, Hà Giang, thuê xe" />
      <Textarea name="rules" label="Quy tắc cần tuân thủ" placeholder="Không đăng giá trực tiếp, không chèn link trong nội dung..." />
      <Button type="submit" loading={pending} className="w-full">
        <Users className="h-4 w-4" /> Thêm vào Group Library
      </Button>
      <ResultMessage state={state} />
    </form>
  );
}

export function EmptySocialFormNotice({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
      <Plus className="mx-auto h-5 w-5 text-slate-400" />
      <p className="mt-2 text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-xs text-slate-400">Tạo dữ liệu nền trước để mở bước tiếp theo.</p>
    </div>
  );
}
