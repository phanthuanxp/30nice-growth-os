import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PostForm } from "@/components/admin/post-form";
import { getTenantById } from "@/server/queries/tenants";
import { getCategoriesByTenant } from "@/server/queries/posts";
import { createPostAction, createCategoryAction, deleteCategoryAction } from "@/server/actions/posts";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Viết Bài Mới" };

export default async function SiteNewPostPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  const categories = await getCategoriesByTenant(id).catch(() => []);
  const boundCreateCategory = createCategoryAction.bind(null, id);

  return (
    <div>
      <PageHeader
        title="Viết Bài Mới"
        description={`Tạo bài viết mới cho ${tenant.name}.`}
      />
      <Card>
        <CardContent className="pt-6">
          <PostForm
            action={createPostAction}
            createCategoryAction={boundCreateCategory}
            deleteCategoryAction={deleteCategoryAction}
            tenants={[{ id: tenant.id, name: tenant.name }]}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            initialData={{ tenantId: tenant.id }}
            isNew
            returnTo={`/admin/sites/${id}/blog`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
