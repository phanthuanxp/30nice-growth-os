import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileInput } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTenantById } from "@/server/queries/tenants";
import { listFormSubmissions } from "@/server/queries/forms";
import { SiteSidebar } from "@/components/admin/site-sidebar";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `Submissions — ${tenant.name}` : "Submissions" };
}

function formatPayload(payload: unknown): string {
  if (typeof payload === "string") return payload;
  try {
    const obj = payload as Record<string, unknown>;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ");
  } catch {
    return JSON.stringify(payload);
  }
}

function PayloadTable({ payload }: { payload: unknown }) {
  if (!payload || typeof payload !== "object") {
    return <p className="text-xs text-slate-500">{String(payload)}</p>;
  }
  const entries = Object.entries(payload as Record<string, unknown>);
  return (
    <table className="w-full text-xs">
      <tbody>
        {entries.map(([k, v]) => (
          <tr key={k} className="border-t border-slate-50 first:border-0">
            <td className="py-1 pr-3 text-slate-400 font-medium capitalize whitespace-nowrap">{k}</td>
            <td className="py-1 text-slate-700">{String(v ?? "")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function SubmissionsPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  const submissions = await listFormSubmissions(id, 100).catch(() => []);

  return (
    <div className="flex flex-1 overflow-hidden">
      <SiteSidebar
        siteId={id}
        siteName={tenant.name}
        siteSlug={tenant.slug}
        primaryDomain={tenant.primaryDomain}
      />
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Form Submissions"
            description={`Tất cả dữ liệu form gửi lên từ ${tenant.primaryDomain ?? tenant.slug}.`}
          />

          {submissions.length === 0 ? (
            <EmptyState
              icon={FileInput}
              title="Chưa có form submission nào"
              description="Khi khách điền form trên site, dữ liệu sẽ xuất hiện ở đây."
            />
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <Card key={sub.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {sub.form && (
                        <Badge variant="info">{sub.form.name}</Badge>
                      )}
                      {sub.sourcePath && (
                        <span className="text-xs text-slate-400 font-mono">{sub.sourcePath}</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                      {sub.createdAt.toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <PayloadTable payload={sub.payload} />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {submissions.length >= 100 && (
            <p className="text-xs text-slate-400 mt-3 text-center">
              Hiển thị 100 submissions gần nhất.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
