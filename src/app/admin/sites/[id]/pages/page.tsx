import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTenantById } from "@/server/queries/tenants";
import { getPagesByTenant } from "@/server/queries/pages";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `Trang — ${tenant.name}` : "Trang" };
}

const statusVariant = (s: string) =>
  s === "PUBLISHED" ? "success" as const : s === "DRAFT" ? "warning" as const : "neutral" as const;

export default async function SitePagesPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  const pages = await getPagesByTenant(id).catch(() => []);

  return (
    <div>
      <PageHeader
        title="Trang"
        description={`Tất cả trang nội dung của ${tenant.name}.`}
        action={
          <Link href={`/admin/sites/${id}/pages/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Tạo Page
            </Button>
          </Link>
        }
      />

      {pages.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="Chưa có page nào"
            description="Tạo page đầu tiên cho site này."
            action={
              <Link href={`/admin/sites/${id}/pages/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Tạo Page
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Tiêu đề</TableHeader>
                <TableHeader>Slug</TableHeader>
                <TableHeader>Trạng thái</TableHeader>
                <TableHeader>Tóm tắt</TableHeader>
                <TableHeader></TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {pages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800">{p.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-slate-100 rounded px-1.5 py-0.5 text-slate-600">
                      /{p.slug || ""}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-500 line-clamp-1">{p.summary}</span>
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/sites/${id}/pages/${p.id}`}>
                      <Button variant="outline" size="sm">Sửa</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
