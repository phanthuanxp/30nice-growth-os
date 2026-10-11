import type { Metadata } from "next";
import { LegalPage, deletionSections } from "@/components/marketing/legal-pages";
import { publicMetadata } from "@/components/marketing/seo";
export const metadata: Metadata = publicMetadata("/data-deletion", "Data Deletion Instructions - GFVGO Growth Platform", "Data deletion instructions for GFVGO Growth Platform / GFVGO users and Meta/Facebook integrations.");
export default function Page(){return <LegalPage title="Data Deletion Instructions / Hướng dẫn xóa dữ liệu" updated="13/09/2026" sections={deletionSections}/>}
