"use client";

import { useState, useTransition } from "react";
import {
  Car, Check, Globe, Loader2, ExternalLink, ChevronDown, Plus, Trash2,
  Phone, MessageCircle, Image as ImageIcon, Type, DollarSign, Star,
  HelpCircle, Megaphone, MapPin, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveThemeSettings } from "./actions";
import { DEFAULT_TAXI_CONFIG } from "@/components/themes/taxi/types";
import type { TaxiThemeConfig, TaxiService, TaxiPricingRow, TaxiTestimonial, TaxiFaq } from "@/components/themes/taxi/types";

/* ── helpers ──────────────────────────────────────────── */

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
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
    />
  );
}

/* ── Section accordion wrapper ────────────────────────── */

function Section({ icon: Icon, title, badge, children, defaultOpen = false }: {
  icon: React.ElementType; title: string; badge?: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-indigo-600" />
        </div>
        <span className="flex-1 text-sm font-semibold text-slate-800">{title}</span>
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{badge}</span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">{children}</div>}
    </div>
  );
}

/* ── Array item editors ────────────────────────────────── */

function ServiceEditor({ items, onChange }: {
  items: TaxiService[]; onChange: (v: TaxiService[]) => void;
}) {
  const update = (i: number, field: keyof TaxiService, val: string) => {
    const next = items.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { title: "", description: "", href: "/" }]);

  return (
    <div className="space-y-3">
      {items.map((svc, i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">Dịch vụ #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <Input value={svc.title} onChange={v => update(i, "title", v)} placeholder="Tên dịch vụ" />
          <Textarea value={svc.description} onChange={v => update(i, "description", v)} placeholder="Mô tả" rows={2} />
          <Input value={svc.href} onChange={v => update(i, "href", v)} placeholder="/slug-duong-dan" />
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-1">
        <Plus className="h-3.5 w-3.5" />Thêm dịch vụ
      </button>
    </div>
  );
}

function PricingEditor({ items, onChange }: {
  items: TaxiPricingRow[]; onChange: (v: TaxiPricingRow[]) => void;
}) {
  const update = (i: number, field: keyof TaxiPricingRow, val: string) => {
    onChange(items.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { route: "", xe4: "Liên hệ", xe7: "Liên hệ", xe16: "Liên hệ" }]);

  return (
    <div className="space-y-3">
      {items.map((row, i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Tuyến #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            <Input value={row.route} onChange={v => update(i, "route", v)} placeholder="Tên tuyến đường" />
            <Input value={row.badge ?? ""} onChange={v => update(i, "badge", v)} placeholder='Badge (vd: "Phổ biến") — để trống nếu không cần' />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Xe 4 chỗ</p>
                <Input value={row.xe4} onChange={v => update(i, "xe4", v)} placeholder="350.000đ" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Xe 7 chỗ</p>
                <Input value={row.xe7} onChange={v => update(i, "xe7", v)} placeholder="Liên hệ" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 mb-1">Xe 16 chỗ</p>
                <Input value={row.xe16} onChange={v => update(i, "xe16", v)} placeholder="Liên hệ" />
              </div>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-1">
        <Plus className="h-3.5 w-3.5" />Thêm tuyến
      </button>
    </div>
  );
}

function TestimonialEditor({ items, onChange }: {
  items: TaxiTestimonial[]; onChange: (v: TaxiTestimonial[]) => void;
}) {
  const update = (i: number, field: keyof TaxiTestimonial, val: string | number) => {
    onChange(items.map((t, idx) => idx === i ? { ...t, [field]: val } : t));
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { name: "", location: "", text: "", rating: 5 }]);

  return (
    <div className="space-y-3">
      {items.map((t, i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Đánh giá #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input value={t.name} onChange={v => update(i, "name", v)} placeholder="Tên khách hàng" />
            <Input value={t.location} onChange={v => update(i, "location", v)} placeholder="Vị trí · tuyến xe" />
          </div>
          <Textarea value={t.text} onChange={v => update(i, "text", v)} placeholder="Nội dung đánh giá..." rows={2} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Rating:</span>
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => update(i, "rating", n)}>
                <Star className={cn("h-4 w-4 transition-colors", n <= t.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200")} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-1">
        <Plus className="h-3.5 w-3.5" />Thêm đánh giá
      </button>
    </div>
  );
}

function FaqEditor({ items, onChange }: {
  items: TaxiFaq[]; onChange: (v: TaxiFaq[]) => void;
}) {
  const update = (i: number, field: keyof TaxiFaq, val: string) => {
    onChange(items.map((f, idx) => idx === i ? { ...f, [field]: val } : f));
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { question: "", answer: "" }]);

  return (
    <div className="space-y-3">
      {items.map((f, i) => (
        <div key={i} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Câu hỏi #{i + 1}</span>
            <button type="button" onClick={() => remove(i)} className="text-slate-300 hover:text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <Input value={f.question} onChange={v => update(i, "question", v)} placeholder="Câu hỏi..." />
          <Textarea value={f.answer} onChange={v => update(i, "answer", v)} placeholder="Trả lời..." rows={3} />
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-1">
        <Plus className="h-3.5 w-3.5" />Thêm câu hỏi
      </button>
    </div>
  );
}

/* ── Main component ────────────────────────────────────── */

interface Props {
  siteId: string;
  currentTheme: string;
  phone: string;
  zaloLink: string;
  themeConfig: Record<string, unknown> | null;
  primaryDomain?: string | null;
}

export function ThemeClient({ siteId, currentTheme, phone: initPhone, zaloLink: initZalo, themeConfig: initConfig, primaryDomain }: Props) {
  const [tab, setTab] = useState<"theme" | "content" | "appearance">("theme");
  const [theme, setTheme] = useState(currentTheme);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // Merge with defaults
  const merged = { ...DEFAULT_TAXI_CONFIG, ...(initConfig ?? {}) } as TaxiThemeConfig;

  // Basic contact
  const [phone, setPhone] = useState(initPhone || merged.phone);
  const [zaloLink, setZaloLink] = useState(initZalo || merged.zaloLink);

  // Appearance
  const [primaryColor, setPrimaryColor] = useState("#1d4ed8");
  const [accentColor, setAccentColor] = useState("#f97316");

  // Hero
  const [heroTitle, setHeroTitle] = useState(merged.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(merged.heroSubtitle);

  // Stats
  const [statsCount, setStatsCount] = useState(merged.statsCount);
  const [statsRating, setStatsRating] = useState(merged.statsRating);
  const [statsYears, setStatsYears] = useState(merged.statsYears);

  // Dynamic arrays
  const [services, setServices] = useState<TaxiService[]>(merged.services);
  const [pricing, setPricing] = useState<TaxiPricingRow[]>(merged.pricing);
  const [pricingNote, setPricingNote] = useState(merged.pricingNote);
  const [testimonials, setTestimonials] = useState<TaxiTestimonial[]>(merged.testimonials);
  const [faqs, setFaqs] = useState<TaxiFaq[]>(merged.faqs);

  // CTA
  const [ctaTitle, setCtaTitle] = useState(merged.ctaTitle);
  const [ctaSubtitle, setCtaSubtitle] = useState(merged.ctaSubtitle);
  const [ctaDescription, setCtaDescription] = useState(merged.ctaDescription);

  // Footer
  const [footerAbout, setFooterAbout] = useState(merged.footerAbout);
  const [footerAreas, setFooterAreas] = useState(merged.footerServiceAreas.join(", "));
  const [copyrightName, setCopyrightName] = useState(merged.copyrightName);

  const buildConfig = (): Partial<TaxiThemeConfig> => ({
    phone, zaloLink,
    heroTitle, heroSubtitle,
    statsCount, statsRating, statsYears,
    services, pricing, pricingNote,
    testimonials, faqs,
    ctaTitle, ctaSubtitle, ctaDescription,
    footerAbout,
    footerServiceAreas: footerAreas.split(",").map(s => s.trim()).filter(Boolean),
    copyrightName,
  });

  const handleSave = () => {
    setError(""); setSaved(false);
    startTransition(async () => {
      const result = await saveThemeSettings(siteId, {
        theme, phone, zaloLink, primaryColor,
        themeConfig: buildConfig(),
      });
      if (result.error) setError(result.error);
      else setSaved(true);
    });
  };

  const THEMES = [
    { id: "default", name: "Mặc định", desc: "Block builder cơ bản", color: "#6366f1", Icon: Globe },
    { id: "taxi", name: "Taxi Theme", desc: "Chuyên nghiệp cho dịch vụ taxi & xe du lịch", color: "#1d4ed8", Icon: Car },
  ];

  const TABS = [
    { id: "theme", label: "Giao diện" },
    { id: "content", label: "Nội dung" },
    { id: "appearance", label: "Màu sắc" },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              tab === t.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Giao diện (theme selector) ── */}
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

          {theme === "taxi" && (
            <Section icon={Phone} title="Thông tin liên hệ" defaultOpen>
              <Field label="Số điện thoại hotline">
                <Input value={phone} onChange={setPhone} placeholder="0961 657 891" />
              </Field>
              <Field label="Link Zalo" hint="Hiển thị trên nút Chat Zalo ở header, hero, footer">
                <Input value={zaloLink} onChange={setZaloLink} placeholder="https://zalo.me/0961657891" />
              </Field>
            </Section>
          )}
        </div>
      )}

      {/* ── Tab: Nội dung ── */}
      {tab === "content" && theme === "taxi" && (
        <div className="space-y-3">
          <Section icon={Type} title="Hero — Banner chính" defaultOpen>
            <Field label="Tiêu đề chính (H1)">
              <Input value={heroTitle} onChange={setHeroTitle} placeholder="Taxi Bắc Ninh — Đặt xe nhanh, giá trọn gói" />
            </Field>
            <Field label="Tiêu đề phụ">
              <Textarea value={heroSubtitle} onChange={setHeroSubtitle} placeholder="Mô tả ngắn về dịch vụ..." rows={2} />
            </Field>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <Field label="Lượt khách">
                <Input value={statsCount} onChange={setStatsCount} placeholder="1.200+" />
              </Field>
              <Field label="Đánh giá">
                <Input value={statsRating} onChange={setStatsRating} placeholder="4.9" />
              </Field>
              <Field label="Năm HĐ">
                <Input value={statsYears} onChange={setStatsYears} placeholder="5+" />
              </Field>
            </div>
          </Section>

          <Section icon={Car} title="Dịch vụ" badge={`${services.length} dịch vụ`}>
            <ServiceEditor items={services} onChange={setServices} />
          </Section>

          <Section icon={DollarSign} title="Bảng giá" badge={`${pricing.length} tuyến`}>
            <PricingEditor items={pricing} onChange={setPricing} />
            <Field label="Ghi chú bảng giá">
              <Textarea value={pricingNote} onChange={setPricingNote} rows={2} />
            </Field>
          </Section>

          <Section icon={Star} title="Đánh giá khách hàng" badge={`${testimonials.length} đánh giá`}>
            <TestimonialEditor items={testimonials} onChange={setTestimonials} />
          </Section>

          <Section icon={HelpCircle} title="FAQ — Hỏi & Đáp" badge={`${faqs.length} câu hỏi`}>
            <FaqEditor items={faqs} onChange={setFaqs} />
          </Section>

          <Section icon={Megaphone} title="CTA — Kêu gọi hành động">
            <Field label="Tiêu đề">
              <Input value={ctaTitle} onChange={setCtaTitle} placeholder="Sẵn sàng đặt xe?" />
            </Field>
            <Field label="Tiêu đề phụ">
              <Input value={ctaSubtitle} onChange={setCtaSubtitle} placeholder="Cần taxi ngay?" />
            </Field>
            <Field label="Mô tả">
              <Textarea value={ctaDescription} onChange={setCtaDescription} rows={2} />
            </Field>
          </Section>

          <Section icon={MapPin} title="Footer">
            <Field label="Giới thiệu ngắn">
              <Textarea value={footerAbout} onChange={setFooterAbout} rows={2} />
            </Field>
            <Field label="Khu vực phục vụ" hint="Cách nhau bằng dấu phẩy">
              <Input value={footerAreas} onChange={setFooterAreas} placeholder="Bắc Ninh, Từ Sơn, Hà Nội..." />
            </Field>
            <Field label="Tên bản quyền (©)">
              <Input value={copyrightName} onChange={setCopyrightName} placeholder="Taxi Bắc Ninh" />
            </Field>
          </Section>
        </div>
      )}

      {tab === "content" && theme !== "taxi" && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
          <Globe className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Chọn Taxi Theme để chỉnh sửa nội dung</p>
        </div>
      )}

      {/* ── Tab: Màu sắc ── */}
      {tab === "appearance" && (
        <div className="space-y-4">
          <Section icon={Palette} title="Màu sắc chủ đạo" defaultOpen>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Màu chính (Primary)">
                <div className="flex gap-2">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                    className="h-9 w-14 rounded-lg border border-slate-300 cursor-pointer p-0.5" />
                  <Input value={primaryColor} onChange={setPrimaryColor} placeholder="#1d4ed8" />
                </div>
              </Field>
              <Field label="Màu phụ (Accent)">
                <div className="flex gap-2">
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                    className="h-9 w-14 rounded-lg border border-slate-300 cursor-pointer p-0.5" />
                  <Input value={accentColor} onChange={setAccentColor} placeholder="#f97316" />
                </div>
              </Field>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 mt-2">
              <p className="text-xs text-amber-700">
                Màu sắc sẽ được áp dụng lên header, nút CTA và accent trong toàn site.
                Taxi Theme hiện dùng xanh dương (#1d4ed8) + cam (#f97316).
              </p>
            </div>
          </Section>

          <Section icon={ImageIcon} title="Logo & Favicon">
            <Field label="URL Logo" hint="Hình ảnh hiển thị ở header và footer. Upload qua Media Library rồi dán URL vào đây.">
              <Input value="" onChange={() => {}} placeholder="https://... hoặc /api/files/..." />
            </Field>
            <p className="text-xs text-slate-400">
              💡 Upload logo tại <strong>Media</strong> → copy URL → dán vào đây.
            </p>
          </Section>
        </div>
      )}

      {/* ── Footer actions ── */}
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
