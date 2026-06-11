"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, RefreshCw, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AiProvider } from "@/app/api/ai/generate/route";

const TYPE_OPTIONS = [
  { value: "article", label: "Bài viết đầy đủ" },
  { value: "seo_meta", label: "SEO Title + Meta Description" },
  { value: "excerpt", label: "Tóm tắt ngắn (excerpt)" },
  { value: "outline", label: "Dàn bài chi tiết" },
  { value: "social", label: "Caption mạng xã hội" },
];

interface ProviderConfig {
  label: string;
  model: string;
  color: string;
  envKey: string;
}

const PROVIDERS: Record<AiProvider, ProviderConfig> = {
  claude:       { label: "Claude",   model: "claude-sonnet-4-6", color: "text-violet-600",  envKey: "ANTHROPIC_API_KEY" },
  openai:       { label: "OpenAI",   model: "gpt-4o-mini",       color: "text-emerald-600", envKey: "OPENAI_API_KEY" },
  gemini:       { label: "Gemini",   model: "gemini-1.5-flash",  color: "text-sky-600",     envKey: "GEMINI_API_KEY" },
  niner_router: { label: "9Router",  model: "default",           color: "text-orange-600",  envKey: "NINER_ROUTER_API_KEY" },
};

interface AiWriterProps {
  configuredProviders?: AiProvider[];
}

export function AiWriter({ configuredProviders = [] }: AiWriterProps) {
  const defaultProvider: AiProvider = configuredProviders[0] ?? "claude";
  const [provider, setProvider] = useState<AiProvider>(defaultProvider);
  const [type, setType] = useState("article");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) { setError("Vui lòng nhập yêu cầu nội dung"); return; }
    setLoading(true); setError(""); setResult("");
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type, provider }),
      });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || data.error) setError(data.error ?? "Lỗi không xác định");
      else setResult(data.text ?? "");
    } catch {
      setError("Không thể kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentProvider = PROVIDERS[provider];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          Trợ lý viết nội dung AI
        </CardTitle>
        <p className="text-xs text-slate-400 mt-0.5">Chọn model AI · Cần cấu hình API key trong Settings</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Provider selector */}
        <div className="grid grid-cols-4 gap-2">
          {(Object.entries(PROVIDERS) as [AiProvider, ProviderConfig][]).map(([key, cfg]) => {
            const isActive = provider === key;
            const isConfigured = configuredProviders.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setProvider(key)}
                className={[
                  "relative rounded-lg border px-3 py-2.5 text-left transition-all",
                  isActive
                    ? "border-indigo-400 bg-indigo-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                ].join(" ")}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Brain className={`h-3.5 w-3.5 ${isActive ? "text-indigo-600" : cfg.color}`} />
                  <span className={`text-xs font-semibold ${isActive ? "text-indigo-700" : "text-slate-700"}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">{cfg.model}</p>
                {isConfigured && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400" title="Đã cấu hình" />
                )}
              </button>
            );
          })}
        </div>

        {!configuredProviders.includes(provider) && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
            <strong>{currentProvider.label}</strong> chưa có API key — thêm{" "}
            <code className="bg-amber-100 rounded px-1">{currentProvider.envKey}</code>{" "}
            vào <strong>Settings → Cấu hình AI</strong>.
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-1">
            <Select label="Loại nội dung" options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value)} />
          </div>
          <div className="col-span-3">
            <Textarea
              label="Yêu cầu / chủ đề"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ví dụ: Viết bài về dịch vụ taxi đặt xe 24/7 tại Bắc Ninh, lái xe kinh nghiệm, giá cố định..."
              rows={3}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={generate} loading={loading} disabled={!prompt.trim()}>
            <Sparkles className="h-4 w-4" />
            {loading ? "Đang tạo..." : `Tạo với ${currentProvider.label}`}
          </Button>
          {result && (
            <Button variant="outline" onClick={() => { setResult(""); setPrompt(""); }}>
              <RefreshCw className="h-4 w-4" /> Làm mới
            </Button>
          )}
          <Badge variant="neutral" className="ml-auto text-[10px]">{currentProvider.model}</Badge>
        </div>

        {result && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Kết quả</span>
              <Button variant="ghost" size="sm" onClick={copyResult}>
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Đã sao chép" : "Sao chép"}
              </Button>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">{result}</pre>
            </div>
            <p className="text-xs text-slate-400">Kết quả do AI tạo ra — hãy đọc và chỉnh sửa trước khi đăng</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
