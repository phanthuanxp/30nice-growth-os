"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, MessageCircle, Menu, X, ChevronDown, Car } from "lucide-react";
import type { TaxiThemeConfig } from "./types";

interface Props {
  config: TaxiThemeConfig;
  siteName: string;
  logoUrl?: string | null;
}

export function TaxiHeader({ config, siteName, logoUrl }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const phoneHref = `tel:${config.phone.replace(/\s/g, "")}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-10 w-auto object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-blue-700 flex items-center justify-center shrink-0">
                  <Car className="h-5 w-5 text-white" />
                </div>
                <div className="leading-tight">
                  <p className="text-blue-800 font-bold text-base leading-none">{siteName}</p>
                  <p className="text-orange-500 text-[10px] font-semibold leading-none mt-0.5">24/7 · Giá trọn gói</p>
                </div>
              </div>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {config.navItems.map((item) => (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                  onMouseEnter={() => item.children && setOpenDropdown(item.href)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  {item.label}
                  {item.children && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
                </Link>
                {item.children && (
                  <div
                    onMouseEnter={() => setOpenDropdown(item.href)}
                    onMouseLeave={() => setOpenDropdown(null)}
                    className={`absolute left-0 top-full pt-1 transition-all duration-150 ${
                      openDropdown === item.href ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1"
                    }`}
                  >
                    <div className="w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 overflow-hidden">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href={phoneHref}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-xl hover:bg-blue-800 transition-colors"
            >
              <Phone className="h-4 w-4" />
              {config.phone}
            </a>
            <a
              href={config.zaloLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Zalo
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {config.navItems.map((item) => (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="pl-4 space-y-0.5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-2 flex flex-col gap-2 border-t border-gray-100 mt-2">
              <a
                href={phoneHref}
                className="flex items-center justify-center gap-2 py-3 bg-blue-700 text-white text-sm font-semibold rounded-xl"
              >
                <Phone className="h-4 w-4" />
                Gọi {config.phone}
              </a>
              <a
                href={config.zaloLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 bg-green-500 text-white text-sm font-semibold rounded-xl"
              >
                <MessageCircle className="h-4 w-4" />
                Chat Zalo
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
