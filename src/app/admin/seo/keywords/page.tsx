import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, Plus, FolderOpen, Layers } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/auth/session";
import { listKeywordProjects } from "@/server/queries/keyword-projects";

export const metadata: Metadata = { title: "SEO Keyword Engine" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang chạy",
  ARCHIVED: "Lưu trữ",
};

const STATUS_VARIANT: Record<string, "neutral" | "success" | "danger"> = {
  DRAFT: "neutral",
  ACTIVE: "success",
  ARCHIVED: "danger",
};

export default async function KeywordProjectsPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/admin/seo/keywords");

  const projects = await listKeywordProjects(session.id).catch(() => []);

  const totalKeywords = projects.reduce((s, p) => s + p._count.keywords, 0);
  const totalClusters = projects.reduce((s, p) => s + p._count.clusters, 0);

  return (
    <div>
      <PageHeader
        title="SEO Keyword Engine"
        description="Quản lý từ khóa, phân tích intent và nhóm cluster cho chiến dịch SEO."
        action={
          <Link href="/admin/seo/keywords/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Tạo project
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Projects" value={projects.length} icon={FolderOpen} />
        <StatCard title="Từ khóa" value={totalKeywords} icon={Search} iconColor="text-blue-600" />
        <StatCard title="Clusters" value={totalClusters} icon={Layers} iconColor="text-emerald-600" />
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Chưa có keyword project nào"
          description="Tạo project đầu tiên để bắt đầu nghiên cứu từ khóa và xây dựng cluster."
          action={
            <Link href="/admin/seo/keywords/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Tạo project đầu tiên
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {projects.map((p) => (
            <Link key={p.id} href={`/admin/seo/keywords/${p.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800 truncate">{p.name}</h3>
                      <Badge variant={STATUS_VARIANT[p.status] ?? "neutral"}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </Badge>
                    </div>
                    {p.description && (
                      <p className="text-sm text-slate-500 line-clamp-1">{p.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                      {p.niche && <span>Niche: {p.niche}</span>}
                      <span>{p.language}/{p.country}</span>
                      <span>Cập nhật {p.updatedAt.toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 shrink-0 text-right">
                    <div>
                      <p className="text-lg font-bold text-slate-800">{p._count.keywords}</p>
                      <p className="text-xs text-slate-400">từ khóa</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-emerald-600">{p._count.clusters}</p>
                      <p className="text-xs text-slate-400">clusters</p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
