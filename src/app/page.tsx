import type { Metadata } from "next";
import { MarketingHomePage } from "@/components/marketing/home-page";
import { publicMetadata } from "@/components/marketing/seo";

export const metadata: Metadata = publicMetadata("/", "GFVGO Growth Platform - AI-powered Content, SEO & Social Management Platform", "Nền tảng quản lý website, SEO, content, social media, Facebook Pages, AI content, publishing và analytics tập trung cho doanh nghiệp.");

export default function HomePage() {
  return <MarketingHomePage />;
}
