"use client";

import { useState, useTransition } from "react";
import {
  Check, Globe, Loader2, ExternalLink, ChevronDown,
  Phone, Image as ImageIcon, Palette, Newspaper, AlignLeft, Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveThemeSettings } from "./actions";
import { DEFAULT_TRAVEL_NEWS_CONFIG } from "@/components/themes/travel-news/types";
import type { TravelNewsThemeConfig } from "@/components/themes/travel-news/types";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
  );
}

function Section({ icon: Icon, title, badge, children, defaultOpen = false }: {
  icon: React.ElementType; title: string; badge?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button type="button" className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-indigo-600" />
        </div>
        <span className="flex-1 text-sm font-semibold text-slate-800">{title}</span>
        {badge && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{badge}</span>}
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">{children}</div>}
    </div>
  );
}

interface Props {
  siteId: string;
  currentTheme: string;
  phone: string;
  zaloLink: string;
  themeConfig: Record<string, unknown> | null;
  primaryDomain?: string | null;
}

const THEMES = [
  { id: "default", name: "Mặc định", desc: "Block builder cơ bản, linh hoạt", color: "#6366f1", Icon: Globe },
  { id: "travel-news", name: "Travel News", desc: "Magazine tin tức du lịch — card grid, header tối", color: "#059669", Icon: Newspaper },
];

export function ThemeClient({ siteId, currentTheme, phone: initPhone, zaloLink: initZalo, themeConfig: initConfig, primaryDomain }: Props) {
  const [tab, setTab] = useState<"theme" | "content" | "appearance">("theme");
  const [theme, setTheme] = useState(currentTheme);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const merged: TravelNewsThemeConfig = { ...DEFAULT_TRAVEL_NEWS_CONFIG, ...(initConfig ?? {}) } as TravelNewsThemeConfig;

  const [phone, setPhone] = useState(initPhone || merged.phone || "");
  const [zaloLink, setZaloLink] = useState(initZalo || merged.zaloLink || "");
  const [heroTagline, setHeroTagline] = useState(merged.heroTagline);
  const [footerAbout, setFooterAbout] = useState(merged.footerAbout);
  const [copyrightName, setCopyrightName] = useState(merged.copyrightName);
  const [categories, setCategories] = useState((merged.categories ?? []).join(", "));
  const [accentColor, setAccentColor] = useState(merged.accentColor ?? "#059669");
  const [socialFacebook, setSocialFacebook] = useState(merged.socialFacebook ?? "");
  const [socialYoutube, setSocialYoutube] = useState(merged.socialYoutube ?? "");

  const buildConfig = (): Partial<TravelNewsThemeConfig> => ({
    phone, zaloLink, heroTagline, footerAbout, copyrightName,
    categories: categories.split(",").map(s => s.trim()).filter(Boolean),
    accentColor, socialFacebook, socialYoutube,
  });

  const handleSave = () => {
    setError(""); setSaved(false);
    startTransition(async () => {
      const result = await saveThemeSettings(siteId, { theme, phone, zaloLink, primaryColor: accentColor, themeConfig: buildConfig() });
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  };

  const TABS = [
    { id: "theme", label: "Giao diện" },
    { id: "content", label: "Nội dung" },
    { id: "appearance", label: "Màu sắc" },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              tab === t.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "theme" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Chọn theme</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {THEMES.map(({ id, name, desc, color, Icon }) => {
                const active = theme === id;
                return (
                  <button key={id} type="button" onClick={() => setTheme(id)}
                    className={cn("relative text-left rounded-xl border-2 p-4 transition-all",
                      active ? "border-indigo-500 bg-indigo-50/40 shadow-sm" : "border-slate-200 hover:border-slate-300")}>
                    {active && (
                      <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: color + "18", border: `1px solid ${color}30` }}>
                      <Icon className="h-5 w-5" style={{ color }} />
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">{name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <Section icon={Phone} title="Thông tin liên hệ" defaultOpen>
            <Field label="Số điện thoại">
              <Input value={phone} onChange={setPhone} placeholder="0961 657 891" />
            </Field>
            <Field label="Link Zalo" hint="Hiển thị trên topbar và footer">
              <Input value={zaloLink} onChange={setZaloLink} placeholder="https://zalo.me/..." />
            </Field>
          </Section>
        </div>
      )}

      {tab === "content" && (
        <div className="space-y-3">
          <Section icon={AlignLeft} title="Nội dung trang chủ" defaultOpen>
            <Field label="Tagline hero" hint="Dòng slogan hiển thị trên banner trang chủ">
              <Input value={heroTagline} onChange={setHeroTagline} placeholder="Khám phá Việt Nam và Đông Nam Á" />
            </Field>
            <Field label="Giới thiệu footer">
              <Textarea value={footerAbout} onChange={setFooterAbout} rows={3} placeholder="Mô tả ngắn về site xuất hiện ở footer..." />
            </Field>
            <Field label="Tên bản quyền (©)">
              <Input value={copyrightName} onChange={setCopyrightName} placeholder="30Nice Travel" />
            </Field>
          </Section>

          <Section icon={Tag} title="Danh mục tin tức" badge={`${categories.split(",").filter(s => s.trim()).length} danh mục`}>
            <Field label="Danh mục" hint="Cách nhau bằng dấu phẩy — hiển thị trên thanh category nav">
              <Textarea value={categories} onChange={setCategories} rows={3}
                placeholder="Du lịch trong nước, Du lịch quốc tế, Ẩm thực, Khám phá, Kinh nghiệm" />
            </Field>
          </Section>
        </div>
      )}

      {tab === "appearance" && (
        <div className="space-y-4">
          <Section icon={Palette} title="Màu sắc" defaultOpen>
            <Field label="Màu accent (nút, link, highlight)">
              <div className="flex gap-2">
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                  className="h-9 w-14 rounded-lg border border-slate-300 cursor-pointer p-0.5" />
                <Input value={accentColor} onChange={setAccentColor} placeholder="#059669" />
              </div>
            </Field>
          </Section>

          <Section icon={Globe} title="Mạng xã hội">
            <Field label="Facebook Page URL">
              <Input value={socialFacebook} onChange={setSocialFacebook} placeholder="https://facebook.com/..." />
            </Field>
            <Field label="YouTube Channel URL">
              <Input value={socialYoutube} onChange={setSocialYoutube} placeholder="https://youtube.com/..." />
            </Field>
          </Section>

          <Section icon={ImageIcon} title="Logo">
            <Field label="URL Logo" hint="Upload qua Media Library → copy URL → dán vào đây">
              <Input value="" onChange={() => {}} placeholder="https://... hoặc /api/files/..." />
            </Field>
          </Section>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium">
              <Check className="h-4 w-4" />Đã lưu thành công!
            </span>
          )}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
        <div className="flex items-center gap-2.5">
          {primaryDomain && (
            <a href={`https://${primaryDomain}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />Xem site
            </a>
          )}
          <button type="button" onClick={handleSave} disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
