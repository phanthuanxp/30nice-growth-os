import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PostForm } from "@/components/admin/post-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { PostSeoAuditCard } from "@/components/admin/post-seo-audit";
import { getPostById, getCategoriesByTenant } from "@/server/queries/posts";
import { updatePostAction, deleteSitePostAction, createCategoryAction, deleteCategoryAction } from "@/server/actions/posts";

interface Props {
  params: Promise<{ id: string; postId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostById(postId).catch(() => null);
  return { title: post ? `Sửa: ${post.title}` : "Bài viết không tìm thấy" };
}

export default async function SiteEditPostPage({ params }: Props) {
  const { id, postId } = await params;
  const post = await getPostById(postId).catch(() => null);

  if (!post || post.tenantId !== id) notFound();

  const categories = await getCategoriesByTenant(id).catch(() => []);

  const updateAction = updatePostAction.bind(null, postId);
  const deleteAction = deleteSitePostAction.bind(null, id, postId);
  const boundCreateCategory = createCategoryAction.bind(null, id);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Sửa: ${post.title}`}
        description={`/blog/${post.slug} · ${post.status}`}
        action={<DeleteButton onDelete={deleteAction} label="Xóa bài" />}
      />

      <PostSeoAuditCard
        title={post.title}
        content={post.content ?? ""}
        seoTitle={post.seoTitle}
        seoDescription={post.seoDescription}
        excerpt={post.excerpt}
        seoScore={post.seoScore}
        qualityScore={post.qualityScore}
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
            returnTo={`/admin/sites/${id}/blog`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
