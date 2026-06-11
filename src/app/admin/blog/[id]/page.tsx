import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostForm } from "@/components/admin/post-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { getPostById, getCategoriesByTenant } from "@/server/queries/posts";
import { updatePostAction, deletePostAction, createCategoryAction, deleteCategoryAction } from "@/server/actions/posts";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id).catch(() => null);
  return { title: post ? `Sửa: ${post.title}` : "Bài viết không tìm thấy" };
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(id).catch(() => null);

  if (!post) notFound();

  const categories = await getCategoriesByTenant(post.tenantId).catch(() => []);

  const updateAction = updatePostAction.bind(null, id);
  const deleteAction = deletePostAction.bind(null, id);
  const boundCreateCategory = createCategoryAction.bind(null, post.tenantId);

  return (
    <div>
      <PageHeader
        title={`Sửa: ${post.title}`}
        description={`/blog/${post.slug} · ${post.status}`}
        action={
          <div className="flex gap-2">
            <Link href="/admin/blog">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </Link>
            <DeleteButton onDelete={deleteAction} label="Xóa bài" />
          </div>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <PostForm
            action={updateAction}
            createCategoryAction={boundCreateCategory}
            deleteCategoryAction={deleteCategoryAction}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            initialData={{
              tenantId: post.tenantId,
              title: post.title,
              slug: post.slug,
              status: post.status,
              excerpt: post.excerpt,
              content: post.content,
              featuredImage: post.featuredImage,
              seoTitle: post.seoTitle,
              seoDescription: post.seoDescription,
              categoryId: post.categoryId,
              publishedAt: post.publishedAt,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
