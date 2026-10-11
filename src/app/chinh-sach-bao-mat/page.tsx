import type { Metadata } from "next";
import { LegalPage, privacySections } from "@/components/marketing/legal-pages";
import { publicMetadata } from "@/components/marketing/seo";
export const metadata: Metadata = publicMetadata("/chinh-sach-bao-mat", "Chính sách bảo mật - GFVGO Growth Platform", "Chính sách quyền riêng tư và xử lý dữ liệu của GFVGO Growth Platform / GFVGO.");
export default function Page(){return <LegalPage title="Chính sách bảo mật" updated="13/09/2026" sections={privacySections}/>}
