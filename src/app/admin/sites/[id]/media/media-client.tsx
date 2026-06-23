"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Upload, Trash2, Image as ImageIcon, Loader2, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaAsset {
  id: string;
  url: string;
  alt: string | null;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button type="button" onClick={copy}
      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-600 transition-colors">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? "Đã copy" : "Copy URL"}
    </button>
  );
}

export function SiteMediaClient({ tenantId }: { tenantId: string }) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/media?tenantId=${tenantId}`);
      const data = await res.json() as MediaAsset[];
      setAssets(Array.isArray(data) ? data : []);
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    queueMicrotask(() => { void fetchAssets(); });
  }, [fetchAssets]);

  const upload = useCallback(async (files: FileList | File[]) => {
    setUploadError("");
    setUploading(true);
    const arr = Array.from(files);
    const results: MediaAsset[] = [];
    for (const file of arr) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tenantId", tenantId);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json() as MediaAsset & { error?: string };
        if (!res.ok || data.error) {
          setUploadError(data.error ?? "Upload thất bại");
        } else {
          results.push(data);
        }
      } catch {
        setUploadError("Upload thất bại");
      }
    }
    if (results.length > 0) {
      setAssets((prev) => [...results, ...prev]);
    }
    setUploading(false);
  }, [tenantId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      upload(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) upload(e.dataTransfer.files);
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!confirm(`Xóa ảnh "${asset.filename}"?`)) return;
    setDeletingId(asset.id);
    try {
      await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: asset.id }),
      });
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      if (selectedId === asset.id) setSelectedId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const selected = assets.find((a) => a.id === selectedId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: upload zone + grid */}
      <div className="lg:col-span-2 space-y-4">
        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed transition-colors cursor-pointer
            ${dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
        >
          <div className="py-10 flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-500">Đang tải lên...</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">Kéo thả ảnh vào đây hoặc nhấp để chọn</p>
                <p className="text-xs text-slate-400">JPG, PNG, GIF, WebP, SVG · Tối đa 10MB</p>
              </>
            )}
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />

        {uploadError && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
            <X className="h-4 w-4 shrink-0" />
            <span>{uploadError}</span>
            <button onClick={() => setUploadError("")} className="ml-auto text-red-400 hover:text-red-600"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <ImageIcon className="h-14 w-14 mb-3" />
            <p className="text-sm font-medium text-slate-400">Chưa có ảnh nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {assets.map((asset) => (
              <button key={asset.id} type="button"
                onClick={() => setSelectedId(selectedId === asset.id ? null : asset.id)}
                className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all
                  ${selectedId === asset.id ? "border-indigo-500 ring-2 ring-indigo-200" : "border-transparent hover:border-slate-300"}`}>
                <img src={asset.url} alt={asset.alt ?? asset.filename}
                  className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {deletingId === asset.id && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-slate-500 animate-spin" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: asset detail */}
      <div>
        {selected ? (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden sticky top-4">
            <img src={selected.url} alt={selected.alt ?? selected.filename}
              className="w-full aspect-video object-cover bg-slate-100" />
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800 truncate">{selected.filename}</p>
              <div className="space-y-1 text-xs text-slate-500">
                <p>{selected.mimeType} · {formatSize(selected.size)}</p>
                <p>{new Date(selected.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 font-mono break-all">
                {selected.url}
              </div>
              <CopyUrlButton url={selected.url} />
              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-500 border-red-200 hover:bg-red-50"
                onClick={() => handleDelete(selected)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />Xóa ảnh
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 flex flex-col items-center text-center">
            <ImageIcon className="h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">Chọn một ảnh để xem chi tiết</p>
          </div>
        )}
      </div>
    </div>
  );
}
