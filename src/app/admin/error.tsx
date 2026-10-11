"use client";

import { useEffect } from "react";
import { DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";

// Admin pages no longer fall back to sample data when a query fails (an admin
// could mistake fake numbers for real ones); they throw and land here instead.
export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto mt-16 max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
      <div className="flex items-start gap-3">
        <DatabaseZap className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="space-y-2">
          <p className="font-semibold">Không tải được dữ liệu cho trang này.</p>
          <p className="text-sm text-amber-800">
            Thường do database tạm thời không kết nối được. Không có dữ liệu mẫu nào được hiển thị thay thế.
          </p>
          {error.digest && <p className="text-xs text-amber-700">Mã lỗi: {error.digest}</p>}
          <Button size="sm" onClick={() => unstable_retry()}>
            Thử lại
          </Button>
        </div>
      </div>
    </div>
  );
}
