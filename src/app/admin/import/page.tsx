import type { Metadata } from "next";
import Link from "next/link";
import { Download, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImportForm } from "@/components/admin/import-form";
import { getTenants } from "@/server/queries/tenants";

export const metadata: Metadata = { title: "Nhập dữ liệu" };

export default async function ImportPage() {
  let tenants: { id: string; name: string }[] = [];
  try {
    const rows = await getTenants();
    tenants = rows.map((t) => ({ id: t.id, name: t.name }));
  } catch {
    // DB not available
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhập dữ liệu"
        description="Chuyển nội dung từ WordPress sang 30Nice Growth OS."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Import form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-4 w-4 text-indigo-500" />
                Nhập từ WordPress
              </CardTitle>
              <CardDescription>
                Kết nối với WordPress REST API để nhập trang, bài viết và danh mục.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenants.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">
                    Cần kết nối database và tạo ít nhất một site trước khi nhập dữ liệu.
                  </p>
                  <Link href="/admin/sites/new">
                    <Button variant="outline" size="sm">
                      Tạo site mới
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <ImportForm tenants={tenants} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <Card className="bg-sky-50 border-sky-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-semibold text-sky-800 mb-2">Điều kiện cần</p>
              <ul className="space-y-1.5 text-xs text-sky-700">
                <li>• WordPress REST API phải công khai</li>
                <li>• URL dạng: <code className="bg-sky-100 rounded px-1">https://domain.com</code></li>
                <li>• Không cần đăng nhập nếu nội dung public</li>
                <li>• Yoast SEO sẽ được nhập nếu có</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">Dữ liệu được nhập</p>
              <div className="space-y-2 text-xs text-slate-600">
                {[
                  { label: "Trang (Pages)", detail: "Tiêu đề, slug, nội dung, SEO" },
                  { label: "Danh mục", detail: "Tên và slug danh mục" },
                  { label: "Bài viết (Posts)", detail: "Tiêu đề, excerpt, nội dung, SEO, ngày đăng" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-slate-400">{item.detail}</p>
                    </div>
                  </div>
                ))}
                {[
                  { label: "Media / hình ảnh", detail: "Chưa hỗ trợ" },
                  { label: "Plugin data", detail: "Không áp dụng" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2">
                    <span className="text-slate-300 mt-0.5">✗</span>
                    <div>
                      <p className="font-medium text-slate-400">{item.label}</p>
                      <p className="text-slate-300">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">Sau khi nhập</p>
              <div className="space-y-1.5">
                <Link href="/admin/pages">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Xem danh sách Pages
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/admin/blog">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Xem danh sách Bài viết
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/admin/seo-ai">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Chạy SEO Audit
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
