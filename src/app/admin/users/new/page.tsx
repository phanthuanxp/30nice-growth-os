import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserForm } from "@/components/admin/user-form";
import { createUserAction } from "@/server/actions/users";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";

export const metadata: Metadata = { title: "Thêm User" };

export default async function NewUserPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/admin/users/new");
  if (!can(session.role, "AGENCY_ADMIN")) redirect("/admin/users");

  return (
    <div>
      <PageHeader
        title="Thêm user mới"
        description="Tạo tài khoản với email, mật khẩu và role."
        action={
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </Link>
        }
      />
      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <UserForm action={createUserAction} isNew />
        </CardContent>
      </Card>
    </div>
  );
}
