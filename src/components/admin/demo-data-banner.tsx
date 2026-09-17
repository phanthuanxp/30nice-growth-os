import { DatabaseZap } from "lucide-react";

/**
 * Shown at the top of a page whenever its data query fell back to demo
 * content — normally because the database was unreachable. Every list page
 * used to bury this as a line of grey text below the table, after an admin
 * had already scrolled past a full page of numbers that were not real.
 */
export function DemoDataBanner({ reason }: { reason?: string }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <DatabaseZap className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div>
        <p className="font-medium">Đang hiển thị dữ liệu demo, không phải dữ liệu thật.</p>
        <p className="mt-0.5 text-amber-700">{reason || "Không kết nối được tới database. Số liệu, danh sách và trạng thái bên dưới chỉ là dữ liệu mẫu."}</p>
      </div>
    </div>
  );
}
