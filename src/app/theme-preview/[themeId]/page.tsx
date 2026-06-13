import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TaxiPage } from "@/components/themes/taxi/taxi-page";
import { RestaurantPage } from "@/components/themes/restaurant/restaurant-page";
import { HotelPage } from "@/components/themes/hotel/hotel-page";
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

const PREVIEW_PROPS = {
  email: "lienhe@demo.vn",
  address: "123 Đường Trung Tâm, TP. Bắc Ninh",
};

export default async function ThemePreviewPage({ params }: Props) {
  const session = await getSession();
  if (!session) notFound();

  const { themeId } = await params;
  const theme = getTheme(themeId);
  if (!theme || theme.status !== "available") notFound();

  let preview: React.ReactNode = null;
  if (themeId === "taxi") {
    preview = <TaxiPage siteName="Taxi Demo" {...PREVIEW_PROPS} themeConfig={null} />;
  } else if (themeId === "restaurant") {
    preview = <RestaurantPage siteName="Nhà Hàng Demo" {...PREVIEW_PROPS} themeConfig={null} />;
  } else if (themeId === "hotel") {
    preview = <HotelPage siteName="Khách Sạn Demo" {...PREVIEW_PROPS} themeConfig={null} />;
  }

  if (!preview) notFound();

  return (
    <div className="relative">
      <div className="sticky top-0 z-[60] bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin/themes"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors shrink-0"
            >
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
      {preview}
    </div>
  );
}
