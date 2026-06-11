"use client";

import { useState, useRef } from "react";
import {
  Sparkles, Check, ChevronDown, ChevronUp, AlertTriangle,
  AlertCircle, Info, X, Plus, Lightbulb, Target, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SeoIssue {
  severity: "error" | "warning" | "info";
  field: string;
  message: string;
}

interface SeoSuggestions {
  seoTitle: string;
  seoTitleNote?: string;
  seoDescription: string;
  seoDescriptionNote?: string;
  excerpt: string;
  ctaSuggestion?: string;
  contentTips?: string[];
}

interface SeoResult {
  score: number;
  issues: SeoIssue[];
  suggestions: SeoSuggestions;
  keywordsRecommended: string[];
  keywordsPresent: string[];
  keywordsMissing: string[];
}

interface ApplyData {
  seoTitle?: string;
  seoDescription?: string;
  excerpt?: string;
}

interface AiSeoHelperProps {
  title: string;
  content?: string;
  currentExcerpt?: string;
  currentSeoTitle?: string;
  currentSeoDescription?: string;
  showExcerpt?: boolean;
  onApply: (data: ApplyData) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
}

function charColor(len: number, limit: number) {
  if (len === 0) return "text-slate-400";
  if (len > limit) return "text-red-500";
  if (len >= limit * 0.8) return "text-emerald-600";
  return "text-amber-500";
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Tốt" : score >= 50 ? "Cần cải thiện" : "Yếu";
  const r = 32, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 80 80" className="w-16 h-16 shrink-0">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 40 40)" />
        <text x="40" y="36" textAnchor="middle" fontSize="16" fontWeight="bold" fill={color}>{score}</text>
        <text x="40" y="48" textAnchor="middle" fontSize="8" fill="#94a3b8">/100</text>
      </svg>
      <div>
        <p className="text-sm font-bold" style={{ color }}>{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">Điểm SEO tổng thể</p>
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: SeoIssue }) {
  const cfg = {
    error: { Icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 border-red-100", label: "Lỗi" },
    warning: { Icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50 border-amber-100", label: "Cảnh báo" },
    info: { Icon: Info, color: "text-sky-600", bg: "bg-sky-50 border-sky-100", label: "Gợi ý" },
  }[issue.severity];
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${cfg.bg}`}>
      <cfg.Icon className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
      <div className="min-w-0">
        <span className={`text-[10px] font-bold uppercase ${cfg.color}`}>{cfg.label} · </span>
        <span className="text-xs text-slate-700">{issue.message}</span>
      </div>
    </div>
  );
}

function SuggestionCard({
  label, value, note, limit, applied, onApply,
}: {
  label: string; value: string; note?: string;
  limit: number; applied: boolean; onApply: () => void;
}) {
  const len = value.length;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{label}</span>
        <span className={`text-[10px] font-mono font-semibold ${charColor(len, limit)}`}>{len}/{limit}</span>
      </div>
      <p className="text-sm text-slate-800 leading-snug">{value}</p>
      {note && <p className="text-[11px] text-slate-400 italic">{note}</p>}
      <button
        type="button"
        onClick={onApply}
        className={`flex items-center gap-1 text-xs font-semibold transition-colors px-3 py-1 rounded-full ${
          applied
            ? "bg-emerald-100 text-emerald-700"
            : "bg-violet-100 text-violet-700 hover:bg-violet-200"
        }`}
      >
        {applied ? <><Check className="h-3 w-3" /> Đã áp dụng</> : <>Áp dụng vào form →</>}
      </button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AiSeoHelper({
  title, content, currentExcerpt, currentSeoTitle, currentSeoDescription,
  showExcerpt = true, onApply,
}: AiSeoHelperProps) {
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SeoResult | null>(null);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const kwRef = useRef<HTMLInputElement>(null);

  const addKeyword = () => {
    const kw = kwInput.trim();
    if (kw && !keywords.includes(kw)) setKeywords((p) => [...p, kw]);
    setKwInput("");
    kwRef.current?.focus();
  };

  const removeKeyword = (kw: string) => setKeywords((p) => p.filter((k) => k !== kw));

  const analyze = async () => {
    if (!title.trim()) { setError("Vui lòng nhập tiêu đề trước"); return; }
    setLoading(true); setError(""); setResult(null); setApplied(new Set());

    const plainContent = content ? stripHtml(content) : "";
    const wordCount = plainContent.split(/\s+/).filter(Boolean).length;

    const parts: string[] = [`TIÊU ĐỀ TRANG/BÀI VIẾT: "${title}"`];
    if (plainContent) parts.push(`NỘI DUNG (${wordCount} từ):\n${plainContent}`);
    else parts.push("NỘI DUNG: [Chưa có nội dung]");
    if (currentExcerpt?.trim()) parts.push(`EXCERPT HIỆN TẠI: "${currentExcerpt}"`);
    else parts.push("EXCERPT HIỆN TẠI: [Chưa có]");
    if (currentSeoTitle?.trim()) parts.push(`SEO TITLE HIỆN TẠI: "${currentSeoTitle}" (${currentSeoTitle.length} ký tự)`);
    else parts.push("SEO TITLE HIỆN TẠI: [Chưa có]");
    if (currentSeoDescription?.trim()) parts.push(`SEO DESCRIPTION HIỆN TẠI: "${currentSeoDescription}" (${currentSeoDescription.length} ký tự)`);
    else parts.push("SEO DESCRIPTION HIỆN TẠI: [Chưa có]");
    if (keywords.length > 0) parts.push(`TỪ KHÓA MỤC TIÊU: ${keywords.join(", ")}`);

    const prompt = parts.join("\n\n");

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type: "seo_analyze", provider: "auto" }),
      });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || data.error) { setError(data.error ?? "Lỗi không xác định"); return; }
      const raw = (data.text ?? "").trim();
      const jsonStr = raw.startsWith("{") ? raw : raw.match(/\{[\s\S]*\}/)?.[0] ?? "";
      setResult(JSON.parse(jsonStr) as SeoResult);
    } catch {
      setError("Không thể phân tích. Kiểm tra cấu hình AI Provider tại Settings → AI Providers.");
    } finally {
      setLoading(false);
    }
  };

  const applyField = (field: keyof ApplyData, value: string) => {
    onApply({ [field]: value });
    setApplied((p) => new Set([...p, field]));
  };

  const applyAll = () => {
    if (!result) return;
    const data: ApplyData = {
      seoTitle: result.suggestions.seoTitle,
      seoDescription: result.suggestions.seoDescription,
    };
    if (showExcerpt) data.excerpt = result.suggestions.excerpt;
    onApply(data);
    setApplied(new Set(showExcerpt ? ["seoTitle", "seoDescription", "excerpt"] : ["seoTitle", "seoDescription"]));
  };

  const errorCount = result?.issues.filter((i) => i.severity === "error").length ?? 0;
  const warnCount = result?.issues.filter((i) => i.severity === "warning").length ?? 0;

  return (
    <div className="rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left hover:bg-violet-50 transition-colors"
      >
        <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-violet-900">Phân tích SEO chuyên sâu</p>
          <p className="text-[11px] text-violet-500">AI kiểm tra, chấm điểm và đề xuất tối ưu</p>
        </div>
        {result && (
          <div className="flex items-center gap-1.5 mr-2">
            {errorCount > 0 && (
              <span className="rounded-full bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5">{errorCount} lỗi</span>
            )}
            {warnCount > 0 && (
              <span className="rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold px-2 py-0.5">{warnCount} cảnh báo</span>
            )}
            <span className="rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5">
              {result.score}/100
            </span>
          </div>
        )}
        {open ? <ChevronUp className="h-4 w-4 text-violet-400" /> : <ChevronDown className="h-4 w-4 text-violet-400" />}
      </button>

      {open && (
        <div className="border-t border-violet-100 px-4 pb-5 pt-4 space-y-4">

          {/* Keyword input */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <Target className="h-3.5 w-3.5 text-violet-500" />
              Từ khóa mục tiêu
              <span className="text-slate-400 font-normal">(AI sẽ kiểm tra xem nội dung có tối ưu cho các từ khóa này không)</span>
            </label>
            <div className="flex gap-2">
              <input
                ref={kwRef}
                type="text"
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                placeholder="Nhập từ khóa, Enter để thêm..."
                className="flex-1 h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                type="button"
                onClick={addKeyword}
                disabled={!kwInput.trim()}
                className="h-8 w-8 rounded-lg bg-violet-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {keywords.map((kw) => (
                  <span key={kw} className="flex items-center gap-1 rounded-full bg-violet-100 text-violet-700 px-2.5 py-1 text-xs font-medium">
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* What AI will analyze */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">Nội dung AI sẽ phân tích</p>
            <AnalysisRow icon="📝" label="Tiêu đề" value={title} status={title ? "ok" : "missing"} />
            <AnalysisRow icon="📄" label="Nội dung" value={content ? `${stripHtml(content).slice(0, 60)}...` : undefined} status={content?.trim() ? "ok" : "missing"} />
            <AnalysisRow icon="💬" label="Excerpt" value={currentExcerpt} status={currentExcerpt?.trim() ? "ok" : "missing"} />
            <AnalysisRow icon="🔖" label="SEO Title" value={currentSeoTitle} status={currentSeoTitle?.trim() ? "ok" : "missing"} charCount={currentSeoTitle?.length} limit={60} />
            <AnalysisRow icon="📋" label="SEO Description" value={currentSeoDescription} status={currentSeoDescription?.trim() ? "ok" : "missing"} charCount={currentSeoDescription?.length} limit={155} />
            <AnalysisRow icon="🎯" label="Từ khóa mục tiêu" value={keywords.length > 0 ? keywords.join(", ") : undefined} status={keywords.length > 0 ? "ok" : "none"} />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <Button
            type="button"
            onClick={analyze}
            loading={loading}
            disabled={!title.trim()}
            className="bg-violet-600 hover:bg-violet-700 text-white w-full h-10"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Đang phân tích chuyên sâu..." : "Phân tích & Đề xuất tối ưu SEO"}
          </Button>

          {/* Results */}
          {result && (
            <div className="space-y-4 pt-1">
              <div className="h-px bg-violet-100" />

              {/* Score + summary */}
              <div className="flex items-center justify-between">
                <ScoreGauge score={result.score} />
                <div className="text-right space-y-1">
                  <p className="text-xs text-slate-500">{result.issues.filter((i) => i.severity === "error").length} lỗi nghiêm trọng</p>
                  <p className="text-xs text-slate-500">{result.issues.filter((i) => i.severity === "warning").length} cảnh báo</p>
                  <p className="text-xs text-slate-500">{result.issues.filter((i) => i.severity === "info").length} đề xuất cải thiện</p>
                </div>
              </div>

              {/* Issues */}
              {result.issues.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Vấn đề tìm thấy ({result.issues.length})
                  </p>
                  {result.issues.map((issue, i) => <IssueRow key={i} issue={issue} />)}
                </div>
              )}

              {/* Keyword analysis */}
              {keywords.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-violet-500" />
                    Phân tích từ khóa mục tiêu
                  </p>
                  {result.keywordsPresent?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase mb-1.5">✅ Đã có trong nội dung</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywordsPresent.map((kw) => (
                          <span key={kw} className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-xs font-medium">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.keywordsMissing?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-red-500 font-bold uppercase mb-1.5">❌ Chưa xuất hiện trong nội dung</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywordsMissing.map((kw) => (
                          <span key={kw} className="rounded-full bg-red-100 text-red-600 px-2.5 py-0.5 text-xs font-medium">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Suggested fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                    Nội dung tối ưu đề xuất
                  </p>
                  <button type="button" onClick={applyAll}
                    className="text-xs font-bold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1 rounded-full transition-colors">
                    Áp dụng tất cả →
                  </button>
                </div>

                <SuggestionCard
                  label="SEO Title"
                  value={result.suggestions.seoTitle}
                  note={result.suggestions.seoTitleNote}
                  limit={60}
                  applied={applied.has("seoTitle")}
                  onApply={() => applyField("seoTitle", result.suggestions.seoTitle)}
                />
                <SuggestionCard
                  label="SEO Description"
                  value={result.suggestions.seoDescription}
                  note={result.suggestions.seoDescriptionNote}
                  limit={155}
                  applied={applied.has("seoDescription")}
                  onApply={() => applyField("seoDescription", result.suggestions.seoDescription)}
                />
                {showExcerpt && (
                  <SuggestionCard
                    label="Excerpt / Mô tả ngắn"
                    value={result.suggestions.excerpt}
                    limit={200}
                    applied={applied.has("excerpt")}
                    onApply={() => applyField("excerpt", result.suggestions.excerpt)}
                  />
                )}
              </div>

              {/* CTA suggestion */}
              {result.suggestions.ctaSuggestion && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                  <p className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 mb-2">
                    <Target className="h-3.5 w-3.5" />
                    Gợi ý CTA (Call-to-Action)
                  </p>
                  <p className="text-sm text-indigo-800">{result.suggestions.ctaSuggestion}</p>
                </div>
              )}

              {/* Content tips */}
              {result.suggestions.contentTips && result.suggestions.contentTips.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                  <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Gợi ý cải thiện nội dung ({result.suggestions.contentTips.length})
                  </p>
                  <ul className="space-y-2">
                    {result.suggestions.contentTips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                        <span className="h-4 w-4 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended keywords */}
              {result.keywordsRecommended?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-700 mb-2">Từ khóa đề xuất thêm vào nội dung</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keywordsRecommended.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => { if (!keywords.includes(kw)) setKeywords((p) => [...p, kw]); }}
                        className="rounded-full bg-slate-100 hover:bg-violet-100 text-slate-600 hover:text-violet-700 px-2.5 py-1 text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        {kw}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Click để thêm vào từ khóa mục tiêu và phân tích lại</p>
                </div>
              )}

              <p className="text-[10px] text-slate-400 text-center">
                Phân tích bởi AI — đọc kỹ trước khi áp dụng · Nhấn phân tích lại để cập nhật
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnalysisRow({
  icon, label, value, status, charCount, limit,
}: {
  icon: string; label: string; value?: string | null;
  status: "ok" | "missing" | "none";
  charCount?: number; limit?: number;
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="shrink-0 w-4 text-center">{icon}</span>
      <span className="text-slate-500 shrink-0 w-28">{label}</span>
      {status === "ok" ? (
        <span className="text-slate-700 truncate flex-1">{value}</span>
      ) : (
        <span className="text-red-400 italic">chưa có</span>
      )}
      {charCount !== undefined && limit && (
        <span className={`shrink-0 font-mono text-[10px] font-semibold ${charColor(charCount, limit)}`}>
          {charCount}/{limit}
        </span>
      )}
    </div>
  );
}
