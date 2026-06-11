import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageForm } from "@/components/admin/page-form";
import { getTenants } from "@/server/queries/tenants";
import { createPageAction } from "@/server/actions/pages";

export const metadata: Metadata = { title: "Tạo Page Mới" };

export default async function NewPagePage() {
  let tenants: { id: string; name: string }[] = [];
  try {
    const rows = await getTenants();
    tenants = rows.map((t) => ({ id: t.id, name: t.name }));
  } catch {
    // DB not available — form will show a message
  }

  return (
    <div>
      <PageHeader
        title="Tạo Page Mới"
        description="Tạo trang nội dung mới cho website."
        action={
          <Link href="/admin/pages">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="pt-6">
          {tenants.length === 0 ? (
            <p className="text-sm text-slate-500">
              Không thể kết nối database. Vui lòng kiểm tra cấu hình DATABASE_URL.
            </p>
          ) : (
            <PageForm action={createPageAction} tenants={tenants} isNew />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
