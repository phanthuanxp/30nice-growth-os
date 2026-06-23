import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Tag, Clock, MessageSquare, Activity } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTenantById } from "@/server/queries/tenants";
import { getLeadById, getLeadTimeline } from "@/server/queries/leads";
import { SiteSidebar } from "@/components/admin/site-sidebar";
import { LeadDetailClient } from "./lead-detail-client";

interface Props {
  params: Promise<{ id: string; leadId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { leadId } = await params;
  const lead = await getLeadById(leadId).catch(() => null);
  return { title: lead ? `${lead.name} — Lead` : "Chi tiết lead" };
}

const STATUS_LABEL: Record<string, string> = {
  NEW: "Mới",
  CONTACTED: "Đã liên hệ",
  QUALIFIED: "Tiềm năng",
  WON: "Chốt được",
  LOST: "Thất bại",
};

const STATUS_VARIANT: Record<string, "info" | "warning" | "default" | "success" | "danger"> = {
  NEW: "info",
  CONTACTED: "warning",
  QUALIFIED: "default",
  WON: "success",
  LOST: "danger",
};

export default async function LeadDetailPage({ params }: Props) {
  const { id, leadId } = await params;
  const [tenant, lead] = await Promise.all([
    getTenantById(id).catch(() => null),
    getLeadById(leadId).catch(() => null),
  ]);

  if (!tenant || !lead || lead.tenant.name !== tenant.name) notFound();

  const timeline = await getLeadTimeline(leadId).catch(() => ({
    activities: [],
    notes: [],
    statuses: [],
  }));

  return (
    <div className="flex flex-1 overflow-hidden">
      <SiteSidebar
        siteId={id}
        siteName={tenant.name}
        siteSlug={tenant.slug}
        primaryDomain={tenant.primaryDomain}
      />
      <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title={lead.name}
            description={`Lead · ${new Date(lead.createdAt).toLocaleDateString("vi-VN")}`}
            action={
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[lead.status] ?? "neutral"}>
                  {STATUS_LABEL[lead.status] ?? lead.status}
                </Badge>
                <Link href={`/admin/sites/${id}/leads`}>
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4" /> Danh sách
                  </Button>
                </Link>
              </div>
            }
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: Info + Actions */}
            <div className="lg:col-span-1 space-y-4">
              {/* Contact info */}
              <Card className="p-4 space-y-3">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Thông tin liên hệ</h3>
                {lead.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <a href={`tel:${lead.phone}`} className="hover:text-indigo-600">{lead.phone}</a>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <a href={`mailto:${lead.email}`} className="hover:text-indigo-600">{lead.email}</a>
                  </div>
                )}
                {lead.message && (
                  <div className="flex items-start gap-2 text-sm text-slate-700">
                    <MessageSquare className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-slate-600 text-xs leading-relaxed">{lead.message}</p>
                  </div>
                )}
              </Card>

              {/* Source & UTM */}
              {(lead.sourcePath || lead.utmSource || lead.utmCampaign) && (
                <Card className="p-4 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nguồn traffic</h3>
                  {lead.sourcePath && (
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="font-mono break-all">{lead.sourcePath}</span>
                    </div>
                  )}
                  {lead.sourceType && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Tag className="h-3.5 w-3.5 shrink-0" />
                      <span>{lead.sourceType}</span>
                    </div>
                  )}
                  {(lead.utmSource || lead.utmMedium || lead.utmCampaign) && (
                    <div className="text-xs space-y-0.5 text-slate-500 pl-5">
                      {lead.utmSource && <p>Source: <span className="text-slate-700 font-medium">{lead.utmSource}</span></p>}
                      {lead.utmMedium && <p>Medium: <span className="text-slate-700 font-medium">{lead.utmMedium}</span></p>}
                      {lead.utmCampaign && <p>Campaign: <span className="text-slate-700 font-medium">{lead.utmCampaign}</span></p>}
                    </div>
                  )}
                </Card>
              )}

              {/* Timestamps */}
              <Card className="p-4 space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Thời gian</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>Tạo: {new Date(lead.createdAt).toLocaleString("vi-VN")}</span>
                </div>
                {lead.lastActivityAt && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Activity className="h-3.5 w-3.5 shrink-0" />
                    <span>Hoạt động cuối: {new Date(lead.lastActivityAt).toLocaleString("vi-VN")}</span>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Actions + Timeline */}
            <div className="lg:col-span-2">
              <LeadDetailClient
                leadId={leadId}
                tenantId={id}
                currentStatus={lead.status}
                notes={timeline.notes.map((n) => ({
                  id: n.id,
                  body: n.body,
                  createdAt: n.createdAt.toISOString(),
                }))}
                activities={timeline.activities.map((a) => ({
                  id: a.id,
                  type: a.type,
                  title: a.title,
                  detail: a.detail ?? null,
                  createdAt: a.createdAt.toISOString(),
                }))}
                statusHistory={timeline.statuses.map((s) => ({
                  id: s.id,
                  fromStatus: s.fromStatus ?? null,
                  toStatus: s.toStatus,
                  note: s.note ?? null,
                  createdAt: s.createdAt.toISOString(),
                }))}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
