import Link from "next/link";
import { Globe, Phone, Menu } from "lucide-react";
import type { TravelNewsThemeConfig } from "./types";

interface Props {
  config: TravelNewsThemeConfig;
  siteName: string;
  logoUrl?: string | null;
}

export function TravelNewsHeader({ config, siteName, logoUrl }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 shadow-lg">
      {/* Top bar */}
      <div className="border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-8">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Globe className="h-3 w-3" />
            <span>Du lịch · Khám phá · Trải nghiệm</span>
          </div>
          {config.phone && (
            <a href={`tel:${config.phone}`} className="flex items-center gap-1 text-emerald-400 text-xs hover:text-emerald-300 transition-colors">
              <Phone className="h-3 w-3" />
              {config.phone}
            </a>
          )}
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.accentColor }}>
                  <Globe className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg leading-none">{siteName}</span>
              </div>
            )}
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {config.navItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu indicator */}
          <button className="md:hidden p-2 text-slate-300 hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Category strip */}
      <div className="border-t border-slate-700 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 h-8 overflow-x-auto scrollbar-none">
          {config.categories.map((cat) => (
            <Link
              key={cat}
              href="/blog"
              className="text-xs text-slate-400 hover:text-emerald-400 whitespace-nowrap transition-colors px-2"
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
