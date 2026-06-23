import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTenantById } from "@/server/queries/tenants";
import { getPostsByTenant } from "@/server/queries/posts";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `Bài viết — ${tenant.name}` : "Bài viết" };
}

const statusVariant = (s: string) =>
  s === "PUBLISHED" ? "success" as const : s === "DRAFT" ? "warning" as const : "neutral" as const;

export default async function SiteBlogPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  const posts = await getPostsByTenant(id).catch(() => []);

  const published = posts.filter((p) => p.status === "PUBLISHED").length;
  const draft = posts.filter((p) => p.status === "DRAFT").length;

  return (
    <div>
      <PageHeader
        title="Bài viết"
        description={`Bài viết của ${tenant.name}.`}
        action={
          <Link href={`/admin/sites/${id}/blog/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Viết bài
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Tổng bài viết", value: posts.length },
          { label: "Đã publish", value: published },
          { label: "Bản nháp", value: draft },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {posts.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="Chưa có bài viết nào"
            description="Viết bài đầu tiên cho site này."
            action={
              <Link href={`/admin/sites/${id}/blog/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Viết bài
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách bài viết</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <tr>
                  <TableHeader>Tiêu đề</TableHeader>
                  <TableHeader>Trạng thái</TableHeader>
                  <TableHeader>Ngày publish</TableHeader>
                  <TableHeader>Mô tả ngắn</TableHeader>
                  <TableHeader></TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="font-medium text-slate-800">{p.title}</span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <code className="bg-slate-50 px-1 rounded">/blog/{p.slug}</code>
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {p.publishedAt
                        ? new Date(p.publishedAt).toLocaleDateString("vi-VN")
                        : <span className="text-slate-300">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 max-w-xs">
                      <span className="line-clamp-1">{p.excerpt}</span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/sites/${id}/blog/${p.id}`}>
                        <Button variant="outline" size="sm">Sửa</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
