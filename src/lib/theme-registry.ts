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
    id: "travel-news",
    name: "Travel News",
    description: "Giao diện tạp chí du lịch — phù hợp cho travel blog & tin tức.",
    longDescription:
      "Theme magazine chuyên biệt cho website tin tức du lịch. Dark header sang trọng, card grid bài viết, tích hợp internal linking tự động và layout bài viết chuẩn SEO.",
    category: "Tin tức",
    categoryColor: "#059669",
    tags: ["Du lịch", "Blog", "Tin tức", "Magazine", "SEO"],
    features: [
      "Header tối với category nav",
      "Hero banner + tagline",
      "Grid bài viết nổi bật",
      "Card bài với ảnh, category, ngày",
      "Article layout chuẩn SEO",
      "Internal links tự động",
      "Footer đa cột với social links",
      "Responsive 100%",
    ],
    primaryColor: "#059669",
    accentColor: "#10b981",
    status: "available",
    version: "1.0.0",
    previewSections: ["Header", "Hero", "Post Grid", "Article", "Footer"],
  },
  {
    id: "blog",
    name: "Blog & News",
    description: "Giao diện hiện đại cho blog cá nhân, tạp chí, tin tức.",
    longDescription:
      "Theme dành cho blog, tạp chí online, website tin tức với layout bài viết đẹp, phân loại chủ đề và tìm kiếm nội dung.",
    category: "Tin tức",
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
