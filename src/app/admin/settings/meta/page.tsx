import type { Metadata } from "next";
import Link from "next/link";
import { Facebook, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetaSettingsForm } from "@/components/admin/meta-settings-form";
import { getMetaRuntimeSettings } from "@/server/meta/settings-store";

export const metadata: Metadata = { title: "Meta Settings" };

export default function MetaSettingsPage() {
  const config = getMetaRuntimeSettings();
  const ready = Boolean(config.appId && config.appSecret && config.tokenEncryptionKey.length >= 32);
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Cấu hình Meta / Facebook" description="Nhập App ID, App Secret và khóa mã hóa token để kết nối các Facebook Page có sẵn." />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Facebook className="h-4 w-4 text-blue-600" /> Meta OAuth</CardTitle>
          <CardDescription>Secret chỉ lưu server-side, không hiển thị lại trong giao diện.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant={ready ? "success" : "danger"}>{ready ? "Sẵn sàng kết nối" : "Chưa đủ cấu hình"}</Badge>
            <Badge>Nguồn: {config.source === "admin_settings" ? "Settings UI" : ".env"}</Badge>
            {config.requestPublishScope ? <Badge variant="danger">Đang xin quyền publish</Badge> : <Badge variant="success">Không xin quyền publish mặc định</Badge>}
          </div>
          <MetaSettingsForm defaults={{ appId: config.appId, redirectUri: config.redirectUri, graphVersion: config.graphVersion, hasAppSecret: Boolean(config.appSecret), hasTokenKey: config.tokenEncryptionKey.length >= 32, hasWebhookToken: Boolean(config.webhookVerifyToken) }} />
          <p className="text-xs text-slate-500">Callback cần khai báo trong Meta App: <code>{config.redirectUri}</code></p>
          <Link href="/admin/social/pages" className="inline-flex text-sm font-medium text-blue-600 hover:underline">Đến Page Factory để kết nối Page có sẵn →</Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Lưu ý an toàn</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Production vẫn giữ chính sách không xin quyền đăng bài mặc định.</p>
          <p>Token Facebook Page sẽ được mã hóa bằng Token Encryption Key trước khi lưu.</p>
          <p>Nếu đổi Token Encryption Key sau khi đã kết nối Page, các token cũ có thể không giải mã được.</p>
        </CardContent>
      </Card>
    </div>
  );
}
