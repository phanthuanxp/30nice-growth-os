export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TenantStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";

export const tenants = [
  { id: "cms", name: "30Nice News CMS", slug: "cms-30nice", primaryDomain: "cms.30nice.vn", status: "ACTIVE" as TenantStatus, pages: 18, posts: 126 },
  { id: "travel1", name: "Travel Việt Nam", slug: "travelvietnam", primaryDomain: "travelvietnam.vn", status: "ACTIVE" as TenantStatus, pages: 12, posts: 248 },
  { id: "travel2", name: "Du lịch Đông Nam Á", slug: "dulichdna", primaryDomain: "dulichdna.com", status: "ACTIVE" as TenantStatus, pages: 8, posts: 112 },
];

export const pages = [
  { id: "home", tenantId: "cms", title: "Trang chủ", slug: "", status: "PUBLISHED" as ContentStatus, summary: "30Nice News CMS homepage" },
  { id: "about", tenantId: "travel1", title: "Về chúng tôi", slug: "ve-chung-toi", status: "PUBLISHED" as ContentStatus, summary: "Giới thiệu về Travel Việt Nam" },
  { id: "contact", tenantId: "travel1", title: "Liên hệ", slug: "lien-he", status: "DRAFT" as ContentStatus, summary: "Form liên hệ" },
];

export const posts = [
  { id: "p1", tenantId: "travel1", title: "Top 10 điểm du lịch Việt Nam không thể bỏ qua", slug: "top-10-diem-du-lich-viet-nam", status: "PUBLISHED" as ContentStatus, excerpt: "Khám phá những địa danh nổi tiếng nhất Việt Nam từ Bắc vào Nam.", publishedAt: "2026-06-08" },
  { id: "p2", tenantId: "cms", title: "Cách vận hành AI Content Hub cho news CMS", slug: "ai-content-hub", status: "DRAFT" as ContentStatus, excerpt: "Quy trình tạo nội dung tin tức tự động có kiểm soát.", publishedAt: null },
];
