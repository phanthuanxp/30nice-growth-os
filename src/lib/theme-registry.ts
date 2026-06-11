export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: string;
  categoryColor: string;
  tags: string[];
  features: string[];
  primaryColor: string;
  accentColor: string;
  status: "available" | "coming-soon" | "beta";
  version: string;
  previewSections: string[];
}

export const THEME_REGISTRY: ThemeDefinition[] = [
  {
    id: "taxi",
    name: "Taxi Theme",
    description: "Giao diện chuyên nghiệp cho dịch vụ taxi & xe du lịch.",
    longDescription:
      "Theme thiết kế chuẩn cho dịch vụ taxi, xe du lịch, xe hợp đồng. Tích hợp sẵn form đặt xe, bảng giá, khu vực phục vụ, đánh giá khách hàng và FAQ. Copy 100% từ taxibacninh.vn.",
    category: "Vận tải",
    categoryColor: "#1d4ed8",
    tags: ["Taxi", "Xe du lịch", "Đặt xe", "Bảng giá"],
    features: [
      "Header cố định + menu responsive",
      "Hero banner + CTA gọi/Zalo nổi bật",
      "Form đặt xe đầy đủ fields → lưu Lead",
      "Bảng giá theo tuyến & loại xe",
      "Section dịch vụ dạng card",
      "Why choose us + thống kê",
      "Testimonials carousel",
      "FAQ accordion",
      "Footer đa cột + khu vực phục vụ",
      "Tối ưu mobile 100%",
    ],
    primaryColor: "#1d4ed8",
    accentColor: "#f97316",
    status: "available",
    version: "1.0.0",
    previewSections: ["Hero", "Booking Form", "Services", "Pricing", "Testimonials", "FAQ"],
  },
  {
    id: "restaurant",
    name: "Restaurant Theme",
    description: "Giao diện sang trọng cho nhà hàng, quán ăn, cà phê.",
    longDescription:
      "Theme dành cho nhà hàng, quán ăn, cà phê với thiết kế ấm áp, menu thực đơn đẹp, đặt bàn online và gallery ảnh món ăn.",
    category: "Nhà hàng",
    categoryColor: "#dc2626",
    tags: ["Nhà hàng", "Quán ăn", "Cà phê", "Đặt bàn"],
    features: [
      "Hero banner với ảnh món ăn",
      "Menu thực đơn phân loại",
      "Form đặt bàn online",
      "Gallery ảnh nhà hàng",
      "Giờ mở cửa & địa chỉ",
      "Đánh giá khách hàng",
      "Tích hợp Google Maps",
    ],
    primaryColor: "#dc2626",
    accentColor: "#f59e0b",
    status: "coming-soon",
    version: "1.0.0",
    previewSections: ["Hero", "Menu", "Gallery", "Reservation", "Reviews"],
  },
  {
    id: "hotel",
    name: "Hotel & Homestay",
    description: "Giao diện cao cấp cho khách sạn, resort, homestay.",
    longDescription:
      "Theme dành cho khách sạn, resort, homestay với thiết kế luxury, tích hợp đặt phòng, hiển thị tiện nghi và gallery phòng.",
    category: "Lưu trú",
    categoryColor: "#0891b2",
    tags: ["Khách sạn", "Resort", "Homestay", "Đặt phòng"],
    features: [
      "Hero full-screen + slideshow",
      "Danh sách phòng với giá",
      "Form đặt phòng check-in/out",
      "Gallery phòng & tiện nghi",
      "Testimonials & rating",
      "Location & attraction map",
    ],
    primaryColor: "#0891b2",
    accentColor: "#d97706",
    status: "coming-soon",
    version: "1.0.0",
    previewSections: ["Hero", "Rooms", "Amenities", "Gallery", "Booking"],
  },
  {
    id: "clinic",
    name: "Clinic & Spa",
    description: "Giao diện chuyên nghiệp cho phòng khám, spa, thẩm mỹ.",
    longDescription:
      "Theme dành cho phòng khám, spa, thẩm mỹ viện với thiết kế clean, tươi sáng. Tích hợp đặt lịch hẹn, dịch vụ và đội ngũ bác sĩ.",
    category: "Y tế & Sức khỏe",
    categoryColor: "#059669",
    tags: ["Phòng khám", "Spa", "Thẩm mỹ", "Đặt lịch"],
    features: [
      "Hero + đặt lịch hẹn nhanh",
      "Danh sách dịch vụ & giá",
      "Đội ngũ bác sĩ / chuyên viên",
      "Quy trình điều trị",
      "Before/after gallery",
      "FAQ & bảo hiểm",
    ],
    primaryColor: "#059669",
    accentColor: "#0ea5e9",
    status: "coming-soon",
    version: "1.0.0",
    previewSections: ["Hero", "Services", "Team", "Process", "Gallery"],
  },
  {
    id: "agency",
    name: "Business Agency",
    description: "Giao diện corporate cho công ty, agency, dịch vụ B2B.",
    longDescription:
      "Theme dành cho công ty, agency, dịch vụ B2B với thiết kế professional, tích hợp portfolio, team, testimonials và form liên hệ.",
    category: "Doanh nghiệp",
    categoryColor: "#7c3aed",
    tags: ["Công ty", "Agency", "B2B", "Corporate"],
    features: [
      "Hero professional + CTA",
      "Services & solutions",
      "Portfolio / case studies",
      "Team members",
      "Client logos / partners",
      "Contact form tích hợp",
    ],
    primaryColor: "#7c3aed",
    accentColor: "#f59e0b",
    status: "coming-soon",
    version: "1.0.0",
    previewSections: ["Hero", "Services", "Portfolio", "Team", "Contact"],
  },
  {
    id: "blog",
    name: "Blog & News",
    description: "Giao diện hiện đại cho blog, tạp chí, tin tức.",
    longDescription:
      "Theme dành cho blog cá nhân, tạp chí online, website tin tức với layout bài viết đẹp, phân loại chủ đề và tìm kiếm.",
    category: "Nội dung",
    categoryColor: "#be185d",
    tags: ["Blog", "Tin tức", "Tạp chí", "Nội dung"],
    features: [
      "Homepage grid bài viết",
      "Single post layout đẹp",
      "Category & tag filtering",
      "Author profile",
      "Related posts",
      "Newsletter subscribe",
    ],
    primaryColor: "#be185d",
    accentColor: "#f59e0b",
    status: "coming-soon",
    version: "1.0.0",
    previewSections: ["Home", "Post Grid", "Article", "Author", "Archive"],
  },
];

export function getTheme(id: string): ThemeDefinition | undefined {
  return THEME_REGISTRY.find((t) => t.id === id);
}

export function getAvailableThemes(): ThemeDefinition[] {
  return THEME_REGISTRY.filter((t) => t.status === "available");
}
