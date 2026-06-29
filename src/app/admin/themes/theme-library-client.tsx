"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X, ExternalLink, ChevronRight, Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyThemeToSite } from "./actions";
import type { ThemeDefinition } from "@/lib/theme-registry";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  primaryDomain: string | null;
}

interface Props {
  themes: ThemeDefinition[];
  tenants: Tenant[];
  usageMap: Record<string, string[]>;
}

// Visual mockup per theme
function ThemePreviewMockup({ theme }: { theme: ThemeDefinition }) {
  if (theme.id === "travel-news") {
    return (
      <div className="w-full h-full flex flex-col text-[4px] overflow-hidden rounded-t-xl">
        <div className="flex items-center justify-between px-2 py-1 bg-slate-900">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <div className="w-8 h-1 rounded bg-white/30" />
          </div>
          <div className="flex gap-1">
            {[1,2,3,4].map(i => <div key={i} className="w-5 h-1 rounded bg-white/20" />)}
          </div>
        </div>
        <div className="flex gap-1 px-1.5 py-0.5 bg-slate-800">
          {[1,2,3,4,5].map(i => <div key={i} className="w-6 h-1 rounded bg-white/15" />)}
        </div>
        <div className="flex gap-1 p-1.5 bg-gray-50 flex-1">
          <div className="flex-[2] rounded bg-slate-200 h-full" />
          <div className="flex-1 flex flex-col gap-1">
            {[1,2,3].map(i => <div key={i} className="flex-1 rounded bg-white border border-gray-100" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden rounded-t-xl">
      <div className="h-8 flex items-center justify-between px-3"
        style={{ background: theme.primaryColor }}>
        <div className="flex gap-1">
          <div className="w-10 h-2 rounded bg-white/30" />
          <div className="w-8 h-2 rounded bg-white/20" />
        </div>
        <div className="w-10 h-2 rounded bg-white/30" />
      </div>
      <div className="flex-1 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}15, ${theme.accentColor}10)` }}>
        <div className="text-center">
          <div className="w-16 h-2 rounded mx-auto mb-1" style={{ background: theme.primaryColor + "40" }} />
          <div className="w-12 h-1.5 rounded mx-auto" style={{ background: theme.primaryColor + "25" }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1 p-1.5 bg-gray-50">
        {[1,2,3].map(i => (
          <div key={i} className="h-5 rounded" style={{ background: theme.primaryColor + "15" }} />
        ))}
      </div>
    </div>
  );
}

// Modal: apply theme to a site
function ApplyModal({
  theme,
  tenants,
  usageMap,
  onClose,
}: {
  theme: ThemeDefinition;
  tenants: Tenant[];
  usageMap: Record<string, string[]>;
  onClose: () => void;
}) {
  const [selectedSite, setSelectedSite] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const alreadyUsing = usageMap[theme.id] ?? [];

  const handleApply = () => {
    if (!selectedSite) return;
    setError("");
    startTransition(async () => {
      const result = await applyThemeToSite(selectedSite, theme.id);
      if (result.error) setError(result.error);
      else setSuccess(true);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{ background: theme.primaryColor + "15" }}>
              <div className="h-4 w-4 rounded-full" style={{ background: theme.primaryColor }} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Áp dụng {theme.name}</p>
              <p className="text-xs text-slate-400">Chọn site để áp dụng giao diện</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="h-7 w-7 text-green-600" />
              </div>
              <p className="font-semibold text-slate-800">Đã áp dụng thành công!</p>
              <p className="text-sm text-slate-500">
                {theme.name} đã được kích hoạt cho site đã chọn.
              </p>
              <button onClick={onClose}
                className="mt-2 px-5 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors">
                Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Site selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">Chọn site</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {tenants.length === 0 ? (
                    <p className="text-sm text-slate-400 italic text-center py-4">Chưa có site nào</p>
                  ) : tenants.map((t) => {
                    const inUse = alreadyUsing.includes(t.id);
                    return (
                      <label key={t.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                          selectedSite === t.id
                            ? "border-indigo-500 bg-indigo-50/50"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}>
                        <input
                          type="radio"
                          name="site"
                          value={t.id}
                          checked={selectedSite === t.id}
                          onChange={() => setSelectedSite(t.id)}
                          className="accent-indigo-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{t.name}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {t.primaryDomain ?? t.slug}
                          </p>
                        </div>
                        {inUse && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full shrink-0">
                            Đang dùng
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                  Hủy
                </button>
                <button type="button" onClick={handleApply}
                  disabled={!selectedSite || isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-colors">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Áp dụng
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Theme detail modal
function ThemeDetailModal({
  theme,
  tenants,
  usageMap,
  onClose,
  onApply,
}: {
  theme: ThemeDefinition;
  tenants: Tenant[];
  usageMap: Record<string, string[]>;
  onClose: () => void;
  onApply: () => void;
}) {
  const usedBy = (usageMap[theme.id] ?? []).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: theme.primaryColor + "15" }}>
              <div className="h-5 w-5 rounded-full" style={{ background: theme.primaryColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-800">{theme.name}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: theme.categoryColor + "20", color: theme.categoryColor }}>
                  {theme.category}
                </span>
              </div>
              <p className="text-xs text-slate-400">v{theme.version} · {usedBy} site đang dùng</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Preview */}
          <div className="h-52 mx-5 mt-5 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
            <ThemePreviewMockup theme={theme} />
          </div>
          {theme.status === "available" && (
            <div className="mx-5 mt-2 mb-3">
              <a
                href={`/theme-preview/${theme.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Xem trước bản thật với dữ liệu mẫu ↗
              </a>
            </div>
          )}

          <div className="px-6 pb-6 space-y-5">
            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed">{theme.longDescription}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {theme.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {tag}
                </span>
              ))}
            </div>

            {/* Sections */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Các section có sẵn
              </p>
              <div className="flex flex-wrap gap-1.5">
                {theme.previewSections.map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Features */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Tính năng
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {theme.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-t bg-slate-50 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 bg-white text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
            Đóng
          </button>
          {theme.status === "available" ? (
            <button type="button" onClick={onApply}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
              <ChevronRight className="h-4 w-4" />
              Áp dụng cho site
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-200 text-slate-400 text-sm font-semibold rounded-xl cursor-not-allowed">
              <Lock className="h-4 w-4" />
              Sắp ra mắt
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main component
export function ThemeLibraryClient({ themes, tenants, usageMap }: Props) {
  const [filter, setFilter] = useState<"all" | "available" | "coming-soon">("all");
  const [detailTheme, setDetailTheme] = useState<ThemeDefinition | null>(null);
  const [applyTheme, setApplyTheme] = useState<ThemeDefinition | null>(null);

  const filtered = themes.filter(t =>
    filter === "all" ? true :
    filter === "available" ? t.status === "available" :
    t.status === "coming-soon"
  );

  return (
    <>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
        {([
          { key: "all", label: "Tất cả" },
          { key: "available", label: "Sẵn sàng" },
          { key: "coming-soon", label: "Sắp ra mắt" },
        ] as const).map(tab => (
          <button key={tab.key} type="button" onClick={() => setFilter(tab.key)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === tab.key
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(theme => {
          const usedCount = (usageMap[theme.id] ?? []).length;
          const isAvailable = theme.status === "available";

          return (
            <div key={theme.id}
              className={cn(
                "bg-white rounded-2xl border overflow-hidden shadow-sm transition-all group",
                isAvailable
                  ? "border-slate-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                  : "border-slate-100 opacity-80"
              )}
              onClick={() => setDetailTheme(theme)}>

              {/* Preview area */}
              <div className="relative h-44 bg-gray-50 overflow-hidden">
                <ThemePreviewMockup theme={theme} />

                {/* Status badge */}
                <div className="absolute top-2.5 right-2.5">
                  {isAvailable ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-500 text-white rounded-full shadow-sm">
                      <Sparkles className="h-2.5 w-2.5" />
                      Có sẵn
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-700/80 text-white rounded-full backdrop-blur-sm">
                      Sắp ra mắt
                    </span>
                  )}
                </div>

                {/* Hover overlay */}
                {isAvailable && (
                  <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                      Xem chi tiết →
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{theme.name}</p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background: theme.categoryColor + "15", color: theme.categoryColor }}>
                      {theme.category}
                    </span>
                  </div>
                  {usedCount > 0 && (
                    <span className="shrink-0 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {usedCount} site
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-3">{theme.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {theme.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setDetailTheme(theme)}
                    className="flex-1 py-2 text-xs font-medium border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Chi tiết
                  </button>
                  {isAvailable ? (
                    <button
                      type="button"
                      onClick={() => setApplyTheme(theme)}
                      className="flex-1 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Áp dụng
                    </button>
                  ) : (
                    <div className="flex-1 py-2 text-xs font-medium bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center gap-1 cursor-not-allowed">
                      <Lock className="h-3 w-3" />
                      Sắp ra mắt
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {detailTheme && !applyTheme && (
        <ThemeDetailModal
          theme={detailTheme}
          tenants={tenants}
          usageMap={usageMap}
          onClose={() => setDetailTheme(null)}
          onApply={() => { setApplyTheme(detailTheme); setDetailTheme(null); }}
        />
      )}

      {/* Apply modal */}
      {applyTheme && (
        <ApplyModal
          theme={applyTheme}
          tenants={tenants}
          usageMap={usageMap}
          onClose={() => setApplyTheme(null)}
        />
      )}
    </>
  );
}
