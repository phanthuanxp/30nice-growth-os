import type { Metadata } from "next";
import { Users, PhoneCall, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadStatusForm } from "@/components/admin/lead-status-form";
import { getLeads } from "@/server/queries/leads";
import { leads as demoLeads, tenants as demoTenants } from "@/server/queries/demo-data";

export const metadata: Metadata = { title: "Leads" };

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "WON";

const statusConfig: Record<
  LeadStatus,
  { variant: "default" | "success" | "warning" | "danger" | "info" | "neutral"; label: string }
> = {
  NEW: { variant: "info", label: "Mới" },
  CONTACTED: { variant: "warning", label: "Đã liên hệ" },
  QUALIFIED: { variant: "default", label: "Tiềm năng" },
  LOST: { variant: "danger", label: "Thất bại" },
  WON: { variant: "success", label: "Chốt được" },
};

export default async function LeadsPage() {
  type LeadRow = {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    message: string | null;
    sourcePath: string | null;
    status: LeadStatus;
    tenantName: string;
    isDemo?: boolean;
  };

  let leadList: LeadRow[] = [];
  let isDemo = false;

  try {
    const rows = await getLeads();
    leadList = rows.map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      email: l.email,
      message: l.message,
      sourcePath: l.sourcePath,
      status: l.status as LeadStatus,
      tenantName: l.tenant.name,
    }));
  } catch {
    isDemo = true;
    const tenantMap = Object.fromEntries(demoTenants.map((t) => [t.id, t.name]));
    leadList = demoLeads.map((l) => ({
      id: l.id,
      name: l.name,
      phone: l.phone || null,
      email: l.email || null,
      message: l.message,
      sourcePath: l.sourcePath,
      status: l.status as LeadStatus,
      tenantName: tenantMap[l.tenantId] ?? l.tenantId,
      isDemo: true,
    }));
  }

  const counts = Object.fromEntries(
    (["NEW", "CONTACTED", "QUALIFIED", "LOST", "WON"] as LeadStatus[]).map((s) => [
      s,
      leadList.filter((l) => l.status === s).length,
    ])
  ) as Record<LeadStatus, number>;

  return (
    <div>
      <PageHeader
        title="Lead Center"
        description="Inbox khách hàng tiềm năng từ tất cả các website."
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {(Object.entries(statusConfig) as [LeadStatus, (typeof statusConfig)[LeadStatus]][]).map(
          ([key, cfg]) => (
            <Card key={key} className="p-4 text-center">
              <p className="text-xl font-bold text-slate-800">{counts[key]}</p>
              <Badge variant={cfg.variant} className="mt-1.5">{cfg.label}</Badge>
            </Card>
          )
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center">
            <Users className="h-5 w-5 text-sky-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{leadList.length}</p>
            <p className="text-xs text-slate-500">Tổng leads</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <PhoneCall className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{counts.NEW}</p>
            <p className="text-xs text-slate-500">Cần gọi lại</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{counts.QUALIFIED}</p>
            <p className="text-xs text-slate-500">Tiềm năng</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả leads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Khách hàng</TableHeader>
                <TableHeader>Site</TableHeader>
                <TableHeader>Nội dung</TableHeader>
                <TableHeader>Nguồn</TableHeader>
                <TableHeader>Trạng thái</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {leadList.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                        {l.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{l.name}</p>
                        <p className="text-xs text-slate-400">{l.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{l.tenantName}</TableCell>
                  <TableCell className="text-sm text-slate-500 max-w-xs">
                    <span className="line-clamp-2">{l.message}</span>
                  </TableCell>
                  <TableCell>
                    {l.sourcePath && (
                      <code className="text-xs bg-slate-100 rounded px-1.5 py-0.5 text-slate-600">
                        {l.sourcePath}
                      </code>
                    )}
                  </TableCell>
                  <TableCell>
                    {l.isDemo ? (
                      <Badge variant={statusConfig[l.status]?.variant ?? "neutral"}>
                        {statusConfig[l.status]?.label ?? l.status}
                      </Badge>
                    ) : (
                      <LeadStatusForm leadId={l.id} currentStatus={l.status} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isDemo && (
        <p className="mt-4 text-xs text-slate-400 text-center">
          Dữ liệu demo · Kết nối database để cập nhật trạng thái leads
        </p>
      )}
    </div>
  );
}
