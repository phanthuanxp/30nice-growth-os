import { notFound } from "next/navigation";
import { getTenantById } from "@/server/queries/tenants";
import { FormsClient } from "./forms-client";
import { getFormConfig } from "./actions";
import type { NotificationConfig } from "@/lib/notifications";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FormsPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id);
  if (!tenant) notFound();

  const config = await getFormConfig(id);

  return (
    <div className="max-w-3xl mx-auto space-y-2">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Forms & Thông báo</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Cấu hình form liên hệ và nhận thông báo khi có bạn đọc gửi yêu cầu
        </p>
      </div>
      <FormsClient
        siteId={id}
        config={config as NotificationConfig | null}
        recentLeads={[]}
      />
    </div>
  );
}
