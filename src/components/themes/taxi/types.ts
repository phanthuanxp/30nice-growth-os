export interface TaxiNavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export interface TaxiService {
  title: string;
  description: string;
  href: string;
  image?: string;
}

export interface TaxiPricingRow {
  route: string;
  badge?: string;
  xe4: string;
  xe7: string;
  xe16: string;
}

export interface TaxiTestimonial {
  name: string;
  location: string;
  text: string;
  rating: number;
}

export interface TaxiBenefit {
  icon: string;
  title: string;
  description: string;
}

export interface TaxiFaq {
  question: string;
  answer: string;
}

export type TaxiSectionKey =
  | "hero"
  | "booking"
  | "features"
  | "services"
  | "pricing"
  | "whyChoose"
  | "testimonials"
  | "faq"
  | "cta";

export interface TaxiThemeConfig {
  phone: string;
  zaloLink: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage?: string;
  statsCount: string;
  statsRating: string;
  statsYears: string;
  navItems: TaxiNavItem[];
  services: TaxiService[];
  pricing: TaxiPricingRow[];
  pricingNote: string;
  benefits: TaxiBenefit[];
  testimonials: TaxiTestimonial[];
  faqs: TaxiFaq[];
  ctaTitle: string;
  ctaSubtitle: string;
  ctaDescription: string;
  footerAbout: string;
  footerServiceAreas: string[];
  footerLinks: { label: string; href: string }[];
  copyrightName: string;
  sectionOrder: TaxiSectionKey[];
  hiddenSections: TaxiSectionKey[];
  popup?: TaxiPopupConfig;
}

export interface TaxiPopupConfig {
  enabled: boolean;
  trigger: "exit-intent" | "time-delay";
  delaySeconds: number;
  title: string;
  description: string;
  ctaText: string;
}

