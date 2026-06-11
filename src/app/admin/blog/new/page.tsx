import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostForm } from "@/components/admin/post-form";
import { getTenants } from "@/server/queries/tenants";
import { getCategoriesByTenant } from "@/server/queries/posts";
import { createPostAction, createCategoryAction, deleteCategoryAction } from "@/server/actions/posts";

export const metadata: Metadata = { title: "Viết Bài Mới" };

interface Props {
  searchParams: Promise<{ tenant?: string }>;
}

export default async function NewPostPage({ searchParams }: Props) {
  const { tenant: selectedTenantId } = await searchParams;

  let tenants: { id: string; name: string }[] = [];
  let categories: { id: string; name: string }[] = [];
  let dbError = false;

  try {
    const rows = await getTenants();
    tenants = rows.map((t) => ({ id: t.id, name: t.name }));
  } catch {
    dbError = true;
  }

  const tenantId = selectedTenantId ?? tenants[0]?.id;
  if (tenantId) {
    try {
      const cats = await getCategoriesByTenant(tenantId);
      categories = cats.map((c) => ({ id: c.id, name: c.name }));
    } catch {
      // ignore
    }
  }

  const boundCreateCategory = tenantId
    ? createCategoryAction.bind(null, tenantId)
    : undefined;

  return (
    <div>
      <PageHeader
        title="Viết Bài Mới"
        description="Tạo bài viết mới cho website."
        action={
          <Link href="/admin/blog">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="pt-6">
          {dbError ? (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              Không thể kết nối database. Vui lòng kiểm tra cấu hình DATABASE_URL.
            </div>
          ) : tenants.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Globe className="h-12 w-12 text-slate-300" />
              <div>
                <p className="font-semibold text-slate-700">Chưa có site nào</p>
                <p className="text-sm text-slate-500 mt-1">
                  Bạn cần tạo ít nhất một site trước khi viết bài.
                </p>
              </div>
              <Link href="/admin/sites/new">
                <Button size="sm">Tạo site ngay</Button>
              </Link>
            </div>
          ) : (
            <PostForm
              action={createPostAction}
              createCategoryAction={boundCreateCategory}
              deleteCategoryAction={deleteCategoryAction}
              tenants={tenants}
              categories={categories}
              isNew
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
