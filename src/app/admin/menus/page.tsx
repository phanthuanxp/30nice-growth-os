import type { Metadata } from "next";
import { Plus, GripVertical, Navigation } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Menus" };

const DEMO_MENUS = [
  {
    id: "main",
    name: "Main Navigation",
    tenantName: "Taxi Bắc Ninh",
    location: "header",
    items: [
      { label: "Trang chủ", href: "/" },
      { label: "Dịch vụ", href: "/dich-vu" },
      { label: "Bảng giá", href: "/bang-gia" },
      { label: "Blog", href: "/blog" },
      { label: "Liên hệ", href: "/lien-he" },
    ],
  },
  {
    id: "footer",
    name: "Footer Links",
    tenantName: "30Nice CMS Network",
    location: "footer",
    items: [
      { label: "Về chúng tôi", href: "/about" },
      { label: "Chính sách", href: "/chinh-sach" },
      { label: "Sitemap", href: "/sitemap" },
    ],
  },
];

export default function MenusPage() {
  return (
    <div>
      <PageHeader
        title="Menus & Navigation"
        description="Quản lý menu cho tất cả các sites."
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Tạo Menu
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DEMO_MENUS.map((menu) => (
          <Card key={menu.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-indigo-500" />
                    {menu.name}
                  </CardTitle>
                  <div className="flex gap-2 mt-1.5">
                    <Badge variant="neutral">{menu.tenantName}</Badge>
                    <Badge variant="info">{menu.location}</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm">Sửa</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-slate-100">
                {menu.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 px-6 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <GripVertical className="h-4 w-4 text-slate-300 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-slate-700">
                      {item.label}
                    </span>
                    <code className="text-xs text-slate-400 bg-slate-50 rounded px-1.5 py-0.5">
                      {item.href}
                    </code>
                  </li>
                ))}
              </ul>
              <div className="px-6 py-3 border-t border-slate-100">
                <Button variant="ghost" size="sm" className="text-indigo-600">
                  <Plus className="h-3.5 w-3.5" />
                  Thêm mục
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
