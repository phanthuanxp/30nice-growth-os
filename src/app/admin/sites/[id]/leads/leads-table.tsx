"use client";

import { useState } from "react";
import { Users, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadStatusForm } from "@/components/admin/lead-status-form";
import { BulkBar } from "./leads-toolbar";

export interface LeadRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  sourcePath: string | null;
  sourceDomain: string | null;
  sourceType: string | null;
  utmSource: string | null;
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "WON";
  notes: string | null;
  activityCount: number;
  noteCount: number;
  createdAt: string;
}

const statusConfig: Record<
  LeadRow["status"],
  { variant: "default" | "success" | "warning" | "danger" | "info" | "neutral"; label: string }
> = {
  NEW: { variant: "info", label: "Mới" },
  CONTACTED: { variant: "warning", label: "Đã liên hệ" },
  QUALIFIED: { variant: "default", label: "Tiềm năng" },
  LOST: { variant: "danger", label: "Thất bại" },
  WON: { variant: "success", label: "Chốt được" },
};

export function LeadsTable({ tenantId, leads }: { tenantId: string; leads: LeadRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected((s) => (s.size === leads.length ? new Set() : new Set(leads.map((l) => l.id))));

  if (leads.length === 0) {
    return (
      <div className="py-12 text-center">
        <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Không có lead nào khớp bộ lọc</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHead>
          <tr>
            <TableHeader className="w-10">
              <input
                type="checkbox"
                checked={selected.size === leads.length && leads.length > 0}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                aria-label="Chọn tất cả"
              />
            </TableHeader>
            <TableHeader>Khách hàng</TableHeader>
            <TableHeader>Nội dung</TableHeader>
            <TableHeader>Nguồn</TableHeader>
            <TableHeader>Thời gian</TableHeader>
            <TableHeader>Trạng thái</TableHeader>
          </tr>
        </TableHead>
        <TableBody>
          {leads.map((l) => (
            <TableRow key={l.id} className={selected.has(l.id) ? "bg-indigo-50/50" : undefined}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selected.has(l.id)}
                  onChange={() => toggle(l.id)}
                  className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                  aria-label={`Chọn ${l.name}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">
                    {l.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{l.name}</p>
                    {l.phone && (
                      <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {l.phone}
                      </a>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm text-slate-500 max-w-xs">
                <span className="line-clamp-2">{l.message}</span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {l.sourceType && <Badge variant="neutral">{l.sourceType}</Badge>}
                  {l.sourcePath && (
                    <code className="block text-xs bg-slate-100 rounded px-1.5 py-0.5 text-slate-600 w-fit">{l.sourcePath}</code>
                  )}
                  {l.utmSource && <p className="text-[11px] text-indigo-500">utm: {l.utmSource}</p>}
                  {l.sourceDomain && <p className="text-[11px] text-slate-400">{l.sourceDomain}</p>}
                  {(l.activityCount > 0 || l.noteCount > 0) && (
                    <p className="text-[11px] text-slate-400">{l.activityCount} hoạt động · {l.noteCount} ghi chú</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-xs text-slate-400 whitespace-nowrap">{l.createdAt}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={statusConfig[l.status].variant}>{statusConfig[l.status].label}</Badge>
                  <LeadStatusForm leadId={l.id} currentStatus={l.status} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <BulkBar tenantId={tenantId} selected={[...selected]} onClear={() => setSelected(new Set())} />
    </>
  );
}
