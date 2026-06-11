"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Sparkles, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  AlertTriangle, Info, X, Plus, Target, Search,
  Eye, Lightbulb, BookOpen, BarChart2, Globe,
  Settings2, Code2, Share2, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImagePicker } from "@/components/admin/image-picker";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActiveTab = "overview" | "advanced" | "schema" | "social";

interface CheckItem {
  id: string;
  label: string;
  status: "pass" | "fail" | "warning" | "na";
  message: string;
  weight: number;
}

interface CheckGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  checks: CheckItem[];
}

export interface SeoApplyData {
  seoTitle?: string;
  seoDescription?: string;
  excerpt?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  schemaType?: string;
  schemaData?: string;
  robotsMeta?: string;
  canonicalUrl?: string;
}

interface SeoResult {
  score: number;
  issues: { severity: "error" | "warning" | "info"; field: string; message: string }[];
  suggestions: {
    seoTitle: string; seoTitleNote?: string;
    seoDescription: string; seoDescriptionNote?: string;
    excerpt: string;
    ctaSuggestion?: string;
    contentTips?: string[];
  };
  keywordsRecommended: string[];
  keywordsPresent: string[];
  keywordsMissing: string[];
}

export interface SeoPanelProps {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  showExcerpt?: boolean;
  tenantId?: string;
  // social / advanced / schema initial values
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: string;
  schemaType?: string;
  schemaData?: string;
  robotsMeta?: string;
  canonicalUrl?: string;
  onApply: (data: SeoApplyData) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function hasKeyword(text: string, kw: string): boolean {
  if (!kw.trim()) return false;
  return text.toLowerCase().includes(kw.toLowerCase());
}

function slugify(t: string) {
  return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9\s-]/g, "").trim()
    .replace(/\s+/g, "-").replace(/-+/g, "-");
}

// ─── Score Gauge ─────────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Tốt" : score >= 50 ? "Khá" : "Yếu";
  const r = 36, c = 2 * Math.PI * r, dash = (score / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 88 88" className="w-22 h-22">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#f1f5f9" strokeWidth="9" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          transform="rotate(-90 44 44)" style={{ transition: "stroke-dasharray .5s" }} />
        <text x="44" y="41" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>{score}</text>
        <text x="44" y="53" textAnchor="middle" fontSize="9" fill="#94a3b8">/100</text>
      </svg>
      <span className="text-xs font-bold mt-0.5" style={{ color }}>{label}</span>
    </div>
  );
}

// ─── SERP Preview ─────────────────────────────────────────────────────────────

function SerpPreview({ title, slug, description }: {
  title: string; slug: string; description: string;
}) {
  const displayTitle = title || "Tiêu đề trang";
  const displayDesc = description || "Mô tả trang sẽ hiển thị ở đây...";
  const url = `yoursite.com/${slug}`;
  const titleLen = displayTitle.length;
  const descLen = displayDesc.length;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" />Xem trước trên Google
      </p>
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 font-sans">
        <p className="text-xs text-slate-400 mb-1 truncate">{url}</p>
        <p className={`text-base font-medium leading-snug truncate ${titleLen > 60 ? "text-amber-600" : "text-blue-700"}`}>
          {displayTitle}
        </p>
        <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${descLen > 155 ? "text-amber-600" : "text-slate-600"}`}>
          {displayDesc}
        </p>
      </div>
      <div className="flex gap-4 text-[10px]">
        <span className={titleLen === 0 ? "text-slate-400" : titleLen > 60 ? "text-red-500 font-bold" : "text-emerald-600 font-bold"}>
          Title: {titleLen}/60
        </span>
        <span className={descLen === 0 ? "text-slate-400" : descLen > 155 ? "text-red-500 font-bold" : descLen >= 120 ? "text-emerald-600 font-bold" : "text-amber-500 font-bold"}>
          Desc: {descLen}/155
        </span>
      </div>
    </div>
  );
}

// ─── Check Row ────────────────────────────────────────────────────────────────

function CheckRow({ check }: { check: CheckItem }) {
  const cfg = {
    pass: { Icon: CheckCircle2, color: "text-emerald-600" },
    fail: { Icon: XCircle, color: "text-red-500" },
    warning: { Icon: AlertTriangle, color: "text-amber-500" },
    na: { Icon: Info, color: "text-slate-400" },
  }[check.status];
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-slate-50 last:border-0">
      <cfg.Icon className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.color}`} />
      <p className="text-xs text-slate-700 leading-snug">{check.message}</p>
    </div>
  );
}

// ─── Check Group ─────────────────────────────────────────────────────────────

function CheckGroup({ group }: { group: CheckGroup }) {
  const [open, setOpen] = useState(true);
  const passed = group.checks.filter((c) => c.status === "pass").length;
  const failed = group.checks.filter((c) => c.status === "fail").length;
  const warned = group.checks.filter((c) => c.status === "warning").length;
  const total = group.checks.length;
  const badgeColor = failed > 0 ? "bg-red-100 text-red-600" : warned > 0 ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-700";
  const badgeText = failed > 0 ? `${failed} lỗi` : warned > 0 ? `${warned} cảnh báo` : "Tất cả đạt";
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 transition-colors">
        <group.icon className="h-4 w-4 text-slate-500 shrink-0" />
        <span className="text-sm font-semibold text-slate-700 flex-1 text-left">{group.label}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{badgeText}</span>
        <span className="text-[10px] text-slate-400 ml-1">{passed}/{total}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-3 pt-0 border-t border-slate-100">
          {group.checks.map((c) => <CheckRow key={c.id} check={c} />)}
        </div>
      )}
    </div>
  );
}

// ─── AI Suggestion Card ───────────────────────────────────────────────────────

