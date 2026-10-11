import type { Metadata } from "next";
import { LegalPage, termsSections } from "@/components/marketing/legal-pages";
import { publicMetadata } from "@/components/marketing/seo";
export const metadata: Metadata = publicMetadata("/terms-of-service", "Terms of Service - GFVGO Growth Platform", "Terms of Service for GFVGO Growth Platform / GFVGO.");
export default function Page(){return <LegalPage title="Terms of Service / Điều khoản sử dụng" updated="13/09/2026" sections={termsSections}/>}
