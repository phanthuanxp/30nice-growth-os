import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, ShieldCheck, RefreshCw, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSession } from "@/server/auth/session";
import { can } from "@/server/permissions";
import { listAuditLogs, distinctAuditActions } from "@/server/queries/audit";

export const metadata: Metadata = { title: "Audit Log" };

function actionVariant(action: string) {
  if (action.includes("delete") || action.includes("login_failed")) return "danger" as const;
  if (action.includes("create") || action.includes("publish")) return "success" as const;
  if (action.includes("update") || action.includes("login_success")) return "neutral" as const;
  return "neutral" as const;
}

interface Props {
  searchParams: Promise<{ search?: string; action?: string }>;
}

export default async function AuditLogPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login?from=/admin/settings/audit");
  if (!can(session.role, "AGENCY_ADMIN")) {
    return (
      <div>
        <PageHeader title="Audit Log" description="Lịch sử hành động hệ thống." />
        <Card className="p-6 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-3 text-sm font-medium text-slate-700">Bạn không có quyền xem audit log.</p>
        </Card>
      </div>
    );
  }

  const { search, action } = await searchParams;
  let logs: Awaited<ReturnType<typeof listAuditLogs>> = [];
  let actions: string[] = [];
  let dbError = false;

  try {
    [logs, actions] = await Promise.all([
      listAuditLogs({ search, action, limit: 100 }),
      distinctAuditActions(),
    ]);
  } catch {
    dbError = true;
  }

  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Lịch sử các hành động quan trọng trong hệ thống. Lưu vĩnh viễn."
        action={
          <Link href="/admin/settings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        }
      />

      <Card className="p-4 mb-6">
        <form className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Tìm kiếm</label>
            <input
              name="search"
              defaultValue={search ?? ""}
              placeholder="action, resource, resource ID..."
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>
          <div className="min-w-[180px]">
            <label className="text-xs font-medium text-slate-600 mb-1 block">Action</label>
            <select
              name="action"
              defaultValue={action ?? ""}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm bg-white"
            >
              <option value="">Tất cả</option>
              {actions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <Button size="sm" type="submit">
            <RefreshCw className="h-3.5 w-3.5" />
            Lọc
          </Button>
          {(search || action) && (
            <Link href="/admin/settings/audit">
              <Button variant="outline" size="sm">Reset</Button>
            </Link>
          )}
        </form>
      </Card>

      {dbError ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-red-600">Không kết nối được DB.</p>
        </Card>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Chưa có audit log nào"
          description="Audit log sẽ tự ghi khi có hành động: login, create, update, delete..."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Tenant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <span className="text-xs text-slate-500 font-mono">
                      {log.createdAt.toLocaleString("vi-VN")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <div className="text-sm">
                        <p className="font-medium text-slate-800">{log.user.name || log.user.email}</p>
                        <p className="text-xs text-slate-400">{log.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">system / deleted</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.resource ? (
                      <div className="text-sm">
                        <span className="text-slate-700">{log.resource}</span>
                        {log.resourceId && (
                          <p className="text-xs text-slate-400 font-mono truncate max-w-[180px]">{log.resourceId}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.tenant ? (
                      <span className="text-sm text-slate-700">{log.tenant.name}</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <p className="text-xs text-slate-400 mt-4 text-center">
        Hiển thị tối đa 100 records gần nhất. Lọc theo action/từ khoá để xem chi tiết hơn.
      </p>
    </div>
  );
}
