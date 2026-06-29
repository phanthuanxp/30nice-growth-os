import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TravelNewsPage } from "@/components/themes/travel-news/travel-news-page";
import { getTheme } from "@/lib/theme-registry";
import { getSession } from "@/server/auth/session";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ themeId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { themeId } = await params;
  const theme = getTheme(themeId);
  return { title: theme ? `Xem trước: ${theme.name}` : "Xem trước theme", robots: "noindex" };
}

const DEMO_POSTS = Array.from({ length: 6 }, (_, i) => ({
  id: `demo-${i}`,
  title: ["Khám phá Hội An — thành phố cổ đẹp nhất Việt Nam", "Top 10 điểm du lịch Đà Nẵng không thể bỏ qua", "Kinh nghiệm du lịch Phú Quốc tự túc từ A đến Z", "Sapa mùa đông — băng tuyết và những cánh đồng hoa tím", "Review Nha Trang 4 ngày 3 đêm — biển đẹp ăn ngon", "Hà Giang — vùng đất của những cung đường đèo hùng vĩ"][i],
  slug: `bai-viet-demo-${i + 1}`,
  excerpt: "Bài viết chia sẻ kinh nghiệm du lịch chi tiết, giúp bạn lên kế hoạch chuyến đi hoàn hảo với ngân sách hợp lý...",
  featuredImage: null,
  publishedAt: new Date(Date.now() - i * 86400000 * 3),
  category: { name: ["Du lịch trong nước", "Kinh nghiệm", "Ẩm thực", "Khám phá"][i % 4] },
}));

export default async function ThemePreviewPage({ params }: Props) {
  const session = await getSession();
  if (!session) notFound();

  const { themeId } = await params;
  const theme = getTheme(themeId);
  if (!theme || theme.status !== "available") notFound();

  if (themeId !== "travel-news") notFound();

  return (
    <div className="relative">
      <div className="sticky top-0 z-[60] bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/themes"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors shrink-0">
              <ArrowLeft className="h-4 w-4" />
              Thư viện theme
            </Link>
            <span className="text-slate-600">|</span>
            <p className="text-sm truncate">
              Xem trước: <span className="font-semibold">{theme.name}</span>
              <span className="text-slate-400 ml-2 hidden sm:inline">dữ liệu mẫu — nội dung thật chỉnh trong Theme Editor</span>
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-900 px-2.5 py-1 rounded-full shrink-0">
            Preview
          </span>
        </div>
      </div>
      <TravelNewsPage
        siteName="30Nice Travel Demo"
        email="lienhe@demo.vn"
        address="123 Đường Trung Tâm, Hà Nội"
        themeConfig={null}
        navItems={[
          { label: "Trang chủ", href: "/" },
          { label: "Du lịch", href: "/du-lich" },
          { label: "Ẩm thực", href: "/am-thuc" },
          { label: "Kinh nghiệm", href: "/kinh-nghiem" },
        ]}
        recentPosts={DEMO_POSTS}
      />
    </div>
  );
}
