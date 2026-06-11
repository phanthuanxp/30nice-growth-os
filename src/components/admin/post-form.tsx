"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RichEditor } from "@/components/admin/rich-editor";
import { SeoPanel } from "@/components/admin/seo-panel";
import { ImagePicker } from "@/components/admin/image-picker";
import type { PostFormState, CategoryActionState } from "@/server/actions/posts";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Lưu bài viết
    </Button>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface Tenant { id: string; name: string }
interface Category { id: string; name: string }

interface PostFormProps {
  action: (prev: PostFormState, formData: FormData) => Promise<PostFormState>;
  createCategoryAction?: (prev: CategoryActionState, formData: FormData) => Promise<CategoryActionState>;
  deleteCategoryAction?: (id: string) => Promise<{ error?: string }>;
  tenants?: Tenant[];
  categories?: Category[];
  tenantId?: string;
  initialData?: {
    tenantId?: string | null;
    title?: string | null;
    slug?: string | null;
    status?: string;
    excerpt?: string | null;
    content?: string | null;
    featuredImage?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
    ogImage?: string | null;
    twitterCard?: string | null;
    schemaType?: string | null;
    schemaData?: string | null;
    robotsMeta?: string | null;
    canonicalUrl?: string | null;
    categoryId?: string | null;
    publishedAt?: Date | string | null;
  };
  isNew?: boolean;
  returnTo?: string;
}

