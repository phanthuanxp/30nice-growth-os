import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, BookOpen, Users, Search, Settings, Plus, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTenantById } from "@/server/queries/tenants";
import { getPagesByTenant } from "@/server/queries/pages";
import { getPostsByTenant } from "@/server/queries/posts";
import { getLeads } from "@/server/queries/leads";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  return { title: tenant ? `${tenant.name} — Bảng điều khiển` : "Site" };
}

export default async function SiteDashboardPage({ params }: Props) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);

  if (!tenant) notFound();

  const [pages, posts, leads] = await Promise.allSettled([
    getPagesByTenant(id),
    getPostsByTenant(id),
    getLeads(id),
  ]);

  const pageList = pages.status === "fulfilled" ? pages.value : [];
  const postList = posts.status === "fulfilled" ? posts.value : [];
  const leadList = leads.status === "fulfilled" ? leads.value : [];

  const publishedPages = pageList.filter((p) => p.status === "PUBLISHED").length;
  const publishedPosts = postList.filter((p) => p.status === "PUBLISHED").length;
  const newLeads = leadList.filter((l) => l.status === "NEW").length;

  const stats = [
    {
      label: "Trang",
      value: pageList.length,
      sub: `${publishedPages} đã publish`,
      icon: FileText,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      href: `/admin/sites/${id}/pages`,
    },
    {
      label: "Bài viết",
      value: postList.length,
      sub: `${publishedPosts} đã publish`,
      icon: BookOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: `/admin/sites/${id}/blog`,
    },
    {
      label: "Lead",
      value: leadList.length,
      sub: `${newLeads} mới`,
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50",
      href: `/admin/sites/${id}/leads`,
    },
  ];

  const quickActions = [
    { label: "Tạo Page mới", href: `/admin/sites/${id}/pages/new`, icon: Plus },
    { label: "Viết bài mới", href: `/admin/sites/${id}/blog/new`, icon: Plus },
    { label: "Kiểm tra SEO", href: `/admin/sites/${id}/seo`, icon: Search },
    { label: "Cài đặt site", href: `/admin/sites/${id}/settings`, icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tenant.name}
        description={
          tenant.primaryDomain
            ? `${tenant.primaryDomain} · ${tenant.status}`
            : `${tenant.slug} · ${tenant.status}`
        }
        action={
          <Badge variant={tenant.status === "ACTIVE" ? "success" : "warning"}>
            {tenant.status}
          </Badge>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className={`h-11 w-11 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                <p className="text-xs text-slate-400">{s.sub}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Quick actions */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Thao tác nhanh</h3>
          <div className="space-y-2">
            {quickActions.map((a) => (
              <Link key={a.href} href={a.href}>
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors group">
                  <a.icon className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
                  <span className="text-sm text-slate-700 group-hover:text-indigo-700 flex-1">
                    {a.label}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-400" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent posts */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Bài viết gần đây</h3>
            <Link href={`/admin/sites/${id}/blog`}>
              <Button variant="ghost" size="sm" className="text-xs">
                Xem tất cả <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          {postList.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Chưa có bài viết</p>
          ) : (
            <div className="space-y-2">
              {postList.slice(0, 5).map((p) => (
                <Link key={p.id} href={`/admin/sites/${id}/blog/${p.id}`}>
                  <div className="flex items-start gap-2 rounded-lg px-2 py-2 hover:bg-slate-50 transition-colors">
                    <BookOpen className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 truncate">{p.title}</p>
                      <Badge
                        variant={p.status === "PUBLISHED" ? "success" : "warning"}
                        className="text-[10px] mt-0.5"
                      >
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
