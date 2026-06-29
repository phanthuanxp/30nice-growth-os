"use client";

import { useState } from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronDown, Sparkles, Loader2,
  FileText, Search, Link2, Image as ImageIcon, Code2, BarChart2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CheckItem {
  id: string;
  label: string;
  status: "pass" | "fail" | "warning";
  message: string;
}

interface AuditCategory {
  label: string;
  icon: React.ElementType;
  checks: CheckItem[];
}

interface PostSeoAuditProps {
  title: string;
  content: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  excerpt?: string | null;
  targetKeyword?: string | null;
  seoScore?: number | null;
  qualityScore?: number | null;
}

function runLocalAudit(props: PostSeoAuditProps): AuditCategory[] {
  const { title, content = "", seoTitle, seoDescription, excerpt, targetKeyword } = props;
  const wordCount = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  const internalLinks = (content.match(/href="\/[^"]+"/g) ?? []).length;
  const imgTags = (content.match(/<img[^>]*>/g) ?? []);
  const imgWithAlt = imgTags.filter((t) => /alt="[^"]+"/i.test(t)).length;
  const hasH2 = /<h2/i.test(content);
  const hasH3 = /<h3/i.test(content);
  const hasSchema = content.includes("application/ld+json") || content.includes("itemscope");
  const keyword = (targetKeyword ?? "").toLowerCase().trim();
  const contentLower = (content + " " + title).toLowerCase();
  const kwInTitle = keyword ? title.toLowerCase().includes(keyword) : null;
  const kwInContent = keyword
    ? (() => {
        const matches = (contentLower.match(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
        const density = wordCount > 0 ? (matches / wordCount) * 100 : 0;
        return density;
      })()
    : null;

  return [
    {
      label: "Tiêu đề & Meta",
      icon: FileText,
      checks: [
        {
          id: "title_len",
          label: "Tiêu đề (H1)",
          status: title.length >= 30 && title.length <= 70 ? "pass" : title.length > 0 ? "warning" : "fail",
          message: title.length === 0
            ? "Chưa có tiêu đề"
            : title.length < 30
            ? `Quá ngắn (${title.length} ký tự, cần 30-70)`
            : title.length > 70
            ? `Quá dài (${title.length} ký tự, nên ≤70)`
            : `Đạt (${title.length} ký tự)`,
        },
        {
          id: "seo_title",
          label: "SEO Title",
          status: !seoTitle ? "fail" : seoTitle.length >= 50 && seoTitle.length <= 60 ? "pass" : "warning",
          message: !seoTitle
            ? "Chưa nhập SEO Title"
            : seoTitle.length < 50
            ? `Quá ngắn (${seoTitle.length}/60 ký tự, tối ưu 50-60)`
            : seoTitle.length > 60
            ? `Quá dài (${seoTitle.length}/60 ký tự)`
            : `Đạt (${seoTitle.length} ký tự)`,
        },
        {
          id: "meta_desc",
          label: "Meta Description",
          status: !seoDescription ? "fail" : seoDescription.length >= 120 && seoDescription.length <= 155 ? "pass" : "warning",
          message: !seoDescription
            ? "Chưa nhập Meta Description"
            : seoDescription.length < 120
            ? `Quá ngắn (${seoDescription.length}/155 ký tự, tối ưu 120-155)`
            : seoDescription.length > 155
            ? `Quá dài (${seoDescription.length}/155 ký tự)`
            : `Đạt (${seoDescription.length} ký tự)`,
        },
        {
          id: "excerpt",
          label: "Excerpt (tóm tắt)",
          status: excerpt && excerpt.length >= 50 ? "pass" : excerpt ? "warning" : "fail",
          message: !excerpt ? "Chưa có excerpt" : excerpt.length < 50 ? `Quá ngắn (${excerpt.length} ký tự)` : `Đạt`,
        },
      ],
    },
    {
      label: "Từ khóa",
      icon: Search,
      checks: [
        ...(keyword
          ? [
              {
                id: "kw_title",
                label: "Từ khóa trong tiêu đề",
                status: kwInTitle ? "pass" : "fail" as "pass" | "fail" | "warning",
                message: kwInTitle ? `"${keyword}" xuất hiện trong tiêu đề` : `Chưa có "${keyword}" trong tiêu đề`,
              },
              {
                id: "kw_density",
                label: "Mật độ từ khóa",
                status: (kwInContent ?? 0) >= 0.5 && (kwInContent ?? 0) <= 2.5 ? "pass" : (kwInContent ?? 0) > 0 ? "warning" : "fail" as "pass" | "fail" | "warning",
                message:
                  (kwInContent ?? 0) === 0
                    ? `"${keyword}" không xuất hiện trong nội dung`
                    : `Mật độ ${(kwInContent ?? 0).toFixed(2)}% ${(kwInContent ?? 0) > 2.5 ? "(quá nhiều, nhồi từ khóa)" : "(tốt: 0.5-2.5%)"}`,
              },
            ]
          : [
              {
                id: "kw_missing",
                label: "Từ khóa mục tiêu",
                status: "warning" as "pass" | "fail" | "warning",
                message: "Chưa đặt từ khóa mục tiêu cho bài viết",
              },
            ]),
      ],
    },
    {
      label: "Nội dung",
      icon: BarChart2,
      checks: [
        {
          id: "word_count",
          label: "Độ dài nội dung",
          status: wordCount >= 600 ? "pass" : wordCount >= 300 ? "warning" : "fail",
          message:
            wordCount === 0
              ? "Chưa có nội dung"
              : wordCount < 300
              ? `Quá ngắn (${wordCount} từ, cần ≥300)`
              : wordCount < 600
              ? `Chấp nhận được (${wordCount} từ, tốt nhất ≥600)`
              : `Đạt (${wordCount} từ)`,
        },
        {
          id: "headings",
          label: "Tiêu đề phụ (H2/H3)",
          status: hasH2 ? "pass" : "fail",
          message: !hasH2
            ? "Không có H2 — cần chia nhỏ nội dung"
            : hasH3
            ? "Có H2 và H3 — cấu trúc tốt"
            : "Có H2 — thêm H3 nếu nội dung dài",
        },
      ],
    },
    {
      label: "Liên kết & Hình ảnh",
      icon: Link2,
      checks: [
        {
          id: "internal_links",
          label: "Liên kết nội bộ",
          status: internalLinks >= 2 ? "pass" : internalLinks >= 1 ? "warning" : "fail",
          message:
            internalLinks === 0
              ? "Không có liên kết nội bộ — cần ≥2 link đến bài khác"
              : internalLinks === 1
              ? `Chỉ có 1 liên kết nội bộ (tốt nhất ≥2)`
              : `Đạt (${internalLinks} liên kết nội bộ)`,
        },
        {
          id: "img_alt",
          label: "Alt text hình ảnh",
          status:
            imgTags.length === 0
              ? "warning"
              : imgWithAlt === imgTags.length
              ? "pass"
              : imgWithAlt > 0
              ? "warning"
              : "fail",
          message:
            imgTags.length === 0
              ? "Không có hình ảnh trong bài"
              : imgWithAlt === imgTags.length
              ? `Tất cả ${imgTags.length} hình có alt text`
              : `${imgWithAlt}/${imgTags.length} hình có alt text (thiếu ${imgTags.length - imgWithAlt})`,
        },
      ],
    },
    {
      label: "Schema & Kỹ thuật",
      icon: Code2,
      checks: [
        {
          id: "schema",
          label: "Schema Markup",
          status: hasSchema ? "pass" : "warning",
          message: hasSchema ? "Có schema markup trong nội dung" : "Chưa có schema — dùng tab Schema trong SEO Editor",
        },
      ],
    },
  ];
}

function calcScore(categories: AuditCategory[]): number {
  const all = categories.flatMap((c) => c.checks);
  if (all.length === 0) return 0;
  const score = all.reduce((acc, c) => {
    if (c.status === "pass") return acc + 1;
    if (c.status === "warning") return acc + 0.5;
    return acc;
  }, 0);
  return Math.round((score / all.length) * 100);
}

function StatusIcon({ status }: { status: "pass" | "fail" | "warning" }) {
  if (status === "pass") return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === "fail") return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
  return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 34;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg viewBox="0 0 88 88" className="w-20 h-20">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 44 44)" />
      <text x="44" y="40" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>{score}</text>
      <text x="44" y="54" textAnchor="middle" fontSize="9" fill="#94a3b8">/100</text>
    </svg>
  );
}

