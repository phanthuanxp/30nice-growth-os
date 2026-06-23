import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ShieldAlert, ShieldCheck, Eye, Edit } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSession } from "@/server/auth/session";
import { can, ROLE_LABELS } from "@/server/permissions";
import { listUsers } from "@/server/queries/users";

export const metadata: Metadata = { title: "Users" };

function roleVariant(role: string) {
  if (role === "SUPER_ADMIN") return "danger" as const;
  if (role === "AGENCY_ADMIN") return "warning" as const;
  if (role === "TENANT_ADMIN") return "success" as const;
  if (role === "EDITOR") return "neutral" as const;
  return "neutral" as const;
}

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/admin/users");
  if (!can(session.role, "AGENCY_ADMIN")) {
    return (
      <div>
        <PageHeader title="Users" description="Quản lý người dùng và phân quyền." />
        <Card className="p-6 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-3 text-sm font-medium text-slate-700">Bạn không có quyền truy cập trang này.</p>
          <p className="text-xs text-slate-500 mt-1">Cần quyền AGENCY_ADMIN trở lên.</p>
        </Card>
      </div>
    );
  }

  let users: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: Date;
    _count: { organizationMembers: number; tenantMembers: number };
  }> = [];
  let dbError = false;

  try {
    users = await listUsers();
  } catch {
    dbError = true;
  }

  const superAdmins = users.filter((u) => u.role === "SUPER_ADMIN").length;
  const editors = users.filter((u) => u.role === "EDITOR" || u.role === "TENANT_ADMIN").length;

  return (
    <div>
      <PageHeader
        title="Users"
        description="Quản lý tài khoản, phân quyền và truy cập."
        action={
          <Link href="/admin/users/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Thêm user
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{users.length}</p>
          <p className="text-xs text-slate-500">Tổng user</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{superAdmins}</p>
          <p className="text-xs text-slate-500">SUPER_ADMIN</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{editors}</p>
          <p className="text-xs text-slate-500">Editor / Tenant Admin</p>
        </Card>
      </div>

      {dbError ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-red-600">Không kết nối được DB.</p>
        </Card>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Eye}
          title="Chưa có user nào"
          description="Tạo user đầu tiên để mời đồng nghiệp vào hệ thống."
          action={
            <Link href="/admin/users/new">
              <Button>
                <Plus className="h-4 w-4" />
                Thêm user
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Sites</TableHead>
                <TableHead>Tạo lúc</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                        {(u.name || u.email)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{u.name || "(no name)"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{u.email}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={roleVariant(u.role)}>
                      {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}
                    </Badge>
                    {u.role === "SUPER_ADMIN" && (
                      <ShieldCheck className="inline-block ml-1 h-3.5 w-3.5 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500">
                      {u._count.tenantMembers} tenant · {u._count.organizationMembers} org
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500">
                      {u.createdAt.toLocaleDateString("vi-VN")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/users/${u.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3.5 w-3.5" />
                        Sửa
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
