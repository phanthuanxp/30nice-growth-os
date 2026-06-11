export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "WON";
export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type TenantStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";

export const tenants = [
  { id: "cms", name: "30Nice CMS Network", slug: "cms-30nice", primaryDomain: "cms.30nice.vn", status: "ACTIVE" as TenantStatus, pages: 18, posts: 126, leads: 42 },
  { id: "taxibacninh", name: "Taxi Bắc Ninh", slug: "taxibacninh", primaryDomain: "taxibacninh.vn", status: "ACTIVE" as TenantStatus, pages: 36, posts: 248, leads: 384 },
  { id: "taxivandon", name: "Taxi Vân Đồn", slug: "taxivandon", primaryDomain: "taxivandon.com", status: "ACTIVE" as TenantStatus, pages: 24, posts: 112, leads: 96 },
];

export const pages = [
  { id: "home", tenantId: "cms", title: "Trang chủ", slug: "", status: "PUBLISHED" as ContentStatus, summary: "30Nice Growth OS homepage" },
  { id: "landing", tenantId: "taxibacninh", title: "Taxi Bắc Ninh", slug: "taxi-bac-ninh", status: "PUBLISHED" as ContentStatus, summary: "Landing page dịch vụ taxi Bắc Ninh" },
  { id: "contact", tenantId: "taxibacninh", title: "Liên hệ", slug: "lien-he", status: "DRAFT" as ContentStatus, summary: "Form tư vấn" },
];

export const posts = [
  { id: "p1", tenantId: "taxibacninh", title: "Checklist SEO local cho dịch vụ taxi", slug: "checklist-seo-local-taxi", status: "PUBLISHED" as ContentStatus, excerpt: "Các việc cần làm để tăng hiển thị local.", publishedAt: "2026-06-08" },
  { id: "p2", tenantId: "cms", title: "Cách vận hành AI Content Hub", slug: "ai-content-hub", status: "DRAFT" as ContentStatus, excerpt: "Quy trình tạo nội dung có kiểm soát.", publishedAt: null },
];

export const leads = [
  { id: "l1", tenantId: "taxibacninh", name: "Anh Minh", phone: "09xx xxx xxx", email: "", status: "NEW" as LeadStatus, sourcePath: "/taxi-bac-ninh", message: "Cần xe 7 chỗ đi sân bay" },
  { id: "l2", tenantId: "cms", name: "Chị Lan", phone: "08xx xxx xxx", email: "lan@example.com", status: "QUALIFIED" as LeadStatus, sourcePath: "/", message: "Muốn tư vấn hệ thống CMS" },
];
