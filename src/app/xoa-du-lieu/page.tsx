import type { Metadata } from "next";
import { LegalPage, deletionSections } from "@/components/marketing/legal-pages";
import { publicMetadata } from "@/components/marketing/seo";
export const metadata: Metadata = publicMetadata("/xoa-du-lieu", "Hướng dẫn xóa dữ liệu - GFVGO Growth Platform", "Cách yêu cầu xóa dữ liệu người dùng và dữ liệu Facebook/Meta khỏi GFVGO Growth Platform / GFVGO.");
export default function Page(){return <LegalPage title="Hướng dẫn xóa dữ liệu" updated="13/09/2026" sections={deletionSections}/>}
