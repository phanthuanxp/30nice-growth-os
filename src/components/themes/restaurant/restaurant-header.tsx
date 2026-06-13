"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Menu, X, UtensilsCrossed, CalendarCheck } from "lucide-react";
import type { RestaurantThemeConfig } from "./types";

interface Props {
  config: RestaurantThemeConfig;
  siteName: string;
  logoUrl?: string | null;
}

export function RestaurantHeader({ config, siteName, logoUrl }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const phoneHref = `tel:${config.phone.replace(/\s/g, "")}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-amber-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteName} className="h-10 w-auto object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-red-700 flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="h-5 w-5 text-amber-50" />
                </div>
                <div className="leading-tight">
                  <p className="text-red-800 font-bold text-base leading-none">{siteName}</p>
                  <p className="text-amber-600 text-[10px] font-semibold leading-none mt-0.5">{config.openHours}</p>
                </div>
              </div>
            )}
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {config.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-stone-700 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <a
              href={phoneHref}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Phone className="h-4 w-4" />
              {config.phone}
            </a>
            <a
              href="#dat-ban"
              className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <CalendarCheck className="h-4 w-4" />
              Đặt bàn
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden h-10 w-10 flex items-center justify-center rounded-lg text-stone-700 hover:bg-stone-100"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-amber-100 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {config.navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-red-50 hover:text-red-700 rounded-lg"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 flex gap-2">
              <a
                href={phoneHref}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-700 text-sm font-semibold rounded-xl"
              >
                <Phone className="h-4 w-4" />
                Gọi ngay
              </a>
              <a
                href="#dat-ban"
                onClick={() => setMobileOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-700 text-white text-sm font-semibold rounded-xl"
              >
                <CalendarCheck className="h-4 w-4" />
                Đặt bàn
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
