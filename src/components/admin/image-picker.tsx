"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Upload, Image as ImageIcon, X, Check, Loader2, Library } from "lucide-react";
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

interface ImagePickerProps {
  name?: string;
  value?: string;
  tenantId: string;
  label?: string;
  onChange?: (url: string) => void;
  placeholder?: string;
  aspectHint?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function ImagePicker({
  name,
  value = "",
  tenantId,
  label,
  onChange,
  placeholder = "https://...",
  aspectHint,
}: ImagePickerProps) {
  const [url, setUrl] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState<MediaAsset[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setUrl(value); }, [value]);

  const upload = useCallback(async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tenantId", tenantId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Upload thất bại");
      const newUrl = data.url!;
      setUrl(newUrl);
      onChange?.(newUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại");
    } finally {
      setUploading(false);
    }
  }, [tenantId, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const openLibrary = async () => {
    setShowLibrary(true);
    setLibraryLoading(true);
    try {
      const res = await fetch(`/api/media?tenantId=${tenantId}`);
      const data = await res.json() as MediaAsset[];
      setLibraryAssets(Array.isArray(data) ? data : []);
    } catch {
      setLibraryAssets([]);
    } finally {
      setLibraryLoading(false);
    }
  };

  const selectFromLibrary = (asset: MediaAsset) => {
    setUrl(asset.url);
    onChange?.(asset.url);
    setShowLibrary(false);
  };

  const clear = () => {
    setUrl("");
    onChange?.("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-slate-700">{label}</p>}

      {url ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 group">
          <img src={url} alt="Selected" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="bg-white/90 text-slate-800 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-white transition-colors flex items-center gap-1">
              <Upload className="h-3 w-3" />Đổi ảnh
            </button>
            <button type="button" onClick={openLibrary}
              className="bg-white/90 text-slate-800 text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-white transition-colors flex items-center gap-1">
              <Library className="h-3 w-3" />Thư viện
            </button>
            <button type="button" onClick={clear}
              className="bg-red-500/90 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-red-500 transition-colors flex items-center gap-1">
              <X className="h-3 w-3" />Xóa
            </button>
          </div>
          {aspectHint && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">
              {aspectHint}
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer
            ${dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}
          onClick={() => fileRef.current?.click()}
        >
          <div className="py-8 flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                <p className="text-sm text-slate-500">Đang tải lên...</p>
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-500">Kéo thả hoặc nhấp để tải ảnh lên</p>
                {aspectHint && <p className="text-xs text-slate-400">{aspectHint}</p>}
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg flex items-center gap-1">
                    <Upload className="h-3 w-3" />Upload
                  </span>
                  <span
                    className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg flex items-center gap-1"
                    onClick={(e) => { e.stopPropagation(); openLibrary(); }}
                  >
                    <Library className="h-3 w-3" />Thư viện
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {name && <input type="hidden" name={name} value={url} />}

      {/* Media Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLibrary(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Library className="h-4 w-4 text-indigo-500" />Thư viện ảnh
              </h3>
              <div className="flex items-center gap-2">
                <button type="button"
                  onClick={() => { setShowLibrary(false); setTimeout(() => fileRef.current?.click(), 50); }}
                  className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 flex items-center gap-1">
                  <Upload className="h-3 w-3" />Tải ảnh mới
                </button>
                <button type="button" onClick={() => setShowLibrary(false)}
                  className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {libraryLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                </div>
              ) : libraryAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <ImageIcon className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Chưa có ảnh nào. Tải ảnh đầu tiên lên!</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {libraryAssets.map((asset) => (
                    <button key={asset.id} type="button" onClick={() => selectFromLibrary(asset)}
                      className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all
                        ${url === asset.url ? "border-indigo-500 ring-2 ring-indigo-200" : "border-transparent hover:border-indigo-300"}`}>
                      <img src={asset.url} alt={asset.alt ?? asset.filename}
                        className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        {url === asset.url && (
                          <div className="bg-indigo-500 rounded-full p-1">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-1 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white truncate">{asset.filename}</p>
                        <p className="text-[10px] text-slate-300">{formatSize(asset.size)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
