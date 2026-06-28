import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Users, PhoneCall, CheckCircle2, KanbanSquare, List } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getTenantById } from "@/server/queries/tenants";
import { getLeads, type LeadFilters } from "@/server/queries/leads";
import type { LeadStatus } from "@prisma/client";
import { LeadsToolbar } from "./leads-toolbar";
import { LeadsTable, type LeadRow } from "./leads-table";
import { LeadsKanban } from "@/components/admin/leads-kanban";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; q?: string; from?: string; to?: string; view?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `Lead — ${tenant.name}` : "Lead" };
}

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

export default async function SiteLeadsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const isKanban = sp.view === "kanban";
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  const filters: LeadFilters = {};
  if (sp.status && ["NEW", "CONTACTED", "QUALIFIED", "LOST", "WON"].includes(sp.status)) {
    filters.status = sp.status as LeadStatus;
  }
  if (sp.q) filters.search = sp.q;
  if (sp.from) filters.from = new Date(sp.from);
  if (sp.to) {
    const d = new Date(sp.to);
    d.setHours(23, 59, 59, 999);
    filters.to = d;
  }

  const [leads, allLeads] = await Promise.all([
    getLeads(id, filters).catch(() => []),
    getLeads(id).catch(() => []),
  ]);

  const counts = Object.fromEntries(
    (["NEW", "CONTACTED", "QUALIFIED", "LOST", "WON"] as LeadStatus[]).map((s) => [
      s,
      allLeads.filter((l) => l.status === s).length,
    ])
  ) as Record<LeadStatus, number>;

  const fmt = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  });

  const rows: LeadRow[] = leads.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email,
    message: l.message,
    sourcePath: l.sourcePath,
    sourceDomain: l.sourceDomain,
    sourceType: l.sourceType,
    utmSource: l.utmSource,
    status: l.status,
    notes: l.notes,
    activityCount: l._count?.activities ?? 0,
    noteCount: l._count?.leadNotes ?? 0,
    createdAt: fmt.format(l.createdAt),
  }));

  return (
    <div>
      <PageHeader
        title="Lead"
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
            <p className="text-lg font-bold text-slate-800">{allLeads.length}</p>
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

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4">
        <Link
          href={`?view=list`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!isKanban ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          <List className="h-4 w-4" /> Table
        </Link>
        <Link
          href={`?view=kanban`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isKanban ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          <KanbanSquare className="h-4 w-4" /> Kanban
        </Link>
        <span className="text-xs text-slate-400 ml-2">{allLeads.length} leads tổng</span>
      </div>

      {isKanban ? (
        <LeadsKanban
          tenantId={id}
          leads={allLeads.map((l) => ({
            id: l.id,
            name: l.name,
            phone: l.phone,
            email: l.email,
            message: l.message,
            sourcePath: l.sourcePath,
            status: l.status as "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "WON",
            createdAt: fmt.format(l.createdAt),
          }))}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Danh sách leads{leads.length !== allLeads.length ? ` (${leads.length}/${allLeads.length})` : ` (${leads.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-5 pt-4">
              <LeadsToolbar tenantId={id} />
            </div>
            <LeadsTable tenantId={id} leads={rows} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