function AiSuggestionCard({ label, value, note, limit, applied, onApply }: {
  label: string; value: string; note?: string;
  limit: number; applied: boolean; onApply: () => void;
}) {
  const len = value.length;
  const lenColor = len === 0 ? "text-slate-400" : len > limit ? "text-red-500" : len >= limit * 0.8 ? "text-emerald-600" : "text-amber-500";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
        <span className={`text-[10px] font-mono font-semibold ${lenColor}`}>{len}/{limit}</span>
      </div>
      <p className="text-sm text-slate-800 leading-snug">{value}</p>
      {note && <p className="text-[11px] text-slate-400 italic leading-snug">{note}</p>}
      <button type="button" onClick={onApply}
        className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${applied ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700 hover:bg-violet-200"}`}>
        {applied ? "✓ Đã áp dụng" : "Áp dụng →"}
      </button>
    </div>
  );
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Đã copy" : "Copy"}
    </button>
  );
}

// ─── Schema generators ────────────────────────────────────────────────────────

type SchemaFields = Record<string, string>;

function generateJsonLd(type: string, fields: SchemaFields, faqItems: {q:string;a:string}[], title: string, seoDesc: string, slug: string): string {
  const base: Record<string, unknown> = { "@context": "https://schema.org", "@type": type };
  switch (type) {
    case "Article":
      return JSON.stringify({
        ...base,
        headline: fields.headline || title,
        description: fields.description || seoDesc,
        url: `https://yoursite.com/${slug}`,
        author: { "@type": "Person", name: fields.author || "Tác giả" },
        publisher: {
          "@type": "Organization",
          name: fields.publisherName || "Tên công ty",
          logo: { "@type": "ImageObject", url: fields.publisherLogo || "" },
        },
        datePublished: fields.datePublished || new Date().toISOString().slice(0, 10),
        dateModified: fields.dateModified || new Date().toISOString().slice(0, 10),
      }, null, 2);
    case "FAQPage":
      return JSON.stringify({
        ...base,
        mainEntity: faqItems.filter(f => f.q && f.a).map(f => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }, null, 2);
    case "LocalBusiness":
      return JSON.stringify({
        ...base,
        name: fields.name || title,
        description: fields.description || seoDesc,
        url: `https://yoursite.com/${slug}`,
        telephone: fields.phone || "",
        priceRange: fields.priceRange || "",
        openingHours: fields.openingHours || "",
        address: {
          "@type": "PostalAddress",
          streetAddress: fields.streetAddress || "",
          addressLocality: fields.city || "",
          addressCountry: "VN",
        },
      }, null, 2);
    case "Service":
      return JSON.stringify({
        ...base,
        name: fields.name || title,
        description: fields.description || seoDesc,
        url: `https://yoursite.com/${slug}`,
        provider: { "@type": "Organization", name: fields.provider || "" },
        areaServed: fields.areaServed || "Việt Nam",
        serviceType: fields.serviceType || "",
      }, null, 2);
    case "Product":
      return JSON.stringify({
        ...base,
        name: fields.name || title,
        description: fields.description || seoDesc,
        url: `https://yoursite.com/${slug}`,
        offers: {
          "@type": "Offer",
          price: fields.price || "0",
          priceCurrency: fields.currency || "VND",
          availability: "https://schema.org/InStock",
        },
        brand: { "@type": "Brand", name: fields.brand || "" },
      }, null, 2);
    case "BreadcrumbList":
      return JSON.stringify({
        ...base,
        itemListElement: slug.split("/").filter(Boolean).map((part, i, arr) => ({
          "@type": "ListItem",
          position: i + 1,
          name: part.replace(/-/g, " "),
          item: `https://yoursite.com/${arr.slice(0, i + 1).join("/")}`,
        })),
      }, null, 2);
    default:
      return JSON.stringify(base, null, 2);
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function SeoPanel({
  title, slug, content, excerpt, seoTitle, seoDescription, showExcerpt = true,
  tenantId = "",
  ogTitle: initOgTitle = "", ogDescription: initOgDesc = "", ogImage: initOgImage = "",
  twitterCard: initTwCard = "summary_large_image",
  schemaType: initSchType = "Article", schemaData: initSchData = "{}",
  robotsMeta: initRobots = "index,follow", canonicalUrl: initCanonical = "",
  onApply,
}: SeoPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // ── Overview state ────────────────────────────────────────────────────────
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiResult, setAiResult] = useState<SeoResult | null>(null);
  const [aiApplied, setAiApplied] = useState<Set<string>>(new Set());

  // ── Advanced state ────────────────────────────────────────────────────────
  const [robots, setRobots] = useState(initRobots);
  const [canonical, setCanonical] = useState(initCanonical);

  // ── Schema state ──────────────────────────────────────────────────────────
  const [schType, setSchType] = useState(initSchType);
  const [schFields, setSchFields] = useState<SchemaFields>(() => {
    try { return JSON.parse(initSchData) as SchemaFields; } catch { return {}; }
  });
  const [faqItems, setFaqItems] = useState<{q:string;a:string}[]>([{ q: "", a: "" }]);

  // ── Social state ──────────────────────────────────────────────────────────
  const [ogT, setOgT] = useState(initOgTitle);
  const [ogD, setOgD] = useState(initOgDesc);
  const [ogI, setOgI] = useState(initOgImage);
  const [twCard, setTwCard] = useState(initTwCard);

  // ── Derived ───────────────────────────────────────────────────────────────
  const primaryKw = keywords[0] ?? "";
  const plainContent = useMemo(() => stripHtml(content), [content]);
  const wordCount = useMemo(() => countWords(plainContent), [plainContent]);
  const first10pct = useMemo(() => {
    const words = plainContent.split(/\s+/);
    return words.slice(0, Math.max(1, Math.floor(words.length * 0.1))).join(" ");
  }, [plainContent]);

  // ── Real-time SEO checks ─────────────────────────────────────────────────
  const checkGroups = useMemo<CheckGroup[]>(() => {
    const kwInTitle = primaryKw ? hasKeyword(seoTitle || title, primaryKw) : null;
    const kwInDesc = primaryKw ? hasKeyword(seoDescription, primaryKw) : null;
    const kwInSlug = primaryKw ? hasKeyword(slug, slugify(primaryKw)) : null;
    const kwInFirst10 = primaryKw ? hasKeyword(first10pct, primaryKw) : null;
    const kwInContent = primaryKw ? hasKeyword(plainContent, primaryKw) : null;
    const titleLen = (seoTitle || title).length;
    const descLen = seoDescription.length;
    const hasH2 = /<h[23]/i.test(content);
    const hasImg = /<img/i.test(content);
    const imgWithAlt = /<img[^>]+alt="[^"]+"/i.test(content);
    const hasLink = /<a\s[^>]*href/i.test(content);
    const hasList = /<[ou]l/i.test(content);
    const paragraphs = content.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) ?? [];
    const longParas = paragraphs.filter((p) => countWords(stripHtml(p)) > 120).length;
    return [
      {
        id: "basic", label: "SEO Cơ bản", icon: Search,
        checks: [
          { id: "kw-title", label: "Từ khóa trong tiêu đề SEO", weight: 15,
            status: kwInTitle === null ? "na" : kwInTitle ? "pass" : "fail",
            message: kwInTitle === null ? "Thêm từ khóa mục tiêu để kiểm tra tiêu đề SEO"
              : kwInTitle ? `Tuyệt vời! Từ khóa "${primaryKw}" có trong SEO Title.`
              : `Từ khóa "${primaryKw}" chưa xuất hiện trong SEO Title.` },
          { id: "kw-desc", label: "Từ khóa trong Meta Description", weight: 12,
            status: kwInDesc === null ? "na" : kwInDesc ? "pass" : "fail",
            message: kwInDesc === null ? "Thêm từ khóa mục tiêu để kiểm tra Meta Description"
              : kwInDesc ? `Đã sử dụng từ khóa "${primaryKw}" trong Meta Description.`
              : `Meta Description chưa chứa từ khóa "${primaryKw}".` },
          { id: "kw-url", label: "Từ khóa trong URL/Slug", weight: 10,
            status: kwInSlug === null ? "na" : kwInSlug ? "pass" : "warning",
            message: kwInSlug === null ? "Thêm từ khóa mục tiêu để kiểm tra URL"
              : kwInSlug ? `Slug "${slug}" có chứa từ khóa.`
              : `Slug chưa chứa từ khóa "${primaryKw}".` },
          { id: "kw-first", label: "Từ khóa trong 10% đầu nội dung", weight: 10,
            status: kwInFirst10 === null ? "na" : kwInFirst10 ? "pass" : "warning",
            message: kwInFirst10 === null ? "Thêm từ khóa mục tiêu để kiểm tra vị trí xuất hiện"
              : kwInFirst10 ? "Từ khóa xuất hiện trong phần đầu nội dung — rất tốt cho SEO."
              : `Từ khóa "${primaryKw}" chưa xuất hiện trong 10% đầu bài.` },
          { id: "kw-content", label: "Từ khóa trong nội dung", weight: 10,
            status: kwInContent === null ? "na" : kwInContent ? "pass" : "fail",
            message: kwInContent === null ? "Thêm từ khóa mục tiêu để kiểm tra"
              : kwInContent ? `Từ khóa "${primaryKw}" có trong nội dung.`
              : `Nội dung chưa chứa từ khóa "${primaryKw}".` },
          { id: "word-count", label: "Độ dài nội dung", weight: 12,
            status: wordCount >= 600 ? "pass" : wordCount >= 300 ? "warning" : plainContent.length < 10 ? "na" : "fail",
            message: wordCount === 0 ? "Nội dung trống — chưa có gì để phân tích."
              : wordCount >= 600 ? `Tuyệt vời! Nội dung ${wordCount} từ — đủ để Google đánh giá cao.`
              : wordCount >= 300 ? `Nội dung ${wordCount} từ — nên viết thêm (khuyến nghị ≥ 600 từ).`
              : `Nội dung quá ngắn (${wordCount} từ). Cần ít nhất 300 từ.` },
          { id: "title-len", label: "Độ dài SEO Title (50–60 ký tự)", weight: 8,
            status: titleLen >= 50 && titleLen <= 60 ? "pass" : titleLen > 0 ? "warning" : "fail",
            message: titleLen === 0 ? "SEO Title trống — bắt buộc phải có."
              : titleLen < 50 ? `SEO Title quá ngắn (${titleLen} ký tự). Nên thêm từ khóa và mô tả.`
              : titleLen <= 60 ? `SEO Title đạt chuẩn (${titleLen} ký tự).`
              : `SEO Title quá dài (${titleLen} ký tự) — Google sẽ cắt bớt.` },
          { id: "desc-len", label: "Độ dài Meta Description (120–155 ký tự)", weight: 8,
            status: descLen >= 120 && descLen <= 155 ? "pass" : descLen > 0 ? "warning" : "fail",
            message: descLen === 0 ? "Meta Description trống — bắt buộc phải có."
              : descLen < 120 ? `Meta Description ngắn (${descLen} ký tự). Nên viết dài hơn để hấp dẫn.`
              : descLen <= 155 ? `Meta Description đạt chuẩn (${descLen} ký tự).`
              : `Meta Description quá dài (${descLen} ký tự) — sẽ bị cắt trên Google.` },
        ],
      },
      {
        id: "extra", label: "Bổ sung", icon: BarChart2,
        checks: [
          { id: "has-h2", label: "Có tiêu đề phụ H2/H3", weight: 8,
            status: content.length < 10 ? "na" : hasH2 ? "pass" : "warning",
            message: content.length < 10 ? "Chưa có nội dung để kiểm tra."
              : hasH2 ? "Nội dung có sử dụng tiêu đề phụ H2/H3 — tốt cho cấu trúc."
              : "Thiếu tiêu đề phụ H2/H3. Nên chia nhỏ nội dung bằng heading." },
          { id: "has-img", label: "Có hình ảnh", weight: 7,
            status: content.length < 10 ? "na" : hasImg ? "pass" : "warning",
            message: hasImg
              ? (imgWithAlt ? "Hình ảnh có alt text — tốt cho SEO và accessibility." : "Có hình ảnh nhưng thiếu alt text — hãy thêm mô tả cho hình.")
              : "Chưa có hình ảnh. Nên thêm ít nhất 1 hình ảnh có alt text." },
          { id: "has-link", label: "Có liên kết trong nội dung", weight: 5,
            status: content.length < 10 ? "na" : hasLink ? "pass" : "warning",
            message: hasLink ? "Nội dung có liên kết — giúp tăng tính liên kết nội bộ."
              : "Chưa có liên kết nội bộ. Nên thêm link đến các trang liên quan." },
          { id: "has-excerpt", label: "Excerpt / Mô tả ngắn", weight: 5,
            status: excerpt.trim().length > 0 ? "pass" : "fail",
            message: excerpt.trim().length > 0 ? `Excerpt đã có (${excerpt.length} ký tự).`
              : "Excerpt trống — cần điền để hiển thị mô tả trong danh sách bài viết." },
          { id: "has-list", label: "Sử dụng danh sách (ul/ol)", weight: 5,
            status: content.length < 10 ? "na" : hasList ? "pass" : "na",
            message: hasList ? "Nội dung có sử dụng danh sách — giúp dễ đọc hơn."
              : "Chưa có danh sách. Có thể thêm bullet points để nội dung dễ đọc hơn." },
        ],
      },
      {
        id: "readability", label: "Khả năng đọc", icon: BookOpen,
        checks: [
          { id: "para-len", label: "Độ dài đoạn văn", weight: 7,
            status: content.length < 10 ? "na" : longParas === 0 ? "pass" : longParas <= 2 ? "warning" : "fail",
            message: content.length < 10 ? "Chưa có nội dung."
              : longParas === 0 ? "Các đoạn văn có độ dài hợp lý — dễ đọc."
              : `Có ${longParas} đoạn văn quá dài (>120 từ). Nên chia nhỏ.` },
          { id: "has-structure", label: "Cấu trúc nội dung rõ ràng", weight: 6,
            status: content.length < 10 ? "na" : (hasH2 && wordCount > 200) ? "pass" : wordCount > 200 ? "warning" : "na",
            message: content.length < 10 ? "Chưa có nội dung."
              : hasH2 ? "Nội dung được chia thành các phần rõ ràng bằng heading."
              : "Nên sử dụng H2/H3 để tạo cấu trúc rõ ràng cho nội dung dài." },
          { id: "kw-density", label: "Mật độ từ khóa", weight: 5,
            status: primaryKw && wordCount > 0
              ? (() => { const d = (plainContent.toLowerCase().split(primaryKw.toLowerCase()).length - 1) / wordCount * 100; return d >= 0.5 && d <= 2.5 ? "pass" : d === 0 ? "fail" : "warning"; })()
              : "na",
            message: primaryKw && wordCount > 0
              ? (() => { const cnt = plainContent.toLowerCase().split(primaryKw.toLowerCase()).length - 1; const d = (cnt / wordCount * 100).toFixed(1); const dv = parseFloat(d); return dv >= 0.5 && dv <= 2.5 ? `Mật độ từ khóa tốt (${d}% — ${cnt} lần).` : dv < 0.5 ? `Từ khóa xuất hiện ít quá (${d}% — ${cnt} lần). Nên dùng thêm.` : `Từ khóa xuất hiện nhiều quá (${d}%). Có thể bị Google phạt.`; })()
              : "Thêm từ khóa mục tiêu để kiểm tra mật độ." },
        ],
      },
    ];
  }, [title, slug, content, excerpt, seoTitle, seoDescription, plainContent, wordCount, first10pct, primaryKw]);

  const score = useMemo(() => {
    const allChecks = checkGroups.flatMap((g) => g.checks).filter((c) => c.status !== "na");
    if (allChecks.length === 0) return 0;
    const totalWeight = allChecks.reduce((s, c) => s + c.weight, 0);
    const passedWeight = allChecks.filter((c) => c.status === "pass").reduce((s, c) => s + c.weight, 0);
    const warningWeight = allChecks.filter((c) => c.status === "warning").reduce((s, c) => s + c.weight * 0.5, 0);
    return Math.round(((passedWeight + warningWeight) / totalWeight) * 100);
  }, [checkGroups]);

  const addKeyword = useCallback(() => {
    const kw = kwInput.trim();
    if (kw && !keywords.includes(kw)) setKeywords((p) => [...p, kw]);
    setKwInput("");
  }, [kwInput, keywords]);

  const runAiAnalysis = async () => {
    if (!title.trim()) { setAiError("Vui lòng nhập tiêu đề trước"); return; }
    setAiLoading(true); setAiError(""); setAiResult(null); setAiApplied(new Set());
    const parts: string[] = [`TIÊU ĐỀ: "${title}"`];
    if (plainContent) parts.push(`NỘI DUNG (${wordCount} từ):\n${plainContent.slice(0, 3000)}`);
    else parts.push("NỘI DUNG: [Chưa có]");
    parts.push(`EXCERPT: "${excerpt || "chưa có"}"`);
    parts.push(`SEO TITLE: "${seoTitle || "chưa có"}" (${seoTitle.length} ký tự)`);
    parts.push(`SEO DESCRIPTION: "${seoDescription || "chưa có"}" (${seoDescription.length} ký tự)`);
    parts.push(`URL/SLUG: "${slug}"`);
    if (keywords.length) parts.push(`TỪ KHÓA MỤC TIÊU: ${keywords.join(", ")}`);
    parts.push(`ĐIỂM SEO HIỆN TẠI: ${score}/100`);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: parts.join("\n\n"), type: "seo_analyze", provider: "auto" }),
      });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || data.error) { setAiError(data.error ?? "Lỗi không xác định"); return; }
      const raw = (data.text ?? "").trim();
      const jsonStr = raw.startsWith("{") ? raw : raw.match(/\{[\s\S]*\}/)?.[0] ?? "";
      setAiResult(JSON.parse(jsonStr) as SeoResult);
    } catch {
      setAiError("Không thể phân tích AI. Kiểm tra Settings → AI Providers.");
    } finally { setAiLoading(false); }
  };

  const applyAiField = (field: keyof SeoApplyData, value: string) => {
    onApply({ [field]: value });
    setAiApplied((p) => new Set([...p, field]));
  };

  const applyAiAll = () => {
    if (!aiResult) return;
    const d: SeoApplyData = { seoTitle: aiResult.suggestions.seoTitle, seoDescription: aiResult.suggestions.seoDescription };
    if (showExcerpt) d.excerpt = aiResult.suggestions.excerpt;
    onApply(d);
    setAiApplied(new Set(showExcerpt ? ["seoTitle", "seoDescription", "excerpt"] : ["seoTitle", "seoDescription"]));
  };

  const totalIssues = checkGroups.flatMap((g) => g.checks).filter((c) => c.status === "fail").length;
  const totalWarnings = checkGroups.flatMap((g) => g.checks).filter((c) => c.status === "warning").length;

  // ── Schema JSON-LD ────────────────────────────────────────────────────────
  const jsonLd = useMemo(() =>
    generateJsonLd(schType, schFields, faqItems, title, seoDescription, slug),
    [schType, schFields, faqItems, title, seoDescription, slug]
  );

  // ── Tab definitions ───────────────────────────────────────────────────────
  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Tổng quan", icon: Search },
    { id: "advanced", label: "Nâng cao", icon: Settings2 },
    { id: "schema", label: "Schema", icon: Code2 },
    { id: "social", label: "Mạng xã hội", icon: Share2 },
  ];

  return (
    <div className="space-y-0 rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
      {/* ── Tab bar ── */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        {/* Score badge on left */}
        <div className="flex items-center gap-2 px-4 border-r border-slate-200">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shrink-0">
            <Globe className="h-3 w-3 text-white" />
          </div>
          <ScoreGauge score={score} />
        </div>
        {/* Tabs */}
        <div className="flex flex-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? "border-indigo-600 text-indigo-700 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"}`}>
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
        {/* Summary badges */}
        <div className="flex items-center gap-1.5 px-3 border-l border-slate-200">
          {totalIssues > 0 && <span className="rounded-full bg-red-100 text-red-600 px-2 py-0.5 text-[10px] font-bold">{totalIssues} lỗi</span>}
          {totalWarnings > 0 && <span className="rounded-full bg-amber-100 text-amber-600 px-2 py-0.5 text-[10px] font-bold">{totalWarnings} cảnh báo</span>}
          {totalIssues === 0 && totalWarnings === 0 && <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">✓ OK</span>}
          <span className="text-[10px] text-slate-400">{wordCount} từ</span>
        </div>
      </div>

      <div className="p-4">
        {/* ════════════════ TAB: OVERVIEW ════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-3">
            <SerpPreview title={seoTitle || title} slug={slug} description={seoDescription || excerpt} />

            {/* Keywords */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-violet-500" />Từ khóa mục tiêu
              </p>
              <div className="flex gap-2">
                <input type="text" value={kwInput}
                  onChange={(e) => setKwInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                  placeholder="Nhập từ khóa, Enter để thêm..."
                  className="flex-1 h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400" />
                <button type="button" onClick={addKeyword} disabled={!kwInput.trim()}
                  className="h-8 w-8 rounded-lg bg-violet-600 text-white flex items-center justify-center disabled:opacity-30 hover:bg-violet-700">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {keywords.length > 0 ? (
                <div className="space-y-1.5">
                  {keywords.map((kw, i) => (
                    <div key={kw} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5">
                      <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${i === 0 ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-500"}`}>
                        {i === 0 ? "Chính" : `Phụ ${i}`}
                      </span>
                      <span className="text-xs text-slate-700 flex-1">{kw}</span>
                      <button type="button" onClick={() => setKeywords((p) => p.filter((k) => k !== kw))} className="text-slate-300 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Thêm từ khóa để bật kiểm tra chi tiết</p>
              )}
            </div>

            {checkGroups.map((group) => <CheckGroup key={group.id} group={group} />)}

            {/* AI Deep Analysis */}
            <div className="rounded-xl border-2 border-violet-200 bg-violet-50 overflow-hidden">
              <button type="button" onClick={() => setAiOpen(!aiOpen)}
                className="w-full flex items-center gap-2.5 px-4 py-3.5 hover:bg-violet-100 transition-colors">
                <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-violet-900">Phân tích chuyên sâu bằng AI</p>
                  <p className="text-[10px] text-violet-500">Gợi ý nội dung + CTA + tips cải thiện</p>
                </div>
                {aiOpen ? <ChevronUp className="h-4 w-4 text-violet-400" /> : <ChevronDown className="h-4 w-4 text-violet-400" />}
              </button>
              {aiOpen && (
                <div className="border-t border-violet-100 px-4 pb-4 pt-3 space-y-3">
                  {aiError && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">{aiError}</p>
                    </div>
                  )}
                  <Button type="button" onClick={runAiAnalysis} loading={aiLoading}
                    disabled={!title.trim()} className="bg-violet-600 hover:bg-violet-700 text-white w-full h-10">
                    <Sparkles className="h-4 w-4" />
                    {aiLoading ? "AI đang phân tích toàn bộ nội dung..." : `Phân tích AI (điểm hiện tại: ${score}/100)`}
                  </Button>
                  {aiResult && (
                    <div className="space-y-3 pt-1">
                      <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-indigo-600">{aiResult.score}</p>
                          <p className="text-[10px] text-slate-400">Điểm AI</p>
                        </div>
                        <div className="flex-1 text-xs text-slate-600 space-y-1">
                          {aiResult.issues.slice(0, 3).map((issue, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              {issue.severity === "error" ? <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" /> :
                                issue.severity === "warning" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" /> :
                                  <Info className="h-3.5 w-3.5 text-sky-500 shrink-0 mt-0.5" />}
                              <span>{issue.message}</span>
                            </div>
                          ))}
                          {aiResult.issues.length > 3 && <p className="text-slate-400">+{aiResult.issues.length - 3} vấn đề khác...</p>}
                        </div>
                      </div>
                      {keywords.length > 0 && ((aiResult.keywordsPresent?.length ?? 0) > 0 || (aiResult.keywordsMissing?.length ?? 0) > 0) && (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                          <p className="text-xs font-bold text-slate-600">Phân tích từ khóa mục tiêu</p>
                          {(aiResult.keywordsPresent?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {(aiResult.keywordsPresent ?? []).map((kw) => <span key={kw} className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs">✓ {kw}</span>)}
                            </div>
                          )}
                          {(aiResult.keywordsMissing?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {(aiResult.keywordsMissing ?? []).map((kw) => <span key={kw} className="rounded-full bg-red-100 text-red-600 px-2 py-0.5 text-xs">✗ {kw}</span>)}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-700">Nội dung tối ưu đề xuất</p>
                        <button type="button" onClick={applyAiAll} className="text-xs font-bold text-violet-600 hover:text-violet-800 bg-white border border-violet-200 px-3 py-1 rounded-full">Áp dụng tất cả →</button>
                      </div>
                      <AiSuggestionCard label="SEO Title" value={aiResult.suggestions.seoTitle}
                        note={aiResult.suggestions.seoTitleNote} limit={60}
                        applied={aiApplied.has("seoTitle")} onApply={() => applyAiField("seoTitle", aiResult.suggestions.seoTitle)} />
                      <AiSuggestionCard label="SEO Description" value={aiResult.suggestions.seoDescription}
                        note={aiResult.suggestions.seoDescriptionNote} limit={155}
                        applied={aiApplied.has("seoDescription")} onApply={() => applyAiField("seoDescription", aiResult.suggestions.seoDescription)} />
                      {showExcerpt && (
                        <AiSuggestionCard label="Excerpt" value={aiResult.suggestions.excerpt}
                          limit={200} applied={aiApplied.has("excerpt")} onApply={() => applyAiField("excerpt", aiResult.suggestions.excerpt)} />
                      )}
                      {aiResult.suggestions.ctaSuggestion && (
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                          <p className="text-xs font-bold text-indigo-700 mb-1.5 flex items-center gap-1"><Target className="h-3.5 w-3.5" />Gợi ý CTA</p>
                          <p className="text-sm text-indigo-800">{aiResult.suggestions.ctaSuggestion}</p>
                        </div>
                      )}
                      {(aiResult.suggestions.contentTips?.length ?? 0) > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                          <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5"><Lightbulb className="h-3.5 w-3.5" />Gợi ý cải thiện nội dung</p>
                          <ul className="space-y-1.5">
                            {(aiResult.suggestions.contentTips ?? []).map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                                <span className="h-4 w-4 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(aiResult.keywordsRecommended?.length ?? 0) > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                          <p className="text-xs font-bold text-slate-700 mb-2">Thêm từ khóa đề xuất</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(aiResult.keywordsRecommended ?? []).map((kw) => (
                              <button key={kw} type="button" onClick={() => { if (!keywords.includes(kw)) setKeywords((p) => [...p, kw]); }}
                                className="rounded-full bg-slate-100 hover:bg-violet-100 text-slate-600 hover:text-violet-700 px-2.5 py-1 text-xs transition-colors">
                                <Plus className="h-3 w-3 inline mr-0.5" />{kw}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════ TAB: ADVANCED ════════════════ */}
        {activeTab === "advanced" && (
          <div className="space-y-5">
            {/* Robots meta */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-slate-500" />Robots Meta
              </p>
              <p className="text-xs text-slate-500 mb-3">Kiểm soát cách Google thu thập và lập chỉ mục trang này.</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "index,follow", label: "Index + Follow", desc: "Mặc định — cho phép lập chỉ mục và theo liên kết" },
                  { value: "noindex,follow", label: "Noindex + Follow", desc: "Không lập chỉ mục, vẫn theo liên kết" },
                  { value: "index,nofollow", label: "Index + Nofollow", desc: "Lập chỉ mục nhưng không theo liên kết" },
                  { value: "noindex,nofollow", label: "Noindex + Nofollow", desc: "Không lập chỉ mục, không theo liên kết" },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-colors ${robots === opt.value ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}>
                    <input type="radio" name="robots_ui" value={opt.value} checked={robots === opt.value}
                      onChange={() => setRobots(opt.value)} className="mt-0.5 accent-indigo-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Canonical URL */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-500" />Canonical URL
              </p>
              <p className="text-xs text-slate-500 mb-2">Chỉ đặt khi trang này là bản sao của trang khác. Để trống nếu đây là URL chính.</p>
              <input type="text" value={canonical} onChange={(e) => setCanonical(e.target.value)}
                placeholder={`https://yoursite.com/${slug}`}
                className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* Apply */}
            <div className="pt-1 flex gap-2">
              <Button type="button" onClick={() => onApply({ robotsMeta: robots, canonicalUrl: canonical })}
                className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Lưu cài đặt nâng cao
              </Button>
              {robots !== initRobots || canonical !== initCanonical ? (
                <span className="self-center text-xs text-amber-600 font-medium">Có thay đổi chưa lưu</span>
              ) : null}
            </div>
          </div>
        )}

        {/* ════════════════ TAB: SCHEMA ════════════════ */}
        {activeTab === "schema" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Dữ liệu có cấu trúc (JSON-LD)</p>
                <p className="text-xs text-slate-500 mt-0.5">Giúp Google hiểu nội dung và hiển thị rich results.</p>
              </div>
            </div>

            {/* Schema type selector */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Loại Schema</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "Article", label: "Bài viết", desc: "Article" },
                  { value: "FAQPage", label: "FAQ", desc: "FAQPage" },
                  { value: "LocalBusiness", label: "Doanh nghiệp", desc: "LocalBusiness" },
                  { value: "Service", label: "Dịch vụ", desc: "Service" },
                  { value: "Product", label: "Sản phẩm", desc: "Product" },
                  { value: "BreadcrumbList", label: "Breadcrumb", desc: "BreadcrumbList" },
                ].map((t) => (
                  <button key={t.value} type="button" onClick={() => setSchType(t.value)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-colors ${schType === t.value ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <p className="text-xs font-semibold text-slate-800">{t.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic fields */}
            {schType === "Article" && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-600">Thông tin bài viết</p>
                {[
                  { key: "author", label: "Tác giả", placeholder: "Nguyễn Văn A" },
                  { key: "publisherName", label: "Tên tổ chức", placeholder: "Công ty ABC" },
                  { key: "publisherLogo", label: "Logo URL", placeholder: "https://..." },
                  { key: "datePublished", label: "Ngày đăng", placeholder: "2025-01-01" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">{f.label}</label>
                    <input type="text" value={schFields[f.key] ?? ""} onChange={(e) => setSchFields(p => ({...p, [f.key]: e.target.value}))}
                      placeholder={f.placeholder}
                      className="w-full h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                  </div>
                ))}
              </div>
            )}

            {schType === "FAQPage" && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-600">Câu hỏi thường gặp</p>
                  <button type="button" onClick={() => setFaqItems(p => [...p, {q:"",a:""}])}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
                    <Plus className="h-3.5 w-3.5" />Thêm câu hỏi
                  </button>
                </div>
                {faqItems.map((item, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">Q{i+1}</span>
                      {faqItems.length > 1 && (
                        <button type="button" onClick={() => setFaqItems(p => p.filter((_,j) => j !== i))}
                          className="text-slate-300 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                    <input type="text" value={item.q} onChange={(e) => setFaqItems(p => p.map((it,j) => j===i ? {...it,q:e.target.value} : it))}
                      placeholder="Câu hỏi..."
                      className="w-full h-8 rounded-lg border border-slate-200 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                    <textarea value={item.a} onChange={(e) => setFaqItems(p => p.map((it,j) => j===i ? {...it,a:e.target.value} : it))}
                      placeholder="Câu trả lời..."
                      rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none" />
                  </div>
                ))}
              </div>
            )}

            {schType === "LocalBusiness" && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-600">Thông tin doanh nghiệp</p>
                {[
                  { key: "name", label: "Tên doanh nghiệp", placeholder: "Công ty ABC" },
                  { key: "phone", label: "Điện thoại", placeholder: "0901 234 567" },
                  { key: "streetAddress", label: "Địa chỉ", placeholder: "123 Đường ABC" },
                  { key: "city", label: "Thành phố", placeholder: "Hà Nội" },
                  { key: "priceRange", label: "Mức giá", placeholder: "$$" },
                  { key: "openingHours", label: "Giờ mở cửa", placeholder: "Mo-Fr 08:00-18:00" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">{f.label}</label>
                    <input type="text" value={schFields[f.key] ?? ""} onChange={(e) => setSchFields(p => ({...p, [f.key]: e.target.value}))}
                      placeholder={f.placeholder}
                      className="w-full h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                  </div>
                ))}
              </div>
            )}

            {schType === "Service" && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-600">Thông tin dịch vụ</p>
                {[
                  { key: "name", label: "Tên dịch vụ", placeholder: "Dịch vụ vận chuyển" },
                  { key: "serviceType", label: "Loại dịch vụ", placeholder: "Taxi, Vận tải..." },
                  { key: "provider", label: "Nhà cung cấp", placeholder: "Công ty ABC" },
                  { key: "areaServed", label: "Khu vực phục vụ", placeholder: "Hà Nội, TP.HCM..." },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">{f.label}</label>
                    <input type="text" value={schFields[f.key] ?? ""} onChange={(e) => setSchFields(p => ({...p, [f.key]: e.target.value}))}
                      placeholder={f.placeholder}
                      className="w-full h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                  </div>
                ))}
              </div>
            )}

            {schType === "Product" && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-600">Thông tin sản phẩm</p>
                {[
                  { key: "name", label: "Tên sản phẩm", placeholder: "Sản phẩm ABC" },
                  { key: "brand", label: "Thương hiệu", placeholder: "Brand name" },
                  { key: "price", label: "Giá", placeholder: "299000" },
                  { key: "currency", label: "Tiền tệ", placeholder: "VND" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">{f.label}</label>
                    <input type="text" value={schFields[f.key] ?? ""} onChange={(e) => setSchFields(p => ({...p, [f.key]: e.target.value}))}
                      placeholder={f.placeholder}
                      className="w-full h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                  </div>
                ))}
              </div>
            )}

            {schType === "BreadcrumbList" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-600 mb-2">Breadcrumb tự động từ slug</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Trang chủ", ...slug.split("/").filter(Boolean)].map((part, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-white border border-slate-200 rounded px-2 py-0.5">
                      <span className="text-[10px] text-slate-400">{i+1}</span>
                      <span className="text-slate-700">{part.replace(/-/g, " ")}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* JSON-LD Preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-900 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
                <span className="text-xs font-mono text-slate-300">JSON-LD Preview</span>
                <CopyButton text={`<script type="application/ld+json">\n${jsonLd}\n</script>`} />
              </div>
              <pre className="text-[11px] text-emerald-400 font-mono p-4 overflow-x-auto max-h-60 scrollbar-thin">
                {jsonLd}
              </pre>
            </div>

            <Button type="button" onClick={() => onApply({ schemaType: schType, schemaData: JSON.stringify({...schFields, _faq: faqItems}) })}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
              Lưu Schema
            </Button>
          </div>
        )}

        {/* ════════════════ TAB: SOCIAL ════════════════ */}
        {activeTab === "social" && (
          <div className="space-y-6">
            {/* Facebook / Open Graph */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                <div className="h-5 w-5 rounded bg-blue-600 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">f</span>
                </div>
                <p className="text-sm font-bold text-slate-800">Facebook / Open Graph</p>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-600">OG Title</label>
                    <span className="text-[10px] text-slate-400">{ogT.length}/95</span>
                  </div>
                  <input type="text" value={ogT} onChange={(e) => setOgT(e.target.value)}
                    placeholder={seoTitle || title || "Tiêu đề cho Facebook..."}
                    className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  <p className="text-[10px] text-slate-400 mt-0.5">Để trống sẽ dùng SEO Title</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-600">OG Description</label>
                    <span className="text-[10px] text-slate-400">{ogD.length}/200</span>
                  </div>
                  <textarea value={ogD} onChange={(e) => setOgD(e.target.value)} rows={2}
                    placeholder={seoDescription || excerpt || "Mô tả cho Facebook..."}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                </div>
                <div>
                  <ImagePicker
                    tenantId={tenantId}
                    value={ogI}
                    label="OG Image"
                    onChange={setOgI}
                    aspectHint="1200×630px"
                  />
                </div>
              </div>

              {/* FB Preview */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-3 pt-3 pb-1 flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />Xem trước Facebook</p>
                <div className="mx-3 mb-3 rounded-lg overflow-hidden border border-slate-200">
                  {ogI ? (
                    <img src={ogI} alt="OG" className="w-full h-36 object-cover bg-slate-100" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <span className="text-xs text-slate-400">Ảnh OG Image (1200×630)</span>
                    </div>
                  )}
                  <div className="bg-slate-50 px-3 py-2 border-t border-slate-200">
                    <p className="text-[10px] uppercase text-slate-400">yoursite.com</p>
                    <p className="text-sm font-semibold text-slate-900 leading-snug truncate">{ogT || seoTitle || title || "Tiêu đề bài viết"}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ogD || seoDescription || excerpt || "Mô tả bài viết sẽ hiển thị ở đây..."}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Twitter Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                <div className="h-5 w-5 rounded bg-black flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">X</span>
                </div>
                <p className="text-sm font-bold text-slate-800">Twitter / X Card</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Loại Card</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "summary", label: "Summary", desc: "Ảnh nhỏ bên trái" },
                    { value: "summary_large_image", label: "Large Image", desc: "Ảnh lớn phía trên" },
                  ].map((c) => (
                    <label key={c.value} className={`flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${twCard === c.value ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <input type="radio" name="tw_card_ui" value={c.value} checked={twCard === c.value} onChange={() => setTwCard(c.value)} className="mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{c.label}</p>
                        <p className="text-[10px] text-slate-500">{c.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Twitter Preview */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide px-3 pt-3 pb-1 flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" />Xem trước Twitter / X</p>
                <div className={`mx-3 mb-3 rounded-2xl overflow-hidden border border-slate-200 ${twCard === "summary" ? "flex" : ""}`}>
                  {twCard === "summary_large_image" ? (
                    <>
                      {ogI ? (
                        <img src={ogI} alt="Twitter" className="w-full h-40 object-cover bg-slate-100" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="w-full h-40 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                          <span className="text-xs text-slate-400">Ảnh card (1200×628)</span>
                        </div>
                      )}
                      <div className="px-3 py-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{ogT || seoTitle || title || "Tiêu đề"}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ogD || seoDescription || excerpt || "Mô tả..."}</p>
                        <p className="text-[10px] text-slate-400 mt-1">yoursite.com</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 shrink-0 bg-slate-100 flex items-center justify-center">
                        {ogI ? <img src={ogI} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] text-slate-400">Ảnh</span>}
                      </div>
                      <div className="flex-1 px-3 py-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{ogT || seoTitle || title || "Tiêu đề"}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ogD || seoDescription || excerpt || "Mô tả..."}</p>
                        <p className="text-[10px] text-slate-400 mt-1">yoursite.com</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button type="button" onClick={() => onApply({ ogTitle: ogT, ogDescription: ogD, ogImage: ogI, twitterCard: twCard })}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
              Lưu cài đặt Mạng xã hội
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
