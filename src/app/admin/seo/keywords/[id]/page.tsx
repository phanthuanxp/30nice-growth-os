import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Brain, Layers, Upload } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSession } from "@/server/auth/session";
import { getKeywordProjectWithData } from "@/server/queries/keyword-projects";
import { KeywordImportForm } from "@/components/admin/keyword-import-form";
import { ClusterActions } from "@/components/admin/cluster-actions";
import { TravelKeywordGenerator } from "@/components/admin/travel-keyword-generator";
import { ClusterToSubdomainForm } from "@/components/admin/cluster-to-subdomain-form";

export const metadata: Metadata = { title: "Keyword Project" };

const INTENT_VARIANT: Record<string, "neutral" | "success" | "danger"> = {
  INFORMATIONAL: "neutral",
  NAVIGATIONAL: "neutral",
  COMMERCIAL: "success",
  TRANSACTIONAL: "danger",
};

const INTENT_LABEL: Record<string, string> = {
  INFORMATIONAL: "Info",
  NAVIGATIONAL: "Nav",
  COMMERCIAL: "Com",
  TRANSACTIONAL: "Trans",
  UNKNOWN: "?",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function KeywordProjectPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const project = await getKeywordProjectWithData(id, session.id).catch(() => null);
  if (!project) notFound();

  return (
    <div>
      <PageHeader
        title={project.name}
        description={
          project.description ??
          `${project.keywords.length} từ khóa · ${project.clusters.length} clusters · ${project.language}/${project.country}`
        }
        action={
          <Link href="/admin/seo/keywords">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Projects
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Từ khóa</p>
          <p className="text-2xl font-bold">{project.keywords.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Clusters</p>
          <p className="text-2xl font-bold text-emerald-600">{project.clusters.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Ngôn ngữ / Niche</p>
          <p className="text-sm font-semibold text-slate-700">
            {project.language}/{project.country}{project.niche ? ` · ${project.niche}` : ""}
          </p>
        </Card>
      </div>

      <TravelKeywordGenerator projectId={id} defaultNiche={project.niche} />

      {/* AI Actions */}
      <ClusterActions projectId={id} keywordCount={project.keywords.length} />
      <ClusterToSubdomainForm projectId={id} clusterCount={project.clusters.length} />

      {/* Import keywords */}
      <Card className="p-4 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Upload className="h-4 w-4" /> Import từ khóa
        </h2>
        <KeywordImportForm projectId={id} />
      </Card>

      {/* Clusters */}
      {project.clusters.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4" /> Clusters ({project.clusters.length})
          </h2>
          <div className="grid gap-3">
            {project.clusters.map((cluster) => (
              <Card key={cluster.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-medium text-slate-800">{cluster.name}</h3>
                    {cluster.headKeyword && (
                      <p className="text-xs text-indigo-600 mt-0.5">Pillar: {cluster.headKeyword}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400">{cluster.members.length} từ khóa</span>
                    {cluster.totalVolume > 0 && (
                      <p className="text-xs text-slate-500">Vol: {cluster.totalVolume.toLocaleString()}</p>
                    )}
                  </div>
                </div>
                {cluster.assignedTenant && (
                  <p className="text-xs text-emerald-600 mb-2">Site: {cluster.assignedTenant.name}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {cluster.members.map((m) => (
                    <span
                      key={m.id}
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        m.isPrimary
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
                          : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      {m.keyword.text}
                      {m.keyword.searchVolume ? ` (${m.keyword.searchVolume.toLocaleString()})` : ""}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Keywords table */}
      {project.keywords.length > 0 && (
        <Card>
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">
              Danh sách từ khóa ({project.keywords.length})
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Từ khóa</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>CPC</TableHead>
                <TableHead>Intent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.keywords.slice(0, 200).map((kw) => (
                <TableRow key={kw.id}>
                  <TableCell className="font-medium text-slate-700">{kw.text}</TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {kw.searchVolume?.toLocaleString() ?? "—"}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {kw.cpc != null ? `$${Number(kw.cpc).toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell>
                    {kw.intent && kw.intent !== "UNKNOWN" ? (
                      <Badge variant={INTENT_VARIANT[kw.intent] ?? "neutral"}>
                        {INTENT_LABEL[kw.intent] ?? kw.intent}
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {project.keywords.length > 200 && (
            <p className="text-xs text-slate-400 text-center py-2">
              Hiển thị 200/{project.keywords.length} từ khóa
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
