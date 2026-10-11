import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/server/db";

export const metadata: Metadata = { title: "Media Library" };

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Media is stored per site; this page is the cross-site overview that links
// into each site's library (/admin/sites/[id]/media), where uploads happen.
export default async function MediaPage() {
  const [tenants, usage] = await Promise.all([
    prisma.tenant.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, primaryDomain: true } }),
    prisma.mediaAsset.groupBy({ by: ["tenantId"], _count: { _all: true }, _sum: { size: true } }),
  ]);
  const usageByTenant = new Map(usage.map((u) => [u.tenantId, { files: u._count._all, bytes: u._sum.size ?? 0 }]));

  return (
    <div>
      <PageHeader title="Thư viện media" description="Media được quản lý theo từng site. Chọn site để xem và tải file lên." />

      {tenants.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Chưa có site nào" description="Tạo site trước khi tải media lên." />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Số file</TableHead>
                <TableHead>Dung lượng</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => {
                const u = usageByTenant.get(t.id) ?? { files: 0, bytes: 0 };
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <p className="font-medium text-slate-900">{t.name}</p>
                      {t.primaryDomain && <p className="text-xs text-slate-500">{t.primaryDomain}</p>}
                    </TableCell>
                    <TableCell>{u.files}</TableCell>
                    <TableCell>{formatSize(u.bytes)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/sites/${t.id}/media`}>
                        <Button size="sm" variant="outline" className="gap-1.5">
                          Mở thư viện
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
