import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Users, PhoneCall, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadStatusForm } from "@/components/admin/lead-status-form";
import { getTenantById } from "@/server/queries/tenants";
import { getLeads } from "@/server/queries/leads";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `Leads — ${tenant.name}` : "Leads" };
}

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

export default async function SiteLeadsPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  const leads = await getLeads(id).catch(() => []);

  const counts = Object.fromEntries(
    (["NEW", "CONTACTED", "QUALIFIED", "LOST", "WON"] as LeadStatus[]).map((s) => [
      s,
      leads.filter((l) => l.status === s).length,
    ])
  ) as Record<LeadStatus, number>;

  return (
    <div>
      <PageHeader
        title="Leads"
        description={`Khách hàng tiềm năng từ ${tenant.name}.`}
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
            <p className="text-lg font-bold text-slate-800">{leads.length}</p>
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
          {leads.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Chưa có lead nào</p>
            </div>
          ) : (
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Khách hàng</TableHeader>
                  <TableHeader>Nội dung</TableHeader>
                  <TableHeader>Nguồn</TableHeader>
                  <TableHeader>Trạng thái</TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {leads.map((l) => (
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
                      <LeadStatusForm leadId={l.id} currentStatus={l.status as LeadStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
