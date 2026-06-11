import Link from "next/link";
import { Phone, MessageCircle, Mail, MapPin, Car } from "lucide-react";
import type { TaxiThemeConfig } from "./types";

interface Props {
  config: TaxiThemeConfig;
  siteName: string;
  logoUrl?: string | null;
  email?: string | null;
  address?: string | null;
}

export function TaxiFooter({ config, siteName, logoUrl, email, address }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-9 w-auto brightness-0 invert" />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Car className="h-5 w-5 text-white" />
                </div>
              )}
              <span className="text-white font-bold text-base">{siteName}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">{config.footerAbout}</p>
            <div className="space-y-2">
              <a
                href={`tel:${config.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <Phone className="h-4 w-4 text-orange-400 shrink-0" />
                {config.phone}
              </a>
              <a
                href={config.zaloLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-green-400 shrink-0" />
                Chat Zalo 24/7
              </a>
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  <Mail className="h-4 w-4 text-blue-400 shrink-0" />
                  {email}
                </a>
              )}
              {address && (
                <p className="flex items-start gap-2 text-sm text-gray-400">
                  <MapPin className="h-4 w-4 text-gray-500 shrink-0 mt-0.5" />
                  {address}
                </p>
              )}
            </div>
          </div>

          {/* Links column */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Thông tin</h3>
            <ul className="space-y-2">
              {config.footerLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services column */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Dịch vụ</h3>
            <ul className="space-y-2">
              {[
                { label: "Taxi Bắc Ninh", href: "/taxi-bac-ninh" },
                { label: "Taxi Bắc Ninh Hà Nội", href: "/taxi-bac-ninh-ha-noi" },
                { label: "Taxi Nội Bài Bắc Ninh", href: "/taxi-noi-bai-bac-ninh" },
                { label: "Bảng giá", href: "/bang-gia" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service areas */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Khu vực phục vụ</h3>
            <div className="flex flex-wrap gap-1.5">
              {config.footerServiceAreas.map((area) => (
                <span
                  key={area}
                  className="px-2.5 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg border border-gray-700"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © {year} {config.copyrightName}. Bản quyền thuộc về {config.copyrightName}.
          </p>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${config.phone.replace(/\s/g, "")}`}
              className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              Hotline: {config.phone}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
