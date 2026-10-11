import { notFound, redirect, permanentRedirect } from "next/navigation";
import { headers } from "next/headers";
import { resolveTenant } from "@/server/tenant/resolve";
import { getPageBySlug } from "@/server/queries/pages";
import { getHeaderNavItems } from "@/server/queries/menus";
import { pages as demoPages } from "@/server/queries/demo-data";
import { PageRenderer } from "@/components/public/page-renderer";
import { TravelNewsPage } from "@/components/themes/travel-news/travel-news-page";
import { ThemeChrome } from "@/components/themes/theme-chrome";
import { prisma } from "@/server/db";
import type { Metadata } from "next";
import type { TravelNewsThemeConfig } from "@/components/themes/travel-news/types";

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

type RedirectRule = { from: string; to: string; type?: "301" | "302" };

async function findRedirect(tenantId: string, path: string): Promise<RedirectRule | null> {
  try {
    const integration = await prisma.integration.findFirst({
      where: { tenantId, provider: "redirects" },
      select: { config: true },
    });
    const rules = (integration?.config as { rules?: RedirectRule[] } | null)?.rules;
    if (!Array.isArray(rules)) return null;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return rules.find((r) => r.from === normalized) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: slugParts } = await params;
  const slug = (slugParts ?? []).join("/");
  const tenant = await resolveTenant();
  const host = (await headers()).get("host")?.replace(/^www\./, "") ?? "";
  const base = `https://${host}`;

  if (!slug) {
    const settings = await getSiteSettings(tenant.id);
    const title = settings?.defaultSeoTitle ?? tenant.name;
    const description = settings?.defaultSeoDescription ?? undefined;
    return {
      title,
      description,
      alternates: { canonical: `${base}/` },
      openGraph: {
        title,
        description,
        url: `${base}/`,
        type: "website",
        siteName: tenant.name,
        images: settings?.logoUrl ? [{ url: settings.logoUrl }] : undefined,
      },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  let page = null;
  try {
    page = await getPageBySlug(tenant.id, slug);
  } catch {
    page = demoPages.find((p) => p.tenantId === tenant.id && p.slug === slug) ?? null;
  }

  if (!page) return {};
  const fullPage = page as typeof page & { seoTitle?: string | null; seoDescription?: string | null; ogImageUrl?: string | null };
  const title = fullPage.seoTitle || page.title;
  const description = fullPage.seoDescription || page.summary || undefined;
  return {
    title,
    description,
    alternates: { canonical: `${base}/${slug}` },
    openGraph: {
      title,
      description,
      url: `${base}/${slug}`,
      type: "website",
      siteName: tenant.name,
      images: fullPage.ogImageUrl ? [{ url: fullPage.ogImageUrl }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
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
    slug === "login" ||
    slug === "sitemap.xml" ||
    slug === "robots.txt" ||
    slug.startsWith("theme-preview")
  ) {
    notFound();
  }

  const tenant = await resolveTenant();
  const settings = await getSiteSettings(tenant.id);
  const headerNav = await getHeaderNavItems(tenant.id);

  // Homepage — theme renderer
  if (!slug) {
    const theme = settings?.theme ?? "default";

    if (theme === "travel-news") {
      const themeConfig = settings?.themeConfig as Partial<TravelNewsThemeConfig> | null;
      const recentPosts = await prisma.post.findMany({
        where: { tenantId: tenant.id, status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 9,
        select: { id: true, title: true, slug: true, excerpt: true, featuredImage: true, publishedAt: true, category: { select: { name: true } } },
      }).catch(() => []);
      return (
        <TravelNewsPage
          siteName={tenant.name}
          logoUrl={settings?.logoUrl}
          email={settings?.email}
          address={settings?.address}
          themeConfig={themeConfig}
          navItems={headerNav?.map((n) => ({ label: n.label, href: n.href }))}
          recentPosts={recentPosts}
        />
      );
    }

    redirect("/admin/dashboard");
  }

  // Inner page lookup
  let page = null;
  try {
    page = await getPageBySlug(tenant.id, slug);
  } catch {
    page = demoPages.find((p) => p.tenantId === tenant.id && p.slug === slug) ?? null;
  }

  if (!page || page.status !== "PUBLISHED") {
    const rule = await findRedirect(tenant.id, `/${slug}`);
    if (rule) {
      if (rule.type === "302") redirect(rule.to);
      permanentRedirect(rule.to);
    }
    notFound();
  }

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

  if (settings?.theme && settings.theme !== "default") {
    return (
      <ThemeChrome tenantId={tenant.id} tenantName={tenant.name} settings={settings}>
        <PageRenderer blocks={blocks} />
      </ThemeChrome>
    );
  }

  return <PageRenderer blocks={blocks} />;
}
