"use client";

import { useState, useTransition } from "react";
import { Phone, MessageCircle, Clock, CheckCircle2, XCircle, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { moveLeadAction } from "@/server/actions/leads";

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "WON";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  sourcePath: string | null;
  status: LeadStatus;
  createdAt: string;
}

interface Props {
  tenantId: string;
  leads: Lead[];
}

const COLUMNS: { key: LeadStatus; label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }[] = [
  { key: "NEW", label: "Mới", icon: Clock, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
  { key: "CONTACTED", label: "Đã liên hệ", icon: MessageCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { key: "QUALIFIED", label: "Tiềm năng", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
  { key: "WON", label: "Chốt được", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { key: "LOST", label: "Thất bại", icon: XCircle, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
];

export function LeadsKanban({ tenantId, leads: initialLeads }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);
  const [pending, startTransition] = useTransition();

  const byStatus = (status: LeadStatus) => leads.filter((l) => l.status === status);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDragging(leadId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId") || dragging;
    setDragOver(null);
    setDragging(null);
    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === targetStatus) return;

    // Optimistic update
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: targetStatus } : l));

    startTransition(async () => {
      const result = await moveLeadAction(leadId, targetStatus, tenantId);
      if (!result.ok) {
        // Revert on error
        setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: lead.status } : l));
      }
    });
  };

  const handleDragOver = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(status);
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 ${pending ? "opacity-70" : ""} transition-opacity`}>
      {COLUMNS.map((col) => {
        const colLeads = byStatus(col.key);
        const isDragTarget = dragOver === col.key;
        const Icon = col.icon;

        return (
          <div
            key={col.key}
            className={`rounded-xl border-2 transition-all ${isDragTarget ? `${col.border} ${col.bg} scale-[1.01]` : "border-slate-200 bg-slate-50"}`}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            {/* Column header */}
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl ${col.bg} border-b ${col.border}`}>
              <div className="flex items-center gap-1.5">
                <Icon className={`h-3.5 w-3.5 ${col.color}`} />
                <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
              </div>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
                {colLeads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-[120px]">
              {colLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onDragEnd={() => setDragging(null)}
                  className={`bg-white rounded-lg border shadow-sm p-3 cursor-grab active:cursor-grabbing transition-all ${
                    dragging === lead.id ? "opacity-50 rotate-1 scale-95" : "hover:shadow-md hover:-translate-y-0.5"
                  } ${col.key === "WON" ? "border-emerald-200" : col.key === "LOST" ? "border-red-200" : "border-slate-200"}`}
                >
                  <p className="text-xs font-semibold text-slate-800 leading-snug truncate">{lead.name}</p>
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 mt-1.5 text-xs text-sky-600 hover:text-sky-800 transition-colors"
                    >
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </a>
                  )}
                  {lead.message && (
                    <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2">{lead.message}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-300">{lead.createdAt}</span>
                    {lead.sourcePath && (
                      <Badge variant="neutral" className="text-[9px] px-1 py-0">{lead.sourcePath.slice(0, 12)}</Badge>
                    )}
                  </div>
                </div>
              ))}

              {colLeads.length === 0 && (
                <div className={`h-16 rounded-lg border-2 border-dashed ${isDragTarget ? col.border : "border-slate-200"} flex items-center justify-center`}>
                  <span className="text-xs text-slate-300">Kéo vào đây</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
