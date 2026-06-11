"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import UnderlineExt from "@tiptap/extension-underline";
import { cn } from "@/lib/utils";
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Code, Code2, Minus,
  AlignLeft, AlignCenter, AlignRight,
  Link2, Unlink, Undo2, Redo2,
  Image as ImageIcon, Upload, X, Loader2, Check,
  ChevronDown, MoreHorizontal, Type, Library,
} from "lucide-react";

// ── Custom Image: preserve style + class attrs ────────────────────────────────

const CustomImage = ImageExt.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style as string } : {}),
        parseHTML: (el) => el.getAttribute("style"),
      },
      class: {
        default: null,
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class as string } : {}),
        parseHTML: (el) => el.getAttribute("class"),
      },
    };
  },
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface MediaAsset {
  id: string; url: string; alt: string | null;
  filename: string; mimeType: string; size: number;
}

type ImgSize = "25" | "50" | "75" | "100";
type ImgAlign = "none" | "left" | "center" | "right";

// ── ImageInsertModal ──────────────────────────────────────────────────────────

function ImageInsertModal({
  tenantId, onInsert, onClose,
}: {
  tenantId: string;
  onInsert: (opts: { src: string; alt: string; style: string }) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"upload" | "library">("upload");
  const [selectedUrl, setSelectedUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [align, setAlign] = useState<ImgAlign>("none");
  const [size, setSize] = useState<ImgSize>("100");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loadingLib, setLoadingLib] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadLibrary = useCallback(async () => {
    setLoadingLib(true);
    try {
      const res = await fetch(`/api/media?tenantId=${tenantId}`);
      const data = await res.json() as MediaAsset[];
      setAssets(Array.isArray(data) ? data : []);
    } catch { setAssets([]); }
    finally { setLoadingLib(false); }
  }, [tenantId]);

  useEffect(() => { if (tab === "library") loadLibrary(); }, [tab, loadLibrary]);

  const upload = async (file: File) => {
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("tenantId", tenantId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Upload thất bại");
      setSelectedUrl(data.url!);
      setAssets((p) => [{ id: `tmp-${Date.now()}`, url: data.url!, alt: null, filename: file.name, mimeType: file.type, size: file.size }, ...p]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload thất bại");
    } finally { setUploading(false); }
  };

  const buildStyle = (): string => {
    const w = size === "100" ? "width:100%" : `width:${size}%`;
    const a = align === "left" ? "float:left;margin:0 1.5rem 1rem 0"
      : align === "right" ? "float:right;margin:0 0 1rem 1.5rem"
      : align === "center" ? "display:block;margin:0 auto"
      : "";
    return [w, a].filter(Boolean).join(";");
  };

  const alignOpts: { v: ImgAlign; label: string; Icon?: React.ElementType }[] = [
    { v: "none", label: "Mặc định" },
    { v: "left", label: "Trái", Icon: AlignLeft },
    { v: "center", label: "Giữa", Icon: AlignCenter },
    { v: "right", label: "Phải", Icon: AlignRight },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-indigo-500" />Chèn ảnh vào bài viết
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex border-b shrink-0">
          {(["upload", "library"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={cn("px-6 py-2.5 text-sm font-medium transition-colors",
                tab === t ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500 hover:text-slate-700")}>
              {t === "upload" ? "Tải ảnh lên" : "Thư viện ảnh"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {tab === "upload" ? (
            <div className="space-y-4">
              {selectedUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={selectedUrl} alt="preview" className="w-full max-h-56 object-contain" />
                  <button type="button" onClick={() => setSelectedUrl("")}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm text-slate-400 hover:text-red-500">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileRef.current?.click()}
                  className={cn("rounded-xl border-2 border-dashed cursor-pointer py-16 flex flex-col items-center gap-3 transition-colors",
                    dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-slate-300")}>
                  {uploading
                    ? <><Loader2 className="h-10 w-10 text-indigo-500 animate-spin" /><p className="text-sm text-slate-500">Đang tải lên...</p></>
                    : <><Upload className="h-10 w-10 text-slate-300" /><p className="text-sm font-medium text-slate-600">Kéo thả hoặc nhấp để chọn ảnh</p><p className="text-xs text-slate-400">JPG, PNG, GIF, WebP · Tối đa 10MB</p></>}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
              {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
            </div>
          ) : (
            loadingLib ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /></div>
            ) : assets.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-2">
                <ImageIcon className="h-12 w-12 text-slate-200" />
                <p className="text-sm text-slate-400">Chưa có ảnh nào. Chuyển sang &ldquo;Tải ảnh lên&rdquo;.</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {assets.map((a) => (
                  <button key={a.id} type="button"
                    onClick={() => { setSelectedUrl(a.url); setAltText(a.alt ?? ""); }}
                    className={cn("aspect-square rounded-xl overflow-hidden border-2 transition-all relative group",
                      selectedUrl === a.url ? "border-indigo-500 ring-2 ring-indigo-200" : "border-transparent hover:border-slate-300")}>
                    <img src={a.url} alt={a.alt ?? a.filename} className="w-full h-full object-cover" />
                    <div className={cn("absolute inset-0 flex items-center justify-center transition-all",
                      selectedUrl === a.url ? "bg-indigo-500/20" : "bg-black/0 group-hover:bg-black/10")}>
                      {selectedUrl === a.url && <Check className="h-6 w-6 text-indigo-600 drop-shadow" />}
                    </div>
                  </button>
                ))}
              </div>
            )
          )}
        </div>

        {selectedUrl && (
          <div className="border-t px-5 py-4 bg-slate-50 space-y-3 shrink-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Văn bản thay thế (Alt)</label>
                <input value={altText} onChange={(e) => setAltText(e.target.value)}
                  placeholder="Mô tả nội dung ảnh..."
                  className="w-full h-8 rounded-lg border border-slate-300 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Kích thước</label>
                <div className="flex gap-1">
                  {(["25", "50", "75", "100"] as ImgSize[]).map((s) => (
                    <button key={s} type="button" onClick={() => setSize(s)}
                      className={cn("flex-1 h-8 rounded-lg text-xs font-medium border transition-colors",
                        size === s ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 text-slate-600 hover:border-indigo-400")}>
                      {s === "100" ? "Full" : `${s}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Căn chỉnh</label>
              <div className="flex gap-1.5">
                {alignOpts.map(({ v, label, Icon }) => (
                  <button key={v} type="button" onClick={() => setAlign(v)}
                    className={cn("px-3 h-8 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors",
                      align === v ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 text-slate-600 hover:border-indigo-400")}>
                    {Icon && <Icon className="h-3.5 w-3.5" />}{label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t bg-white shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">Hủy</button>
          <button type="button" disabled={!selectedUrl}
            onClick={() => { if (selectedUrl) onInsert({ src: selectedUrl, alt: altText, style: buildStyle() }); }}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors">
            <ImageIcon className="h-4 w-4" />Chèn vào bài viết
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Format dropdown ───────────────────────────────────────────────────────────

function FormatSelect({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const getLabel = () => {
    if (!editor) return "Đoạn văn";
    if (editor.isActive("heading", { level: 1 })) return "Tiêu đề 1";
    if (editor.isActive("heading", { level: 2 })) return "Tiêu đề 2";
    if (editor.isActive("heading", { level: 3 })) return "Tiêu đề 3";
    if (editor.isActive("heading", { level: 4 })) return "Tiêu đề 4";
    if (editor.isActive("blockquote")) return "Trích dẫn";
    return "Đoạn văn";
  };

  const opts = [
    { label: "Đoạn văn", fn: () => editor?.chain().focus().setParagraph().run() },
    { label: "Tiêu đề 1", fn: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: "Tiêu đề 2", fn: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "Tiêu đề 3", fn: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "Tiêu đề 4", fn: () => editor?.chain().focus().toggleHeading({ level: 4 }).run() },
    { label: "Trích dẫn", fn: () => editor?.chain().focus().toggleBlockquote().run() },
  ];

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors min-w-[104px] justify-between">
        <span className="flex items-center gap-1.5"><Type className="h-3.5 w-3.5 text-slate-400 shrink-0" />{getLabel()}</span>
        <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 w-36 rounded-xl border border-slate-200 bg-white shadow-xl py-1">
          {opts.map((o) => (
            <button key={o.label} type="button" onClick={() => { o.fn(); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Link popup ────────────────────────────────────────────────────────────────

function LinkInput({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const confirm = () => {
    if (!editor) return;
    if (url) editor.chain().focus().setLink({ href: url }).run();
    setUrl(""); setOpen(false);
  };

  return (
    <div className="relative">
      <button type="button" title="Chèn/sửa link" onClick={() => setOpen(!open)}
        className={cn("h-7 w-7 flex items-center justify-center rounded transition-colors",
          editor?.isActive("link") ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")}>
        <Link2 className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute left-0 top-8 z-30 flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-2 shadow-xl">
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..." autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") confirm(); if (e.key === "Escape") { setOpen(false); setUrl(""); } }}
            className="h-7 w-56 rounded-lg border border-slate-200 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400" />
          <button type="button" onClick={confirm}
            className="h-7 px-3 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">OK</button>
          <button type="button" onClick={() => { setOpen(false); setUrl(""); }}
            className="h-7 w-7 flex items-center justify-center text-slate-400 hover:text-slate-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

const Sep = () => <span className="w-px h-4 bg-slate-200 mx-0.5 shrink-0 self-center" />;


// ── Main RichEditor ───────────────────────────────────────────────────────────

export interface RichEditorProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  minHeight?: number;
  onChange?: (html: string) => void;
  tenantId?: string;
}

export function RichEditor({
  name, defaultValue = "", placeholder = "Nhập nội dung...",
  label, minHeight = 500, onChange, tenantId = "",
}: RichEditorProps) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [sink, setSink] = useState(false);
  const [imgModal, setImgModal] = useState(false);
  const [htmlVal, setHtmlVal] = useState(defaultValue);
  const hiddenRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage.configure({ allowBase64: false, inline: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-indigo-600 underline" } }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      UnderlineExt,
    ],
    content: defaultValue,
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      setHtmlVal(html);
      if (hiddenRef.current) hiddenRef.current.value = html;
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: "max-w-none",
        style: `min-height:${minHeight}px`,
      },
    },
  });

  useEffect(() => { if (hiddenRef.current) hiddenRef.current.value = defaultValue; }, [defaultValue]);

  const toHtml = () => { if (editor) setHtmlVal(editor.getHTML()); setMode("html"); };
  const toVisual = () => {
    if (editor) {
      editor.commands.setContent(htmlVal);
      const h = editor.getHTML();
      if (hiddenRef.current) hiddenRef.current.value = h;
      onChange?.(h);
    }
    setMode("visual");
  };

  const onHtmlInput = (val: string) => {
    setHtmlVal(val);
    if (hiddenRef.current) hiddenRef.current.value = val;
    onChange?.(val);
  };

  const doInsertImage = ({ src, alt, style }: { src: string; alt: string; style: string }) => {
    if (!editor) return;
    editor.chain().focus().insertContent({ type: "image", attrs: { src, alt, style } }).run();
    setImgModal(false);
  };

  const wc = mode === "visual" ? (editor?.storage.characterCount?.words() ?? 0) : 0;
  const cc = mode === "visual" ? (editor?.storage.characterCount?.characters() ?? 0) : 0;
  const isV = mode === "visual";

  const tb = (active: boolean, title: string, fn: () => void, icon: React.ReactNode) => (
    <button type="button" title={title} onClick={fn}
      className={cn("h-7 w-7 flex items-center justify-center rounded transition-colors shrink-0",
        active ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800")}>
      {icon}
    </button>
  );

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}

      <div className="rounded-xl border border-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">

        {/* ── Toolbar row 1 ── */}
        <div className="flex items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5 flex-wrap min-h-[38px]">
          <button type="button" onClick={() => setImgModal(true)}
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shrink-0 mr-0.5">
            <ImageIcon className="h-3.5 w-3.5" />Thêm ảnh
          </button>
          <Sep />
          <FormatSelect editor={editor} />
          <Sep />
          {tb(editor?.isActive("bold") ?? false, "Bold", () => editor?.chain().focus().toggleBold().run(), <Bold className="h-3.5 w-3.5" />)}
          {tb(editor?.isActive("italic") ?? false, "Italic", () => editor?.chain().focus().toggleItalic().run(), <Italic className="h-3.5 w-3.5" />)}
          {tb(editor?.isActive("underline") ?? false, "Gạch dưới", () => editor?.chain().focus().toggleUnderline().run(), <Underline className="h-3.5 w-3.5" />)}
          {tb(editor?.isActive("strike") ?? false, "Gạch ngang", () => editor?.chain().focus().toggleStrike().run(), <Strikethrough className="h-3.5 w-3.5" />)}
          <Sep />
          {tb(editor?.isActive({ textAlign: "left" }) ?? false, "Căn trái", () => editor?.chain().focus().setTextAlign("left").run(), <AlignLeft className="h-3.5 w-3.5" />)}
          {tb(editor?.isActive({ textAlign: "center" }) ?? false, "Căn giữa", () => editor?.chain().focus().setTextAlign("center").run(), <AlignCenter className="h-3.5 w-3.5" />)}
          {tb(editor?.isActive({ textAlign: "right" }) ?? false, "Căn phải", () => editor?.chain().focus().setTextAlign("right").run(), <AlignRight className="h-3.5 w-3.5" />)}
          <Sep />
          {tb(editor?.isActive("bulletList") ?? false, "Danh sách", () => editor?.chain().focus().toggleBulletList().run(), <List className="h-3.5 w-3.5" />)}
          {tb(editor?.isActive("orderedList") ?? false, "Danh sách số", () => editor?.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-3.5 w-3.5" />)}
          <Sep />
          <LinkInput editor={editor} />
          {editor?.isActive("link") && tb(false, "Xóa link", () => editor?.chain().focus().unsetLink().run(), <Unlink className="h-3.5 w-3.5" />)}
          <Sep />
          {tb(false, "Hoàn tác", () => editor?.chain().focus().undo().run(), <Undo2 className="h-3.5 w-3.5" />)}
          {tb(false, "Làm lại", () => editor?.chain().focus().redo().run(), <Redo2 className="h-3.5 w-3.5" />)}
          <button type="button" title="Thêm công cụ" onClick={() => setSink(!sink)}
            className={cn("h-7 w-7 flex items-center justify-center rounded transition-colors ml-0.5 shrink-0",
              sink ? "bg-indigo-100 text-indigo-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700")}>
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          <div className="ml-auto flex rounded-lg overflow-hidden border border-slate-200 shrink-0">
            <button type="button" onClick={toVisual}
              className={cn("px-3 py-1 text-xs font-semibold transition-colors",
                isV ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100")}>
              Trực quan
            </button>
            <button type="button" onClick={toHtml}
              className={cn("px-3 py-1 text-xs font-semibold transition-colors border-l border-slate-200",
                !isV ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100")}>
              HTML
            </button>
          </div>
        </div>

        {/* ── Toolbar row 2 (kitchen sink) ── */}
        {sink && (
          <div className="flex items-center gap-0.5 border-b border-slate-200 bg-slate-50/80 px-2 py-1 flex-wrap">
            {tb(editor?.isActive("heading", { level: 1 }) ?? false, "H1", () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), <span className="text-[11px] font-bold">H1</span>)}
            {tb(editor?.isActive("heading", { level: 2 }) ?? false, "H2", () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), <span className="text-[11px] font-bold">H2</span>)}
            {tb(editor?.isActive("heading", { level: 3 }) ?? false, "H3", () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), <span className="text-[11px] font-bold">H3</span>)}
            {tb(editor?.isActive("heading", { level: 4 }) ?? false, "H4", () => editor?.chain().focus().toggleHeading({ level: 4 }).run(), <span className="text-[11px] font-bold">H4</span>)}
            <Sep />
            {tb(editor?.isActive("blockquote") ?? false, "Trích dẫn", () => editor?.chain().focus().toggleBlockquote().run(), <Quote className="h-3.5 w-3.5" />)}
            {tb(editor?.isActive("code") ?? false, "Inline code", () => editor?.chain().focus().toggleCode().run(), <Code className="h-3.5 w-3.5" />)}
            {tb(editor?.isActive("codeBlock") ?? false, "Code block", () => editor?.chain().focus().toggleCodeBlock().run(), <Code2 className="h-3.5 w-3.5" />)}
            <Sep />
            {tb(false, "Đường kẻ ngang", () => editor?.chain().focus().setHorizontalRule().run(), <Minus className="h-3.5 w-3.5" />)}
            <Sep />
            <button type="button" title="Xóa định dạng"
              onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
              className="h-7 px-2.5 flex items-center gap-1 rounded text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
              <X className="h-3 w-3" />Xóa định dạng
            </button>
          </div>
        )}

        {/* ── Content area ── */}
        {isV ? (
          <div className="re-visual">
            <EditorContent editor={editor} />
          </div>
        ) : (
          <textarea value={htmlVal} onChange={(e) => onHtmlInput(e.target.value)}
            spellCheck={false} placeholder="<p>Nhập HTML...</p>"
            className="w-full font-mono text-sm bg-white text-slate-800 border-0 px-5 py-4 focus:outline-none resize-none leading-relaxed"
            style={{ minHeight: `${minHeight}px` }} />
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-1.5">
          <span className="text-[10px] text-slate-400">
            {isV ? `${wc} từ · ${cc} ký tự` : "Chế độ HTML — chỉnh sửa mã nguồn trực tiếp"}
          </span>
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Library className="h-3 w-3" />TipTap Editor
          </span>
        </div>
      </div>

      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue} />

      {imgModal && tenantId && (
        <ImageInsertModal tenantId={tenantId} onInsert={doInsertImage} onClose={() => setImgModal(false)} />
      )}
      {imgModal && !tenantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-indigo-500" />Nhập URL ảnh
            </h3>
            <input type="url" id="fb-img-url" placeholder="https://..." autoFocus
              className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (document.getElementById("fb-img-url") as HTMLInputElement)?.value;
                  if (v) doInsertImage({ src: v, alt: "", style: "width:100%" });
                  else setImgModal(false);
                }
                if (e.key === "Escape") setImgModal(false);
              }}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setImgModal(false)} className="px-4 py-2 text-sm text-slate-500">Hủy</button>
              <button type="button"
                onClick={() => {
                  const v = (document.getElementById("fb-img-url") as HTMLInputElement)?.value;
                  if (v) doInsertImage({ src: v, alt: "", style: "width:100%" });
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">
                Chèn ảnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
