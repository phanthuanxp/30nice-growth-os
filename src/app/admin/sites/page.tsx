import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ExternalLink, Globe, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTenants } from "@/server/queries/tenants";
import { tenants as demoTenants } from "@/server/queries/demo-data";

export const metadata: Metadata = { title: "Sites" };

function statusVariant(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "PAUSED") return "warning" as const;
  return "neutral" as const;
}

export default async function SitesPage() {
  type TenantRow = {
    id: string;
    name: string;
    slug: string;
    primaryDomain: string | null;
    status: string;
    _count: { pages: number; posts: number };
  };

  let tenantList: TenantRow[] = [];
  let isDemo = false;

  try {
    const rows = await getTenants();
    tenantList = rows.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      primaryDomain: t.primaryDomain,
      status: t.status,
      _count: { pages: t._count.pages, posts: t._count.posts },
    }));
  } catch {
    isDemo = true;
    tenantList = demoTenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      primaryDomain: t.primaryDomain,
      status: t.status,
      _count: { pages: t.pages, posts: t.posts },
    }));
  }

  const active = tenantList.filter((t) => t.status === "ACTIVE").length;
  const totalPosts = tenantList.reduce((s, t) => s + t._count.posts, 0);

  return (
    <div>
      <PageHeader
        title="Site / Tenant"
        description="Quản lý tất cả website và tenant trong hệ thống."
        action={
          <Link href="/admin/sites/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Thêm Site
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Tổng sites", value: tenantList.length, color: "text-indigo-600" },
          { label: "Đang hoạt động", value: active, color: "text-emerald-600" },
          { label: "Tổng bài viết", value: totalPosts, color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {tenantList.length === 0 ? (
        <Card>
          <EmptyState
            icon={Globe}
            title="Chưa có site nào"
            description="Tạo site đầu tiên để bắt đầu quản lý nội dung."
            action={
              <Link href="/admin/sites/new">
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Thêm Site
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
                <TableHeader>Site</TableHeader>
                <TableHeader>Domain chính</TableHeader>
                <TableHeader>Trang</TableHeader>
                <TableHeader>Bài viết</TableHeader>
                <TableHeader>Trạng thái</TableHeader>
                <TableHeader></TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {tenantList.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)" }}
                      >
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{t.name}</p>
                        <p className="text-xs text-slate-400">{t.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Globe className="h-3.5 w-3.5 text-slate-400" />
                      {t.primaryDomain ?? <span className="text-slate-400">—</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-700">{t._count.pages}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-slate-700">{t._count.posts}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      {!isDemo && (
                        <Link href={`/admin/sites/${t.id}`}>
                          <Button size="sm" className="gap-1.5">
                            Quản lý
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                      {t.primaryDomain && (
                        <a href={`https://${t.primaryDomain}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" title="Xem live site">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </a>
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
        <p className="mt-4 text-xs text-slate-400 text-center">
          Dữ liệu demo · Kết nối database để hiển thị dữ liệu thật
        </p>
      )}
    </div>
  );
}
