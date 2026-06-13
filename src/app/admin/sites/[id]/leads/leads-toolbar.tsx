"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Download, CheckSquare, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bulkUpdateLeadStatusAction, bulkDeleteLeadsAction } from "@/server/actions/leads";

const STATUSES = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "NEW", label: "Mới" },
  { value: "CONTACTED", label: "Đã liên hệ" },
  { value: "QUALIFIED", label: "Tiềm năng" },
  { value: "WON", label: "Chốt được" },
  { value: "LOST", label: "Thất bại" },
];

export function LeadsToolbar({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const apply = (patch: Record<string, string>) => {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`?${params.toString()}`);
  };

  const exportUrl = (() => {
    const params = new URLSearchParams(sp.toString());
    params.set("tenantId", tenantId);
    return `/api/leads/export?${params.toString()}`;
  })();

  const hasFilters = !!(sp.get("status") || sp.get("q") || sp.get("from") || sp.get("to"));

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply({ q })}
          placeholder="Tìm tên, SĐT, email, nội dung..."
          className="h-9 text-sm pl-9"
        />
      </div>
      <select
        value={sp.get("status") ?? ""}
        onChange={(e) => apply({ status: e.target.value })}
        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      <input
        type="date"
        defaultValue={sp.get("from") ?? ""}
        onChange={(e) => apply({ from: e.target.value })}
        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
        aria-label="Từ ngày"
      />
      <input
        type="date"
        defaultValue={sp.get("to") ?? ""}
        onChange={(e) => apply({ to: e.target.value })}
        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
        aria-label="Đến ngày"
      />
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => { setQ(""); router.push("?"); }}>
          <X className="h-4 w-4" />
          Xóa lọc
        </Button>
      )}
      <a href={exportUrl}>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4" />
          Xuất CSV
        </Button>
      </a>
    </div>
  );
}

export function BulkBar({
  tenantId, selected, onClear,
}: {
  tenantId: string;
  selected: string[];
  onClear: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (selected.length === 0) return null;

  const setStatus = (status: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "WON") =>
    startTransition(async () => {
      await bulkUpdateLeadStatusAction(tenantId, selected, status);
      onClear();
      router.refresh();
    });

  const remove = () =>
    startTransition(async () => {
      if (confirm(`Xóa vĩnh viễn ${selected.length} lead đã chọn?`)) {
        await bulkDeleteLeadsAction(tenantId, selected);
        onClear();
        router.refresh();
      }
    });

  return (
    <div className={`sticky bottom-4 z-10 mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white shadow-lg px-4 py-3 flex items-center gap-3 flex-wrap ${pending ? "opacity-60" : ""}`}>
      <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
        <CheckSquare className="h-4 w-4 text-indigo-600" />
        Đã chọn {selected.length}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("CONTACTED")}>Đã liên hệ</Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("QUALIFIED")}>Tiềm năng</Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("WON")}>Chốt được</Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus("LOST")}>Thất bại</Button>
        <Button size="sm" variant="danger" disabled={pending} onClick={remove}>
          <Trash2 className="h-3.5 w-3.5" />
          Xóa
        </Button>
      </div>
      <Button size="icon" variant="ghost" onClick={onClear} className="ml-auto" aria-label="Bỏ chọn">
        <X className="h-4 w-4 text-slate-400" />
      </Button>
    </div>
  );
}
