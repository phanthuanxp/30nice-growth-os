import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserForm } from "@/components/admin/user-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { updateUserAction, deleteUserAction } from "@/server/actions/users";
import { getSession } from "@/server/auth/session";
import { can, ROLE_LABELS } from "@/server/permissions";
import { getUserById } from "@/server/queries/users";

export const metadata: Metadata = { title: "Sửa user" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?from=/admin/users/${id}`);
  if (!can(session.role, "AGENCY_ADMIN")) redirect("/admin/users");

  const user = await getUserById(id).catch(() => null);
  if (!user) notFound();

  const isSuperAdminTarget = user.role === "SUPER_ADMIN";
  const actorIsSuperAdmin = session.role === "SUPER_ADMIN";
  const canDelete = actorIsSuperAdmin && session.id !== user.id;

  const boundUpdate = updateUserAction.bind(null, user.id);
  const boundDelete = deleteUserAction.bind(null, user.id);

  return (
    <div>
      <PageHeader
        title={user.name || user.email}
        description={`Sửa thông tin tài khoản · ${ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}`}
        action={
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-6 max-w-5xl">
        <div className="col-span-2">
          <Card>
            <CardContent className="pt-6">
              {isSuperAdminTarget && !actorIsSuperAdmin && (
                <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                  Chỉ SUPER_ADMIN mới được sửa user này.
                </div>
              )}
              <UserForm
                action={boundUpdate}
                initialData={{
                  email: user.email,
                  name: user.name,
                  role: user.role,
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tổ chức</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user.organizationMembers.length === 0 ? (
                <p className="text-xs text-slate-400">Chưa thuộc org nào.</p>
              ) : (
                user.organizationMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{m.organization.name}</span>
                    <Badge variant="neutral">{m.role}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tenant Memberships</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user.tenantMembers.length === 0 ? (
                <p className="text-xs text-slate-400">Chưa thuộc tenant nào.</p>
              ) : (
                user.tenantMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{m.tenant.name}</span>
                    <Badge variant="neutral">{m.role}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {canDelete && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-sm text-red-600">Vùng nguy hiểm</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500 mb-3">
                  Xoá user này. Hành động không thể undo. Toàn bộ thành viên org/tenant cũng bị gỡ.
                </p>
                <DeleteButton onDelete={boundDelete} label="Xoá user" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
