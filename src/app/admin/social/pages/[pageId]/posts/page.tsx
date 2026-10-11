import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, FileText, ImageIcon, Video } from "lucide-react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DuplicateExternalPostButton, SyncMetaPostsButton } from "@/components/admin/social-post-actions";
import { getSocialPageWithExternalPosts } from "@/server/queries/social";
import { META_PUBLISH_SCOPES } from "@/server/meta/client";

export const metadata: Metadata = { title: "Facebook Page Posts" };

type MediaShape = { data?: Array<{ media?: { image?: { src?: string } }; type?: string; url?: string }> };

function thumb(media: unknown) {
  const parsed = media && typeof media === "object" ? media as MediaShape : null;
  return parsed?.data?.find((item) => item.media?.image?.src)?.media?.image?.src ?? null;
}

function icon(type?: string | null) {
  if (type?.includes("VIDEO") || type?.includes("REEL")) return Video;
  if (type?.includes("PHOTO") || type?.includes("IMAGE")) return ImageIcon;
  return FileText;
}

export default async function SocialPagePostsPage({ params, searchParams }: { params: Promise<{ pageId: string }>; searchParams: Promise<{ filter?: string }> }) {
  const [{ pageId }, { filter }] = await Promise.all([params, searchParams]);
  const data = await getSocialPageWithExternalPosts(pageId, filter);
  if (!data) notFound();
  const { page, posts } = data;
  const meta = page.launchKit && typeof page.launchKit === "object" && !Array.isArray(page.launchKit) ? (page.launchKit as { meta?: { avatarUrl?: string; postsLastSyncedAt?: string; webhookStatus?: string; tokenHealth?: string } }).meta : undefined;
  const missingPublishScopes = META_PUBLISH_SCOPES.filter((scope) => !page.connection?.grantedScopes.includes(scope));
  return (
    <div className="space-y-6">
      <PageHeader title="Facebook Page Posts" description="Đọc, đồng bộ và phân tích các bài viết đã có trên Facebook Page. Không publish/delete/edit bài Facebook trong Phase D." />
      <Card>
        <CardContent className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {meta?.avatarUrl ? <Image src={meta.avatarUrl} alt="" width={56} height={56} className="rounded-2xl object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><FileText className="h-6 w-6" /></div>}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-slate-900">{page.name}</h2>
              <p className="truncate text-xs text-slate-500">Page ID {page.externalPageId} · {page.workspace.tenant.name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5"><Badge variant="success">Posts Read/Sync</Badge><Badge variant={missingPublishScopes.length ? "warning" : "success"}>{missingPublishScopes.length ? "Publishing unavailable" : "Publishing available"}</Badge><Badge variant={meta?.webhookStatus === "ACTIVE" ? "success" : "warning"}>Webhook {meta?.webhookStatus || "UNKNOWN"}</Badge></div>
            </div>
          </div>
          <SyncMetaPostsButton pageId={page.id} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle><CardDescription>Newest mặc định; filter theo loại khi Meta trả đủ dữ liệu.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-2">{["newest", "text", "image", "video", "reel"].map((item) => <Link key={item} href={`/admin/social/pages/${page.id}/posts?filter=${item}`} className={`rounded-full px-3 py-1 text-xs font-medium ${filter === item || (!filter && item === "newest") ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>{item}</Link>)}</CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {posts.length === 0 ? <Card className="xl:col-span-2"><CardContent className="py-10 text-center text-sm text-slate-500">Chưa có bài viết đã sync. Bấm Sync Facebook posts để lấy recent posts.</CardContent></Card> : posts.map((post) => {
          const Icon = icon(post.postType);
          const image = thumb(post.mediaJson);
          return <Card key={post.id} className="overflow-hidden"><CardContent className="grid gap-4 p-4 sm:grid-cols-[140px_1fr]">
            <div className="flex h-32 items-center justify-center overflow-hidden rounded-xl bg-slate-100">{image ? <Image src={image} alt="" width={220} height={160} className="h-full w-full object-cover" /> : <Icon className="h-7 w-7 text-slate-400" />}</div>
            <div className="min-w-0 space-y-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="info">{post.postType || "UNKNOWN"}</Badge><Badge variant="neutral">META</Badge><span className="text-xs text-slate-400">Synced {post.syncedAt.toLocaleString("vi-VN")}</span></div><p className="line-clamp-4 text-sm text-slate-700">{post.message || "(Meta không trả message cho bài này)"}</p><p className="text-xs text-slate-500">Created {post.createdTime?.toLocaleString("vi-VN") || "Unknown"}</p><div className="flex flex-wrap gap-2">{post.permalinkUrl && <Link href={post.permalinkUrl} target="_blank" className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700"><ExternalLink className="h-3 w-3" />View on Facebook</Link>}<Link href={`/admin/social/analytics?pageId=${page.id}`} className="rounded-md bg-purple-50 px-2 py-1 text-[11px] font-medium text-purple-700">Analyze</Link><DuplicateExternalPostButton postId={post.id} /></div></div>
          </CardContent></Card>;
        })}
      </div>
    </div>
  );
}