export function PostForm({
  action,
  createCategoryAction,
  deleteCategoryAction,
  tenants = [],
  categories: initialCategories = [],
  tenantId: propTenantId,
  initialData = {},
  isNew,
  returnTo = "/admin/blog",
}: PostFormProps) {
  const [state, formAction] = useActionState(action, {});
  const router = useRouter();

  const [title, setTitle] = useState(initialData.title ?? "");
  const [slug, setSlug] = useState(initialData.slug ?? "");
  const [slugManual, setSlugManual] = useState(!isNew);
  const [status, setStatus] = useState(initialData.status ?? "DRAFT");
  const [excerpt, setExcerpt] = useState(initialData.excerpt ?? "");
  const [seoTitle, setSeoTitle] = useState(initialData.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initialData.seoDescription ?? "");
  const [contentHtml, setContentHtml] = useState(initialData.content ?? "");
  const [featuredImage, setFeaturedImage] = useState(initialData.featuredImage ?? "");

  // Extended SEO state
  const [ogTitle, setOgTitle] = useState(initialData.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(initialData.ogDescription ?? "");
  const [ogImage, setOgImage] = useState(initialData.ogImage ?? "");
  const [twitterCard, setTwitterCard] = useState(initialData.twitterCard ?? "summary_large_image");
  const [schemaType, setSchemaType] = useState(initialData.schemaType ?? "Article");
  const [schemaData, setSchemaData] = useState(initialData.schemaData ?? "{}");
  const [robotsMeta, setRobotsMeta] = useState(initialData.robotsMeta ?? "index,follow");
  const [canonicalUrl, setCanonicalUrl] = useState(initialData.canonicalUrl ?? "");

  // Category management state
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catState, catFormAction] = useActionState<CategoryActionState, FormData>(
    createCategoryAction ?? (async () => ({})),
    {}
  );
  const [_catPending, startCatTransition] = useTransition();
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) router.push(returnTo);
  }, [state.success, router, returnTo]);

  useEffect(() => {
    if (catState.success && catState.id) setShowCatForm(false);
  }, [catState.success, catState.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (!slugManual) setSlug(slugify(e.target.value));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManual(true);
    setSlug(e.target.value);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!deleteCategoryAction) return;
    setDeletingCatId(id);
    const result = await deleteCategoryAction(id);
    if (!result.error) setCategories((prev) => prev.filter((c) => c.id !== id));
    setDeletingCatId(null);
  };

  const fe = state.fieldErrors ?? {};

  const defaultPublishedAt = initialData.publishedAt
    ? new Date(initialData.publishedAt).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16);

  return (
    <div className="grid grid-cols-4 gap-6">
      {/* ── Main editor column (3/4 width) ── */}
      <div className="col-span-3 space-y-5">
        <form action={formAction} id="post-form">
          {state.error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 mb-4">
              Đã lưu thành công!
            </div>
          )}

          {isNew && tenants.length > 0 && (
            <Select label="Site *" name="tenantId" defaultValue={initialData.tenantId ?? ""}
              options={[{ value: "", label: "-- Chọn site --" }, ...tenants.map((t) => ({ value: t.id, label: t.name }))]} />
          )}
          {!isNew && initialData.tenantId && (
            <input type="hidden" name="tenantId" value={initialData.tenantId} />
          )}

          <Input label="Tiêu đề *" name="title" value={title} onChange={handleTitleChange}
            error={fe.title?.[0]} placeholder="Tiêu đề bài viết" required className="text-lg font-medium" />

          <div>
            <Input label="Slug (URL)" name="slug" value={slug} onChange={handleSlugChange}
              error={fe.slug?.[0]} placeholder="slug-bai-viet" />
            {!slugManual && <p className="text-[11px] text-slate-400 mt-0.5">Tự động tạo từ tiêu đề</p>}
          </div>

          <Textarea label="Tóm tắt (excerpt)" name="excerpt" value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Mô tả ngắn hiển thị ngoài danh sách..." rows={2} />

          <RichEditor name="content" label="Nội dung bài viết"
            defaultValue={initialData.content ?? ""}
            placeholder="Bắt đầu viết nội dung bài viết của bạn..."
            minHeight={500}
            tenantId={propTenantId ?? initialData.tenantId ?? ""}
            onChange={setContentHtml} />

          {/* SEO Title/Description */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">SEO</p>
            <Input label={`SEO Title (${seoTitle.length}/60)`} name="seoTitle"
              value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Tiêu đề SEO (tối đa 60 ký tự)" />
            <Textarea label={`SEO Description (${seoDescription.length}/155)`} name="seoDescription"
              value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Mô tả SEO (tối đa 155 ký tự)" rows={2} />
          </div>

          {/* Hidden inputs for extended SEO fields */}
          <input type="hidden" name="ogTitle" value={ogTitle} />
          <input type="hidden" name="ogDescription" value={ogDescription} />
          <input type="hidden" name="ogImage" value={ogImage} />
          <input type="hidden" name="twitterCard" value={twitterCard} />
          <input type="hidden" name="schemaType" value={schemaType} />
          <input type="hidden" name="schemaData" value={schemaData} />
          <input type="hidden" name="robotsMeta" value={robotsMeta} />
          <input type="hidden" name="canonicalUrl" value={canonicalUrl} />
        </form>

        {/* SEO AI Engine — below the editor */}
        <SeoPanel
          title={title}
          slug={slug}
          content={contentHtml}
          excerpt={excerpt}
          seoTitle={seoTitle}
          seoDescription={seoDescription}
          showExcerpt
          tenantId={propTenantId ?? initialData.tenantId ?? ""}
          ogTitle={ogTitle}
          ogDescription={ogDescription}
          ogImage={ogImage}
          twitterCard={twitterCard}
          schemaType={schemaType}
          schemaData={schemaData}
          robotsMeta={robotsMeta}
          canonicalUrl={canonicalUrl}
          onApply={(data) => {
            if (data.seoTitle !== undefined) setSeoTitle(data.seoTitle);
            if (data.seoDescription !== undefined) setSeoDescription(data.seoDescription);
            if (data.excerpt !== undefined) setExcerpt(data.excerpt);
            if (data.ogTitle !== undefined) setOgTitle(data.ogTitle);
            if (data.ogDescription !== undefined) setOgDescription(data.ogDescription);
            if (data.ogImage !== undefined) setOgImage(data.ogImage);
            if (data.twitterCard !== undefined) setTwitterCard(data.twitterCard);
            if (data.schemaType !== undefined) setSchemaType(data.schemaType);
            if (data.schemaData !== undefined) setSchemaData(data.schemaData);
            if (data.robotsMeta !== undefined) setRobotsMeta(data.robotsMeta);
            if (data.canonicalUrl !== undefined) setCanonicalUrl(data.canonicalUrl);
          }}
        />
      </div>

      {/* ── Sidebar column (1/4 width) ── */}
      <div className="space-y-4">
        {/* Publish settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Xuất bản</p>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Trạng thái</label>
            <select name="status" form="post-form" value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISHED">Publish ngay</option>
              <option value="ARCHIVED">Lưu trữ</option>
            </select>
          </div>
          {status === "PUBLISHED" && (
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Ngày publish</label>
              <input type="datetime-local" name="publishedAt" form="post-form"
                defaultValue={defaultPublishedAt}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <p className="text-[11px] text-slate-400 mt-0.5">Đặt thời gian tương lai để lên lịch</p>
            </div>
          )}
          <div className="pt-1 flex flex-col gap-2">
            <SubmitButton />
            <Button type="button" variant="outline" onClick={() => router.push(returnTo)}>Hủy</Button>
          </div>
        </div>

        {/* Featured image */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Ảnh đại diện</p>
          <input type="hidden" name="featuredImage" form="post-form" value={featuredImage} />
          <ImagePicker
            tenantId={propTenantId ?? initialData.tenantId ?? ""}
            value={featuredImage}
            onChange={setFeaturedImage}
            aspectHint="16:9 hoặc 1200×630px"
          />
          {fe.featuredImage?.[0] && (
            <p className="text-xs text-red-500">{fe.featuredImage[0]}</p>
          )}
        </div>

        {/* Category manager */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1">
              <Tag className="h-3 w-3" />Danh mục
            </p>
            {createCategoryAction && (
              <button type="button" onClick={() => setShowCatForm(!showCatForm)}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5">
                <Plus className="h-3 w-3" />Thêm
              </button>
            )}
          </div>
          {showCatForm && createCategoryAction && (
            <form action={catFormAction} className="flex gap-1.5 items-center"
              onSubmit={() => startCatTransition(() => {})}>
              <input type="text" name="name" placeholder="Tên danh mục"
                className="h-7 flex-1 rounded-lg border border-slate-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" autoFocus />
              <button type="submit" className="h-7 px-2 bg-indigo-600 text-white rounded-lg text-xs">Tạo</button>
            </form>
          )}
          {catState.error && <p className="text-xs text-red-500">{catState.error}</p>}
          <div className="space-y-1.5">
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có danh mục</p>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Chọn danh mục</label>
                  <select name="categoryId" form="post-form" defaultValue={initialData.categoryId ?? ""}
                    className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">-- Không có --</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {categories.map((c) => (
                    <div key={c.id} className="flex items-center gap-0.5">
                      <Badge variant="neutral" className="text-[10px]">{c.name}</Badge>
                      {deleteCategoryAction && (
                        <button type="button" onClick={() => handleDeleteCategory(c.id)}
                          disabled={deletingCatId === c.id}
                          className="text-slate-300 hover:text-red-400 transition-colors disabled:opacity-50" title="Xóa danh mục">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
