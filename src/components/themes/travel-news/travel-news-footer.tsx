import Link from "next/link";
import { Globe, Facebook, Youtube, MapPin } from "lucide-react";
import type { TravelNewsThemeConfig } from "./types";

interface Props {
  config: TravelNewsThemeConfig;
  siteName: string;
  logoUrl?: string | null;
  email?: string | null;
  address?: string | null;
}

export function TravelNewsFooter({ config, siteName, logoUrl, email, address }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain brightness-200" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: config.accentColor }}>
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-bold text-lg">{siteName}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{config.footerAbout}</p>
            <div className="flex items-center gap-3">
              {config.socialFacebook && (
                <a href={config.socialFacebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                  className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {config.socialYoutube && (
                <a href={config.socialYoutube} target="_blank" rel="noopener noreferrer" aria-label="Youtube"
                  className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-red-600 transition-colors">
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Chuyên mục</h3>
            <ul className="space-y-2">
              {config.footerLinks.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Liên hệ</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                  <span>{address}</span>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="hover:text-emerald-400 transition-colors">{email}</a>
                </li>
              )}
              {config.phone && (
                <li>
                  <a href={`tel:${config.phone}`} className="hover:text-emerald-400 transition-colors">{config.phone}</a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-slate-500">
          <p>© {year} {config.copyrightName || siteName}. All rights reserved.</p>
          <Link href="/sitemap.xml" className="hover:text-slate-300 transition-colors">Sitemap</Link>
        </div>
      </div>
    </footer>
  );
}
