import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { getLeads, type LeadFilters } from "@/server/queries/leads";
import type { LeadStatus } from "@prisma/client";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  QUALIFIED: "Tiềm năng",
  LOST: "Thất bại",
  WON: "Chốt được",
};

function csvCell(v: string | null | undefined): string {
  const s = (v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const tenantId = sp.get("tenantId") ?? undefined;

  const filters: LeadFilters = {};
  const status = sp.get("status");
  if (status && ["NEW", "CONTACTED", "QUALIFIED", "LOST", "WON"].includes(status)) {
    filters.status = status as LeadStatus;
  }
  const search = sp.get("q");
  if (search) filters.search = search;
  const from = sp.get("from");
  if (from) filters.from = new Date(from);
  const to = sp.get("to");
  if (to) {
    const d = new Date(to);
    d.setHours(23, 59, 59, 999);
    filters.to = d;
  }

  const leads = await getLeads(tenantId, filters).catch(() => []);

  const header = ["Thời gian", "Tên", "SĐT", "Email", "Nội dung", "Nguồn", "Website", "Trạng thái", "Ghi chú", "Site"];
  const rows = leads.map((l) => [
    csvCell(new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(l.createdAt)),
    csvCell(l.name),
    csvCell(l.phone),
    csvCell(l.email),
    csvCell(l.message),
    csvCell(l.sourcePath),
    csvCell(l.sourceDomain),
    csvCell(STATUS_LABELS[l.status] ?? l.status),
    csvCell(l.notes),
    csvCell(l.tenant?.name),
  ].join(","));

  // BOM so Excel reads UTF-8 Vietnamese correctly
  const csv = "\uFEFF" + [header.map(csvCell).join(","), ...rows].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${date}.csv"`,
    },
  });
}