export const DEFAULT_TAXI_CONFIG: TaxiThemeConfig = {
  phone: "0961 657 891",
  zaloLink: "https://zalo.me/0961657891",
  heroTitle: "Taxi Bắc Ninh — Đặt xe nhanh, giá trọn gói",
  heroSubtitle:
    "Hỗ trợ taxi Bắc Ninh 24/7 cho mọi tuyến. Xe sạch, tài xế lịch sự, tư vấn lộ trình và báo giá minh bạch trước chuyến.",
  statsCount: "1.200+",
  statsRating: "4.9",
  statsYears: "5+",
  navItems: [
    { label: "Trang chủ", href: "/" },
    {
      label: "Dịch vụ",
      href: "/dich-vu",
      children: [
        { label: "Taxi Hà Nội Bắc Ninh", href: "/taxi-bac-ninh" },
        { label: "Taxi Bắc Ninh Hà Nội", href: "/taxi-bac-ninh-ha-noi" },
        { label: "Taxi Nội Bài Bắc Ninh", href: "/taxi-noi-bai-bac-ninh" },
      ],
    },
    { label: "Bảng giá", href: "/bang-gia" },
    {
      label: "Blog Du Lịch",
      href: "/blog",
      children: [
        { label: "Kinh Nghiệm Đặt Xe", href: "/blog/kinh-nghiem" },
        { label: "Cẩm Nang Du Lịch", href: "/blog/cam-nang" },
      ],
    },
    { label: "Liên hệ", href: "/lien-he" },
  ],
  services: [
    {
      title: "Taxi Hà Nội Bắc Ninh",
      description:
        "Dịch vụ taxi xe riêng, đón tận nơi, không ghép khách, báo giá rõ trước chuyến.",
      href: "/taxi-bac-ninh",
    },
    {
      title: "Taxi Bắc Ninh Hà Nội",
      description:
        "Di chuyển từ Bắc Ninh về Hà Nội nhanh chóng, giá trọn gói, không lo phát sinh.",
      href: "/taxi-bac-ninh-ha-noi",
    },
    {
      title: "Taxi Nội Bài Bắc Ninh",
      description:
        "Dịch vụ sân bay hỗ trợ chuyến sớm/chuyến đêm, theo dõi lịch bay và hỗ trợ hành lý.",
      href: "/taxi-noi-bai-bac-ninh",
    },
  ],
  pricing: [
    { route: "Bắc Ninh nội tỉnh", badge: "Phổ biến", xe4: "350.000đ", xe7: "Liên hệ", xe16: "Liên hệ" },
    { route: "Bắc Ninh ↔ Từ Sơn", xe4: "Liên hệ", xe7: "Liên hệ", xe16: "Liên hệ" },
    { route: "Bắc Ninh ↔ Tiên Du", xe4: "Liên hệ", xe7: "Liên hệ", xe16: "Liên hệ" },
    { route: "Bắc Ninh ↔ Hà Nội", xe4: "Liên hệ", xe7: "Liên hệ", xe16: "Liên hệ" },
    { route: "Nội Bài ↔ Bắc Ninh", xe4: "Liên hệ", xe7: "Liên hệ", xe16: "Liên hệ" },
  ],
  pricingNote:
    "Giá trọn gói theo điểm đón, điểm trả và thực tế lộ trình. Hotline báo giá nhanh trong 2 phút.",
  benefits: [
    {
      icon: "clock",
      title: "Đón đúng điểm, đúng giờ",
      description:
        "Tài xế nắm tuyến Bắc Ninh, chủ động liên hệ xác nhận trước giờ đón.",
    },
    {
      icon: "tag",
      title: "Báo giá trọn gói",
      description:
        "Tư vấn chi phí theo lộ trình, loại xe và nhu cầu dừng đỗ thực tế, không phát sinh.",
    },
    {
      icon: "headphones",
      title: "Hỗ trợ 24/7",
      description:
        "Nhận đặt xe qua hotline/Zalo, phù hợp cả chuyến sáng sớm, muộn hoặc cần gấp.",
    },
  ],
  testimonials: [
    {
      name: "Anh Minh",
      location: "Bắc Ninh · Taxi nội tỉnh",
      text: "Đặt xe nhanh, tài xế gọi xác nhận trước và báo giá trọn gói. Rất hài lòng!",
      rating: 5,
    },
    {
      name: "Chị Hương",
      location: "Từ Sơn · Taxi Bắc Ninh",
      text: "Xe sạch, đi đúng giờ, hỗ trợ hành lý rất nhiệt tình. Sẽ dùng tiếp.",
      rating: 5,
    },
    {
      name: "Anh Quân",
      location: "Trung tâm · Đi sân bay Nội Bài",
      text: "Đặt xe đi Nội Bài rất đúng giờ, tài xế hỗ trợ hành lý nhiệt tình.",
      rating: 5,
    },
    {
      name: "Chị Lan",
      location: "Sân bay Nội Bài · Xe du lịch gia đình",
      text: "Gia đình đi Nội Bài cuối tuần, xe sạch và lái xe thân thiện với trẻ nhỏ.",
      rating: 5,
    },
    {
      name: "Anh Dũng",
      location: "Nội thành · Taxi nội tỉnh",
      text: "Giá báo rõ ràng từ đầu, không phát sinh thêm. Dịch vụ ổn định và dễ liên hệ.",
      rating: 5,
    },
    {
      name: "Chị Thảo",
      location: "Yên Phong · Taxi Hà Nội",
      text: "Chuyến đêm về muộn vẫn có xe ngay, cảm ơn dịch vụ rất chuyên nghiệp.",
      rating: 5,
    },
  ],
  faqs: [
    {
      question: "Có nên đặt taxi Bắc Ninh trước không?",
      answer:
        "Nên đặt trước để giữ đúng loại xe, đặc biệt vào giờ cao điểm, cuối tuần hoặc chuyến sân bay.",
    },
    {
      question: "Giá xe được tính như thế nào?",
      answer:
        "Giá phụ thuộc điểm đón, điểm trả, loại xe, thời gian và các điểm dừng phát sinh. Hotline sẽ báo rõ trước chuyến.",
    },
    {
      question: "Có hỗ trợ chuyến sớm hoặc chuyến đêm không?",
      answer:
        "Có. Dịch vụ hỗ trợ 24/7, bao gồm chuyến bay sớm, chuyến muộn và lịch cần đi gấp.",
    },
    {
      question: "Tôi nên đặt xe trước bao lâu?",
      answer:
        "Bạn nên đặt trước từ 30 phút đến 2 giờ để được điều xe nhanh. Với chuyến đi sân bay, nên đặt sớm hơn.",
    },
    {
      question: "Có hỗ trợ tuyến đi sân bay Nội Bài không?",
      answer:
        "Có. Đây là tuyến thường xuyên. Bạn có thể đặt xe 4 chỗ, 7 chỗ hoặc xe lớn hơn tùy số người và hành lý.",
    },
    {
      question: "Dịch vụ có xuất hóa đơn VAT không?",
      answer:
        "Có hỗ trợ xuất hóa đơn VAT theo yêu cầu. Vui lòng chọn mục VAT khi gửi form hoặc báo trước cho điều phối viên.",
    },
  ],
  ctaTitle: "Sẵn sàng đặt xe?",
  ctaSubtitle: "Cần taxi Bắc Ninh ngay?",
  ctaDescription:
    "Gọi hotline hoặc nhắn Zalo để được tư vấn xe phù hợp và báo giá nhanh trong 2 phút.",
  footerAbout:
    "Dịch vụ taxi Bắc Ninh xe riêng, báo giá trọn gói, hỗ trợ 24/7 cho mọi tuyến trong và ngoài tỉnh.",
  footerServiceAreas: [
    "Bắc Ninh",
    "Từ Sơn",
    "Tiên Du",
    "Yên Phong",
    "Quế Võ",
    "Hà Nội",
    "Sân bay Nội Bài",
  ],
  footerLinks: [
    { label: "Bảng giá taxi", href: "/bang-gia" },
    { label: "Dịch vụ taxi", href: "/dich-vu" },
    { label: "Blog du lịch", href: "/blog" },
    { label: "Liên hệ đặt xe", href: "/lien-he" },
  ],
  copyrightName: "Taxi Bắc Ninh",
  sectionOrder: ["hero", "booking", "features", "services", "pricing", "whyChoose", "testimonials", "faq", "cta"],
  hiddenSections: [],
  popup: {
    enabled: false,
    trigger: "exit-intent",
    delaySeconds: 30,
    title: "Khoan đã! Nhận báo giá trọn gói ngay",
    description: "Để lại số điện thoại, tài xế gọi lại tư vấn lộ trình và giá tốt nhất trong 5 phút.",
    ctaText: "Gọi lại cho tôi",
  },
};
