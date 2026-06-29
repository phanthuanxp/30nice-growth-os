"use client";

import { useState } from "react";
import { Brain, Loader2, Copy, Check, ChevronDown, FileText, HelpCircle, Hash, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


interface Brief {
  keyword: string;
  intent: string;
  targetAudience: string;
  recommendedLength: string;
  outline: { type: string; text: string }[];
  faqs: { question: string; answer: string }[];
  relatedKeywords: string[];
  lsiKeywords: string[];
  contentTips: string[];
  internalLinkSuggestions: string[];
  competitorGaps: string[];
}

function OutlineSection({ outline }: { outline: Brief["outline"] }) {
  return (
    <div className="space-y-1">
      {outline.map((item, i) => (
        <div key={i} className={`flex items-start gap-2 ${item.type === "h1" ? "" : item.type === "h2" ? "pl-4" : "pl-8"}`}>
          <Badge variant="neutral" className="text-[10px] font-mono shrink-0 mt-0.5">{item.type.toUpperCase()}</Badge>
          <p className={`text-sm ${item.type === "h1" ? "font-bold text-slate-900" : item.type === "h2" ? "font-semibold text-slate-800" : "text-slate-700"}`}>
            {item.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function FaqSection({ faqs }: { faqs: Brief["faqs"] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="space-y-1.5">
      {faqs.map((faq, i) => (
        <div key={i} className="rounded-lg border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
          >
            <span className="text-sm font-medium text-slate-800">{faq.question}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${openIdx === i ? "rotate-180" : ""}`} />
          </button>
          {openIdx === i && (
            <div className="px-3 pb-3 text-sm text-slate-600 bg-slate-50">{faq.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ContentBriefGenerator() {
  const [keyword, setKeyword] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!keyword.trim()) { setError("Nhập từ khóa mục tiêu"); return; }
    setLoading(true); setError(""); setBrief(null); setRawText("");
    try {
      const prompt = `Tạo Content Brief cho từ khóa: "${keyword.trim()}"${context ? `\nNgữ cảnh thêm: ${context}` : ""}`;
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type: "content_brief", provider: "auto" }),
      });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || data.error) { setError(data.error ?? "Lỗi AI"); return; }

      const text = data.text ?? "";
      setRawText(text);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]) as Brief;
          setBrief(parsed);
        } catch {
          // show raw text
        }
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  const copyBrief = async () => {
    const text = brief
      ? [
          `# Content Brief: ${brief.keyword}`,
          ``,
          `**Search Intent:** ${brief.intent}`,
          `**Đối tượng:** ${brief.targetAudience}`,
          `**Độ dài đề xuất:** ${brief.recommendedLength}`,
          ``,
          `## Outline`,
          ...brief.outline.map((o) => `${"  ".repeat(o.type === "h1" ? 0 : o.type === "h2" ? 1 : 2)}- [${o.type.toUpperCase()}] ${o.text}`),
          ``,
          `## FAQs`,
          ...brief.faqs.map((f) => `**Q:** ${f.question}\n**A:** ${f.answer}`),
          ``,
          `## Từ khóa liên quan`,
          brief.relatedKeywords.join(", "),
          ``,
          `## LSI Keywords`,
          brief.lsiKeywords.join(", "),
          ``,
          `## Content Tips`,
          ...brief.contentTips.map((t) => `- ${t}`),
        ].join("\n")
      : rawText;

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-violet-500" />
          Content Brief Generator
        </CardTitle>
        <p className="text-sm text-slate-500">
          Nhập từ khóa → AI tạo outline, FAQs, từ khóa LSI và chiến lược content đầy đủ
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder="VD: du lịch hội an tự túc, kinh nghiệm leo fansipan..."
              className="w-full h-10 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <Button onClick={generate} disabled={loading} className="gap-2 bg-violet-600 hover:bg-violet-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Tạo Brief
          </Button>
        </div>

        <div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Ngữ cảnh thêm (tùy chọn): site về du lịch miền Bắc, target độc giả 25-40 tuổi..."
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {brief && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="info">{brief.intent}</Badge>
                <span className="text-xs text-slate-500">{brief.recommendedLength}</span>
                {brief.targetAudience && (
                  <span className="text-xs text-slate-400">→ {brief.targetAudience}</span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={copyBrief} className="gap-1.5 text-xs">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Đã copy" : "Copy brief"}
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 mb-3">
                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Outline</p>
                  </div>
                  <OutlineSection outline={brief.outline} />
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Hash className="h-3.5 w-3.5 text-emerald-500" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Từ khóa liên quan</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {brief.relatedKeywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">{kw}</span>
                    ))}
                  </div>
                  {brief.lsiKeywords.length > 0 && (
                    <>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase mt-2">LSI Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {brief.lsiKeywords.map((kw) => (
                          <span key={kw} className="px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600">{kw}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">FAQs ({brief.faqs.length})</p>
                  </div>
                  <FaqSection faqs={brief.faqs} />
                </div>

                {brief.contentTips.length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <BarChart2 className="h-3.5 w-3.5 text-violet-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Content Tips</p>
                    </div>
                    <ul className="space-y-1.5">
                      {brief.contentTips.map((tip, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                          <span className="text-violet-400 mt-0.5">•</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {brief.competitorGaps.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Cơ hội đối thủ chưa khai thác</p>
                    <ul className="space-y-1">
                      {brief.competitorGaps.map((gap, i) => (
                        <li key={i} className="text-sm text-amber-800 flex items-start gap-1.5">
                          <span className="mt-0.5">→</span>{gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {brief.internalLinkSuggestions.length > 0 && (
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Gợi ý Internal Link</p>
                    <ul className="space-y-1">
                      {brief.internalLinkSuggestions.map((link, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-1.5">
                          <span className="text-indigo-400">↗</span>{link}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!brief && rawText && (
          <div className="rounded-lg bg-slate-50 border p-3 text-sm text-slate-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {rawText}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
