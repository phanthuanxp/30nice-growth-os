import { notFound, redirect } from "next/navigation";
import { resolveTenant } from "@/server/tenant/resolve";
import { getPageBySlug } from "@/server/queries/pages";
import { pages as demoPages } from "@/server/queries/demo-data";
import { PageRenderer } from "@/components/public/page-renderer";
import { TaxiPage } from "@/components/themes/taxi/taxi-page";
import { prisma } from "@/server/db";
import type { Metadata } from "next";
import type { TaxiThemeConfig } from "@/components/themes/taxi/types";

interface Props {
  params: Promise<{ slug?: string[] }>;
}

async function getSiteSettings(tenantId: string) {
  try {
    return await prisma.siteSettings.findUnique({ where: { tenantId } });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: slugParts } = await params;
  const slug = (slugParts ?? []).join("/");
  const tenant = await resolveTenant();

  if (!slug) {
    const settings = await getSiteSettings(tenant.id);
    return {
      title: settings?.defaultSeoTitle ?? tenant.name,
      description: settings?.defaultSeoDescription ?? undefined,
    };
  }

  let page = null;
  try {
    page = await getPageBySlug(tenant.id, slug);
  } catch {
    page = demoPages.find((p) => p.tenantId === tenant.id && p.slug === slug) ?? null;
  }

  if (!page) return {};
  return {
    title: page.title,
    description: page.summary ?? undefined,
  };
}

export default async function PublicPage({ params }: Props) {
  const { slug: slugParts } = await params;
  const slug = (slugParts ?? []).join("/");

  if (
    slug.startsWith("admin") ||
    slug.startsWith("api") ||
    slug.startsWith("blog") ||
    slug.startsWith("uploads") ||
    slug === "login"
  ) {
    notFound();
  }

  const tenant = await resolveTenant();
  const settings = await getSiteSettings(tenant.id);

  // Homepage — check theme
  if (!slug) {
    const theme = settings?.theme ?? "default";

    if (theme === "taxi") {
      return (
        <TaxiPage
          siteName={tenant.name}
          logoUrl={settings?.logoUrl}
          email={settings?.email}
          address={settings?.address}
          themeConfig={settings?.themeConfig as Partial<TaxiThemeConfig> | null}
        />
      );
    }

    // Default: redirect to admin dashboard
    redirect("/admin/dashboard");
  }

  // Inner page
  let page = null;
  try {
    page = await getPageBySlug(tenant.id, slug);
  } catch {
    page = demoPages.find((p) => p.tenantId === tenant.id && p.slug === slug) ?? null;
  }

  if (!page || page.status !== "PUBLISHED") notFound();

  const blocks = Array.isArray((page as { uiBlocks?: unknown }).uiBlocks)
    ? (page as { uiBlocks: unknown[] }).uiBlocks
    : [
        {
          type: "hero",
          headline: page.title,
          subheadline: page.summary ?? "",
          ctaLabel: "Liên hệ ngay",
          ctaHref: "/lien-he",
        },
      ];

  // Wrap inner pages with taxi layout if theme is taxi
  if (settings?.theme === "taxi") {
    const { TaxiHeader } = await import("@/components/themes/taxi/taxi-header");
    const { TaxiFooter } = await import("@/components/themes/taxi/taxi-footer");
    const { DEFAULT_TAXI_CONFIG } = await import("@/components/themes/taxi/types");
    const config = { ...DEFAULT_TAXI_CONFIG, ...(settings.themeConfig as Partial<TaxiThemeConfig> | null) };

    return (
      <div className="min-h-screen bg-white">
        <TaxiHeader config={config} siteName={tenant.name} logoUrl={settings.logoUrl} />
        <main className="pt-16">
          <PageRenderer blocks={blocks} />
        </main>
        <TaxiFooter config={config} siteName={tenant.name} logoUrl={settings.logoUrl} email={settings.email} address={settings.address} />
      </div>
    );
  }

  return <PageRenderer blocks={blocks} />;
}
