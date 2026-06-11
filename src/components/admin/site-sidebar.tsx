"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  LayoutDashboard,
  FileText,
  BookOpen,
  Image,
  Navigation,
  Users,
  Sparkles,
  Settings,
  ChevronRight,
  Globe,
  Palette,
  FileInput,
} from "lucide-react";

interface SiteSidebarProps {
  siteId: string;
  siteName: string;
  siteSlug: string;
  primaryDomain?: string | null;
}

export function SiteSidebar({ siteId, siteName, siteSlug, primaryDomain }: SiteSidebarProps) {
  const pathname = usePathname();
  const base = `/admin/sites/${siteId}`;

  const navItems = [
    { label: "Tổng quan", href: base, icon: LayoutDashboard, exact: true },
    { label: "Pages", href: `${base}/pages`, icon: FileText },
    { label: "Blog", href: `${base}/blog`, icon: BookOpen },
    { label: "Media", href: `${base}/media`, icon: Image },
    { label: "Menus", href: `${base}/menus`, icon: Navigation },
    { label: "Leads", href: `${base}/leads`, icon: Users },
    { label: "Forms & Lead", href: `${base}/forms`, icon: FileInput },
    { label: "Giao diện", href: `${base}/theme`, icon: Palette },
    { label: "SEO AI Engine", href: `${base}/seo`, icon: Sparkles },
    { label: "Cài đặt", href: `${base}/settings`, icon: Settings },
  ];

  return (
    <aside
      className="flex w-56 flex-col shrink-0 border-r"
      style={{ background: "var(--sidebar-bg)", borderColor: "var(--sidebar-border)" }}
    >
      {/* Back to system */}
      <div
        className="flex h-14 items-center px-4 shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <Link
          href="/admin/sites"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>Tất cả sites</span>
        </Link>
      </div>

      {/* Site identity */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)" }}
          >
            {siteName[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{siteName}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {primaryDomain ?? siteSlug}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight className="h-3 w-3 opacity-60" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Live site link */}
      {primaryDomain && (
        <div
          className="px-4 py-3 shrink-0"
          style={{ borderTop: "1px solid var(--sidebar-border)" }}
        >
          <a
            href={`https://${primaryDomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="truncate">{primaryDomain}</span>
          </a>
        </div>
      )}
    </aside>
  );
}
