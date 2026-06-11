import type { Metadata } from "next";
import { Zap, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { CreateJobForm } from "@/components/admin/create-job-form";
import { getAutomationJobs, JOB_TYPES, JOB_STATUS_LABELS, type JobPayload } from "@/server/queries/automation";
import { getTenants } from "@/server/queries/tenants";
import { runJobAction, deleteJobAction } from "@/server/actions/automation";
import { DeleteButton } from "@/components/admin/delete-button";
import { RunJobButton } from "@/components/admin/run-job-button";

export const metadata: Metadata = { title: "Automation" };

function statusBadge(status: string) {
  const variants: Record<string, "success" | "danger" | "warning" | "info" | "neutral"> = {
    DONE: "success", FAILED: "danger", RUNNING: "warning", PENDING: "neutral",
  };
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    DONE: CheckCircle2, FAILED: XCircle, RUNNING: Loader2, PENDING: Clock,
  };
  const Icon = icons[status] ?? Clock;
  return (
    <Badge variant={variants[status] ?? "neutral"} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {JOB_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

export default async function AutomationPage() {
  let jobs: Awaited<ReturnType<typeof getAutomationJobs>> = [];
  let tenants: { id: string; name: string }[] = [];
  let isDemo = false;

  try {
    [jobs, tenants] = await Promise.all([getAutomationJobs(), getTenants()]);
    tenants = tenants.map((t) => ({ id: t.id, name: t.name }));
  } catch {
    isDemo = true;
  }

  const done = jobs.filter((j) => j.status === "DONE").length;
  const failed = jobs.filter((j) => j.status === "FAILED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automation Engine"
        description="Tự động hóa SEO check, đăng bài, thông báo lead và nhập dữ liệu."
      />

      {isDemo && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Cần kết nối database để tạo và chạy automation jobs.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Tạo tác vụ mới
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isDemo || tenants.length === 0 ? (
              <p className="text-sm text-slate-500">Cần kết nối database và có ít nhất một site.</p>
            ) : (
              <CreateJobForm tenants={tenants} />
            )}

            <div className="mt-6 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Loại tác vụ</p>
              {Object.entries(JOB_TYPES).map(([key, label]) => (
                <div key={key} className="flex items-start gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-slate-700">{label}</p>
                    <p className="text-[10px] text-slate-400">
                      {{
                        seo_check: "Phân tích và lưu điểm SEO vào lịch sử",
                        auto_publish: "Đăng ngay các bài đặt lịch đã đến giờ",
                        lead_notify: "Gửi webhook khi có lead mới",
                        wp_import: "Nhập pages/posts từ WordPress",
                      }[key]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Jobs list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Tổng tác vụ", value: jobs.length, color: "text-slate-700" },
              { label: "Hoàn thành", value: done, color: "text-emerald-600" },
              { label: "Lỗi", value: failed, color: "text-red-600" },
            ].map((s) => (
              <Card key={s.label} className="p-3 text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </Card>
            ))}
          </div>

          <Card>
            {jobs.length === 0 ? (
              <EmptyState
                icon={Zap}
                title="Chưa có tác vụ nào"
                description="Tạo tác vụ automation đầu tiên từ form bên trái."
              />
            ) : (
              <Table>
                <TableHead>
                  <tr>
                    <TableHeader>Tác vụ</TableHeader>
                    <TableHeader>Site</TableHeader>
                    <TableHeader>Trạng thái</TableHeader>
                    <TableHeader>Kết quả lần cuối</TableHeader>
                    <TableHeader></TableHeader>
                  </tr>
                </TableHead>
                <TableBody>
                  {jobs.map((job) => {
                    const payload = (job.payload ?? {}) as JobPayload;
                    const lastResult = payload.lastResult;
                    const runAction = runJobAction.bind(null, job.id);
                    const delAction = deleteJobAction.bind(null, job.id);
                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <p className="font-medium text-slate-800 text-sm">
                            {JOB_TYPES[job.type] ?? job.type}
                          </p>
                          {payload.webhookUrl && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">{payload.webhookUrl}</p>
                          )}
                          {payload.wpBaseUrl && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">{payload.wpBaseUrl}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{job.tenant.name}</TableCell>
                        <TableCell>{statusBadge(job.status)}</TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-[180px]">
                          {lastResult ? (
                            <div>
                              <p className={`line-clamp-2 ${lastResult.ok ? "text-emerald-700" : "text-red-600"}`}>
                                {lastResult.message}
                              </p>
                              <p className="text-slate-400 mt-0.5">
                                {new Date(lastResult.runAt).toLocaleString("vi-VN")}
                              </p>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1.5">
                            <RunJobButton onRun={runAction} />
                            <DeleteButton onDelete={delAction} label="Xóa tác vụ" />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Cron endpoints info */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">Cron endpoints (tự động hóa ngoài)</p>
              <div className="space-y-1.5 text-xs font-mono text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">POST</span>
                  <code className="bg-white rounded px-2 py-0.5 border border-slate-200">/api/cron/publish</code>
                  <span className="text-slate-400">— tự đăng bài lên lịch</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">POST</span>
                  <code className="bg-white rounded px-2 py-0.5 border border-slate-200">/api/cron/leads-notify</code>
                  <span className="text-slate-400">— thông báo lead mới</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Header: <code>x-cron-secret: [CRON_SECRET]</code></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
