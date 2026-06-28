export interface TravelNewsNavItem {
  label: string;
  href: string;
}

export interface TravelNewsThemeConfig {
  phone?: string;
  zaloLink?: string;
  navItems: TravelNewsNavItem[];
  heroTagline: string;
  footerAbout: string;
  footerLinks: { label: string; href: string }[];
  categories: string[];
  copyrightName: string;
  accentColor: string;
  socialFacebook?: string;
  socialYoutube?: string;
}

export const DEFAULT_TRAVEL_NEWS_CONFIG: TravelNewsThemeConfig = {
  navItems: [
    { label: "Trang chủ", href: "/" },
    { label: "Du lịch", href: "/blog" },
    { label: "Kinh nghiệm", href: "/blog" },
    { label: "Điểm đến", href: "/blog" },
    { label: "Ẩm thực", href: "/blog" },
    { label: "Liên hệ", href: "#contact" },
  ],
  heroTagline: "Khám phá Việt Nam và Đông Nam Á",
  footerAbout: "Trang tin tức du lịch cập nhật kinh nghiệm, điểm đến và cẩm nang cho du khách trong và ngoài nước.",
  footerLinks: [
    { label: "Trang chủ", href: "/" },
    { label: "Tin du lịch", href: "/blog" },
    { label: "Liên hệ", href: "#contact" },
  ],
  categories: ["Du lịch", "Ẩm thực", "Khách sạn", "Kinh nghiệm", "Điểm đến"],
  copyrightName: "Travel News",
  accentColor: "#059669",
};
