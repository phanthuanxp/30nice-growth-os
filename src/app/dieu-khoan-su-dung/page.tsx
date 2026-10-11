import type { Metadata } from "next";
import { LegalPage, termsSections } from "@/components/marketing/legal-pages";
import { publicMetadata } from "@/components/marketing/seo";
export const metadata: Metadata = publicMetadata("/dieu-khoan-su-dung", "Điều khoản sử dụng - GFVGO Growth Platform", "Điều khoản sử dụng nền tảng GFVGO Growth Platform / GFVGO.");
export default function Page(){return <LegalPage title="Điều khoản sử dụng" updated="13/09/2026" sections={termsSections}/>}
