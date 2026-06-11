"use client";

import { useActionState, useTransition } from "react";
import { Brain, Check, ChevronDown, ChevronUp, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  saveAiProviderAction,
  setDefaultProviderAction,
  setFallbackProviderAction,
  clearDefaultProviderAction,
  clearFallbackProviderAction,
  type AiProviderActionState,
} from "@/server/actions/ai-providers";
import type { AiProviderRow } from "@/server/queries/ai-providers";
import { useState } from "react";

interface ProviderMeta {
  label: string;
  color: string;
  borderActive: string;
  models: string[];
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  baseUrlLabel?: string;
  baseUrlPlaceholder?: string;
  modelLabel: string;
  defaultModel: string;
  docsHint: string;
}

const PROVIDER_META: Record<string, ProviderMeta> = {
  claude: {
    label: "Claude (Anthropic)",
    color: "text-violet-600",
    borderActive: "border-violet-300 bg-violet-50",
    models: ["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5"],
    apiKeyLabel: "Anthropic API Key",
    apiKeyPlaceholder: "sk-ant-api03-...",
    modelLabel: "Model",
    defaultModel: "claude-sonnet-4-6",
    docsHint: "Lấy key tại console.anthropic.com → API Keys",
  },
  openai: {
    label: "OpenAI (GPT)",
    color: "text-emerald-600",
    borderActive: "border-emerald-300 bg-emerald-50",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
    apiKeyLabel: "OpenAI API Key",
    apiKeyPlaceholder: "sk-proj-...",
    modelLabel: "Model",
    defaultModel: "gpt-4o-mini",
    docsHint: "Lấy key tại platform.openai.com → API keys",
  },
  gemini: {
    label: "Google Gemini",
    color: "text-sky-600",
    borderActive: "border-sky-300 bg-sky-50",
    models: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
    apiKeyLabel: "Google AI API Key",
    apiKeyPlaceholder: "AIza...",
    modelLabel: "Model",
    defaultModel: "gemini-1.5-flash",
    docsHint: "Lấy key tại aistudio.google.com → Get API key",
  },
  niner_router: {
    label: "9Router",
    color: "text-orange-600",
    borderActive: "border-orange-300 bg-orange-50",
    models: ["default"],
    apiKeyLabel: "9Router API Key",
    apiKeyPlaceholder: "your-9router-key",
    baseUrlLabel: "Base URL",
    baseUrlPlaceholder: "https://api.9router.com/v1",
    modelLabel: "Model",
    defaultModel: "default",
    docsHint: "Liên hệ 9Router để lấy API key và endpoint",
  },
};

interface AiProviderCardProps {
  provider: string;
  config: AiProviderRow | null;
  envConfigured: boolean;
}

export function AiProviderCard({ provider, config, envConfigured }: AiProviderCardProps) {
  const meta = PROVIDER_META[provider];
  const [expanded, setExpanded] = useState(false);
  const [_pending, startTransition] = useTransition();

  const boundSave = saveAiProviderAction.bind(null, provider);
  const [saveState, saveAction] = useActionState<AiProviderActionState, FormData>(boundSave, {});
  const [defaultState, defaultAction] = useActionState<AiProviderActionState, FormData>(setDefaultProviderAction, {});
  const [fallbackState, fallbackAction] = useActionState<AiProviderActionState, FormData>(setFallbackProviderAction, {});
  const [clearDefaultState, clearDefaultAction] = useActionState<AiProviderActionState, FormData>(clearDefaultProviderAction, {});
  const [clearFallbackState, clearFallbackAction] = useActionState<AiProviderActionState, FormData>(clearFallbackProviderAction, {});

  const isDbConfigured = !!(config?.apiKey);
  const isActive = config?.isActive ?? false;
  const isDefault = config?.isDefault ?? false;
  const isFallback = config?.isFallback ?? false;

  const hasError = saveState.error ?? defaultState.error ?? fallbackState.error ?? clearDefaultState.error ?? clearFallbackState.error;

  return (
    <div className={`rounded-xl border-2 transition-all ${isActive ? meta.borderActive : "border-slate-200 bg-white"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4">
        <Brain className={`h-5 w-5 shrink-0 ${meta.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">{meta.label}</span>
            {isDefault && <Badge variant="success" className="text-[10px]"><Star className="h-2.5 w-2.5 mr-0.5" />Mặc định</Badge>}
            {isFallback && <Badge variant="info" className="text-[10px]"><Shield className="h-2.5 w-2.5 mr-0.5" />Dự phòng</Badge>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {isActive
              ? <span className="text-xs text-emerald-600 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />Đang hoạt động</span>
              : envConfigured
              ? <span className="text-xs text-amber-600 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />Chỉ có trong .env</span>
              : <span className="text-xs text-slate-400">Chưa cấu hình</span>
            }
            {isDbConfigured && <span className="text-xs text-slate-400">· DB key đã lưu</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Toggle"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-4">
          {hasError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{hasError}</div>
          )}
          {(saveState.success ?? defaultState.success ?? fallbackState.success ?? clearDefaultState.success ?? clearFallbackState.success) && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" /> Đã lưu thành công
            </div>
          )}

          {/* Save form */}
          <form action={saveAction} className="space-y-3">
            <Input
              label={meta.apiKeyLabel}
              name="apiKey"
              type="password"
              defaultValue={config?.apiKey ?? ""}
              placeholder={meta.apiKeyPlaceholder}
              autoComplete="off"
            />
            {meta.baseUrlLabel && (
              <Input
                label={meta.baseUrlLabel}
                name="baseUrl"
                defaultValue={config?.baseUrl ?? ""}
                placeholder={meta.baseUrlPlaceholder}
              />
            )}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{meta.modelLabel}</label>
              <select
                name="model"
                defaultValue={config?.model ?? meta.defaultModel}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-3 pr-8 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {meta.models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  value="true"
                  defaultChecked={isActive}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                <span className="text-sm text-slate-700">Kích hoạt provider này</span>
              </label>
            </div>
            <p className="text-xs text-slate-400">{meta.docsHint}</p>
            <Button type="submit" size="sm">Lưu cấu hình</Button>
          </form>

          {/* Default / Fallback controls */}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
            {isDefault ? (
              <form action={clearDefaultAction}>
                <input type="hidden" name="provider" value={provider} />
                <Button type="submit" variant="outline" size="sm" className="text-xs" onClick={() => startTransition(() => {})}>
                  Bỏ làm mặc định
                </Button>
              </form>
            ) : (
              <form action={defaultAction}>
                <input type="hidden" name="provider" value={provider} />
                <Button type="submit" variant="outline" size="sm" className="text-xs">
                  <Star className="h-3 w-3" />
                  Đặt làm mặc định
                </Button>
              </form>
            )}

            {isFallback ? (
              <form action={clearFallbackAction}>
                <input type="hidden" name="provider" value={provider} />
                <Button type="submit" variant="outline" size="sm" className="text-xs">
                  Bỏ dự phòng
                </Button>
              </form>
            ) : (
              <form action={fallbackAction}>
                <input type="hidden" name="provider" value={provider} />
                <Button type="submit" variant="outline" size="sm" className="text-xs">
                  <Shield className="h-3 w-3" />
                  Đặt làm dự phòng
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
