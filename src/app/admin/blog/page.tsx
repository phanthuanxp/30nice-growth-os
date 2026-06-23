import type { Metadata } from "next";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllPosts } from "@/server/queries/posts";
import { posts as demoPosts, tenants as demoTenants } from "@/server/queries/demo-data";

export const metadata: Metadata = { title: "Blog" };

const statusVariant = (s: string) =>
  s === "PUBLISHED" ? "success" as const : s === "DRAFT" ? "warning" as const : "neutral" as const;

export default async function BlogPage() {
  type PostRow = {
    id: string;
    title: string;
    slug: string;
    status: string;
    excerpt: string | null;
    publishedAt: Date | string | null;
    tenantName: string;
    isDemo?: boolean;
  };

  let postList: PostRow[] = [];
  let isDemo = false;

  try {
    const rows = await getAllPosts();
    postList = rows.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      excerpt: p.excerpt,
      publishedAt: p.publishedAt,
      tenantName: p.tenant.name,
    }));
  } catch {
    isDemo = true;
    const tenantMap = Object.fromEntries(demoTenants.map((t) => [t.id, t.name]));
    postList = demoPosts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      excerpt: p.excerpt,
      publishedAt: p.publishedAt,
      tenantName: tenantMap[p.tenantId] ?? p.tenantId,
      isDemo: true,
    }));
  }

  const published = postList.filter((p) => p.status === "PUBLISHED").length;
  const draft = postList.filter((p) => p.status === "DRAFT").length;

  return (
    <div>
      <PageHeader
        title="Bài viết & nội dung"
        description="Quản lý bài viết và categories cho tất cả sites."
        action={
          <Link href="/admin/blog/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Viết bài
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Tổng bài viết", value: postList.length },
          { label: "Đã publish", value: published },
          { label: "Bản nháp", value: draft },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {postList.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="Chưa có bài viết nào"
            description="Viết bài đầu tiên để bắt đầu xây dựng nội dung."
            action={
              <Link href="/admin/blog/new">
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
                  <TableHeader>Site</TableHeader>
                  <TableHeader>Trạng thái</TableHeader>
                  <TableHeader>Ngày publish</TableHeader>
                  <TableHeader>Mô tả ngắn</TableHeader>
                  <TableHeader></TableHeader>
                </tr>
              </TableHead>
              <TableBody>
                {postList.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="font-medium text-slate-800">{p.title}</span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <code className="bg-slate-50 px-1 rounded">/blog/{p.slug}</code>
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{p.tenantName}</TableCell>
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
                      {!p.isDemo && (
                        <Link href={`/admin/blog/${p.id}`}>
                          <Button variant="outline" size="sm">Sửa</Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isDemo && (
        <p className="mt-4 text-xs text-slate-400 text-center">
          Dữ liệu demo · Kết nối database để sửa bài viết
        </p>
      )}
    </div>
  );
}
