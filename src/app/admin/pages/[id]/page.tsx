import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageForm } from "@/components/admin/page-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { getPageById } from "@/server/queries/pages";
import { updatePageAction, deletePageAction } from "@/server/actions/pages";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const page = await getPageById(id).catch(() => null);
  return { title: page ? `Sửa: ${page.title}` : "Page không tìm thấy" };
}

export default async function EditPagePage({ params }: Props) {
  const { id } = await params;
  const page = await getPageById(id).catch(() => null);

  if (!page) notFound();

  const updateAction = updatePageAction.bind(null, id);
  const deleteAction = deletePageAction.bind(null, id);

  return (
    <div>
      <PageHeader
        title={`Sửa: ${page.title}`}
        description={`/${page.slug || ""} · ${page.status}`}
        action={
          <div className="flex gap-2">
            <Link href="/admin/pages">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </Link>
            <DeleteButton onDelete={deleteAction} label="Xóa page" />
          </div>
        }
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
          />
        </CardContent>
      </Card>
    </div>
  );
}
