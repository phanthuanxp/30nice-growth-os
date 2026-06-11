import type { Metadata } from "next";
import { Upload, Image as ImageIcon, FileText, FileVideo } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Media Library" };

const DEMO_MEDIA = [
  { id: "1", filename: "hero-taxi-bacninh.jpg", mimeType: "image/jpeg", size: 284000, alt: "Xe taxi Bắc Ninh", url: "/demo/img1.jpg" },
  { id: "2", filename: "logo-30nice.svg", mimeType: "image/svg+xml", size: 4200, alt: "30Nice logo", url: "/demo/logo.svg" },
  { id: "3", filename: "seo-guide-2026.pdf", mimeType: "application/pdf", size: 1240000, alt: "", url: "/demo/seo.pdf" },
  { id: "4", filename: "banner-landing.jpg", mimeType: "image/jpeg", size: 432000, alt: "Banner landing", url: "/demo/banner.jpg" },
  { id: "5", filename: "intro-video.mp4", mimeType: "video/mp4", size: 8400000, alt: "", url: "/demo/video.mp4" },
  { id: "6", filename: "og-taxibacninh.jpg", mimeType: "image/jpeg", size: 186000, alt: "OG image taxi Bắc Ninh", url: "/demo/og.jpg" },
];

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-indigo-400" />;
  if (mimeType.startsWith("video/")) return <FileVideo className="h-5 w-5 text-violet-400" />;
  return <FileText className="h-5 w-5 text-slate-400" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Quản lý tất cả hình ảnh, video, tài liệu của các sites."
        action={
          <Button size="sm">
            <Upload className="h-4 w-4" />
            Upload file
          </Button>
        }
      />

      {/* Upload area placeholder */}
      <div className="mb-6 flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 px-6 text-center">
        <div>
          <Upload className="mx-auto h-8 w-8 text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">
            Kéo thả file vào đây hoặc{" "}
            <button className="text-indigo-600 underline underline-offset-2 cursor-pointer">chọn file</button>
          </p>
          <p className="text-xs text-slate-400 mt-1">PNG, JPG, SVG, PDF, MP4 — tối đa 20MB</p>
          <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-3 py-1 inline-block">
            Upload thật sẽ được implement ở Phase 2
          </p>
        </div>
      </div>

      {/* Grid / list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tất cả files ({DEMO_MEDIA.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Lưới</Button>
              <Button variant="ghost" size="sm">Danh sách</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {DEMO_MEDIA.map((f) => (
              <div
                key={f.id}
                className="group relative rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-2 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex h-16 items-center justify-center">
                  <FileIcon mimeType={f.mimeType} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700 truncate" title={f.filename}>
                    {f.filename}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {f.mimeType.split("/")[1].toUpperCase()} · {formatBytes(f.size)}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-x-0 bottom-0 p-2 flex gap-1 bg-white/90 border-t border-slate-100 rounded-b-xl">
                  <Button variant="ghost" size="sm" className="flex-1 text-xs h-7">Copy URL</Button>
                  <Button variant="danger" size="sm" className="text-xs h-7 px-2">✕</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
