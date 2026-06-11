import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PageForm } from "@/components/admin/page-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { getPageById } from "@/server/queries/pages";
import { updatePageAction, deleteSitePageAction } from "@/server/actions/pages";

interface Props {
  params: Promise<{ id: string; pageId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pageId } = await params;
  const page = await getPageById(pageId).catch(() => null);
  return { title: page ? `Sửa: ${page.title}` : "Page không tìm thấy" };
}

export default async function SiteEditPagePage({ params }: Props) {
  const { id, pageId } = await params;
  const page = await getPageById(pageId).catch(() => null);

  if (!page || page.tenantId !== id) notFound();

  const updateAction = updatePageAction.bind(null, pageId);
  const deleteAction = deleteSitePageAction.bind(null, id, pageId);

  return (
    <div>
      <PageHeader
        title={`Sửa: ${page.title}`}
        description={`/${page.slug || ""} · ${page.status}`}
        action={<DeleteButton onDelete={deleteAction} label="Xóa page" />}
      />
      <Card>
        <CardContent className="pt-6">
          <PageForm
            action={updateAction}
            initialData={{
              tenantId: page.tenantId,
              title: page.title,
              slug: page.slug,
              status: page.status,
              summary: page.summary,
              seoTitle: page.seoTitle,
              seoDescription: page.seoDescription,
            }}
            returnTo={`/admin/sites/${id}/pages`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
