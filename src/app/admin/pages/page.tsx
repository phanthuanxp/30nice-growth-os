import type { Metadata } from "next";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllPages } from "@/server/queries/pages";
import { pages as demoPages, tenants as demoTenants } from "@/server/queries/demo-data";

export const metadata: Metadata = { title: "Pages" };

const statusVariant = (s: string) =>
  s === "PUBLISHED" ? "success" as const : s === "DRAFT" ? "warning" as const : "neutral" as const;

const BLOCK_TYPES = ["hero", "feature-list", "rich-text", "image", "cta", "faq", "testimonials", "contact-form"];

export default async function PagesPage() {
  type PageRow = {
    id: string;
    title: string;
    slug: string;
    status: string;
    summary: string | null;
    tenantName: string;
    isDemo?: boolean;
  };

  let pageList: PageRow[] = [];
  let isDemo = false;

  try {
    const rows = await getAllPages();
    pageList = rows.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      summary: p.summary,
      tenantName: p.tenant.name,
    }));
  } catch {
    isDemo = true;
    const tenantMap = Object.fromEntries(demoTenants.map((t) => [t.id, t.name]));
    pageList = demoPages.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      summary: p.summary,
      tenantName: tenantMap[p.tenantId] ?? p.tenantId,
      isDemo: true,
    }));
  }

  return (
    <div>
      <PageHeader
        title="CMS Pages"
        description="Quản lý tất cả trang nội dung. Hỗ trợ các block: hero, features, rich-text, CTA, FAQ..."
        action={
          <Link href="/admin/pages/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Tạo Page
            </Button>
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <span className="text-xs text-slate-500 font-medium self-center">Block types:</span>
        {BLOCK_TYPES.map((b) => (
          <span key={b} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {b}
          </span>
        ))}
      </div>

      {pageList.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="Chưa có page nào"
            description="Tạo page đầu tiên cho website của bạn."
            action={
              <Link href="/admin/pages/new">
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
                <TableHeader>Site</TableHeader>
                <TableHeader>Slug</TableHeader>
                <TableHeader>Trạng thái</TableHeader>
                <TableHeader>Tóm tắt</TableHeader>
                <TableHeader></TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {pageList.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800">{p.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600">{p.tenantName}</span>
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
                    <div className="flex gap-2">
                      {!p.isDemo && (
                        <Link href={`/admin/pages/${p.id}`}>
                          <Button variant="outline" size="sm">Sửa</Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {isDemo && (
        <p className="mt-4 text-xs text-slate-400 text-center">Dữ liệu demo · Kết nối database để sửa pages</p>
      )}
    </div>
  );
}
