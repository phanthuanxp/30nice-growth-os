"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Globe,
  Users,
  Settings,
  BarChart2,
  FileBarChart,
  ChevronRight,
  Brain,
  Palette,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Sites",
    items: [
      { label: "Tất cả Sites", href: "/admin/sites", icon: Globe },
      { label: "Leads (tổng)", href: "/admin/leads", icon: Users, badge: "New" },
      { label: "Theme Library", href: "/admin/themes", icon: Palette },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart2 },
      { label: "Reports", href: "/admin/reports", icon: FileBarChart },
    ],
  },
  {
    title: "System",
    items: [
      { label: "AI Providers", href: "/admin/settings/ai", icon: Brain },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col"
      style={{ background: "var(--sidebar-bg)" }}
    >
      {/* Logo */}
      <div
        className="flex h-16 items-center px-5 shrink-0"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <Link href="/admin/dashboard" className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)",
            }}
          >
            30
          </div>
          <div className="leading-tight">
            <p className="text-xs font-bold text-white">30Nice</p>
            <p className="text-[10px] text-slate-400">Growth OS</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-6" : ""}>
            {group.title && (
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/admin/dashboard" &&
                    pathname.startsWith(item.href));
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
                      {item.badge && (
                        <span className="rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {item.badge}
                        </span>
                      )}
                      {active && (
                        <ChevronRight className="h-3 w-3 opacity-60" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-4 py-4 shrink-0"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <p className="text-[10px] text-slate-600 text-center">
          30Nice Growth OS · MVP v0.1
        </p>
      </div>
    </aside>
  );
}