export function PostSeoAuditCard(props: PostSeoAuditProps) {
  const [open, setOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");

  const categories = runLocalAudit(props);
  const score = calcScore(categories);
  const allIssues = categories.flatMap((c) => c.checks).filter((c) => c.status !== "pass");
  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";

  const runAiAudit = async () => {
    setAiLoading(true); setAiError(""); setAiResult(null);
    try {
      const parts: string[] = [];
      if (props.targetKeyword) parts.push(`Từ khóa mục tiêu: ${props.targetKeyword}`);
      parts.push(`Tiêu đề: ${props.title}`);
      if (props.seoTitle) parts.push(`SEO Title: ${props.seoTitle}`);
      if (props.seoDescription) parts.push(`Meta Description: ${props.seoDescription}`);
      if (props.excerpt) parts.push(`Excerpt: ${props.excerpt}`);
      if (props.content) parts.push(`Nội dung:\n${props.content.replace(/<[^>]*>/g, " ").slice(0, 3000)}`);

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: parts.join("\n\n"), type: "seo_analyze", provider: "auto" }),
      });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || data.error) { setAiError(data.error ?? "Lỗi AI"); return; }
      try {
        const parsed = JSON.parse(data.text ?? "{}") as {
          score?: number;
          issues?: { severity: string; message: string }[];
          suggestions?: { seoTitle?: string; seoDescription?: string; contentTips?: string[] };
          keywordsRecommended?: string[];
        };
        const lines: string[] = [`**Điểm AI: ${parsed.score ?? "?"}/100**`];
        if (parsed.issues?.length) {
          lines.push("", "**Vấn đề:**");
          for (const i of parsed.issues.slice(0, 8)) lines.push(`• ${i.message}`);
        }
        if (parsed.suggestions?.seoTitle) lines.push("", `**Gợi ý SEO Title:** ${parsed.suggestions.seoTitle}`);
        if (parsed.suggestions?.seoDescription) lines.push(`**Gợi ý Meta:** ${parsed.suggestions.seoDescription}`);
        if (parsed.suggestions?.contentTips?.length) {
          lines.push("", "**Cải thiện nội dung:**");
          for (const t of parsed.suggestions.contentTips) lines.push(`• ${t}`);
        }
        if (parsed.keywordsRecommended?.length) lines.push("", `**Từ khóa đề xuất:** ${parsed.keywordsRecommended.join(", ")}`);
        setAiResult(lines.join("\n"));
      } catch {
        setAiResult(data.text ?? "");
      }
    } catch {
      setAiError("Lỗi kết nối AI");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <ScoreRing score={score} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">SEO Audit</p>
          <p className={`text-xl font-bold ${scoreColor}`}>
            {score >= 80 ? "Tốt" : score >= 50 ? "Cần cải thiện" : "Yếu"}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {allIssues.filter((i) => i.status === "fail").length > 0 && (
              <Badge variant="danger">{allIssues.filter((i) => i.status === "fail").length} lỗi</Badge>
            )}
            {allIssues.filter((i) => i.status === "warning").length > 0 && (
              <Badge variant="warning">{allIssues.filter((i) => i.status === "warning").length} cảnh báo</Badge>
            )}
            {allIssues.length === 0 && <Badge variant="success">Tất cả đã đạt</Badge>}
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {categories.map((cat) => (
            <div key={cat.label}>
              <div className="flex items-center gap-1.5 mb-2">
                <cat.icon className="h-3.5 w-3.5 text-indigo-500" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{cat.label}</p>
              </div>
              <div className="space-y-1.5">
                {cat.checks.map((chk) => (
                  <div key={chk.id} className="flex items-start gap-2">
                    <StatusIcon status={chk.status} />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-slate-700">{chk.label}</span>
                      <span className="text-xs text-slate-400 ml-2">{chk.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={runAiAudit}
              disabled={aiLoading}
              className="gap-1.5"
            >
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              AI Phân tích chuyên sâu
            </Button>
            {aiError && <p className="text-sm text-red-500">{aiError}</p>}
            {aiResult && (
              <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-sm text-indigo-900 whitespace-pre-wrap leading-relaxed">
                {aiResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
