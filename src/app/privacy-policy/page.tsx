import type { Metadata } from "next";
import { LegalPage, privacySections } from "@/components/marketing/legal-pages";
import { publicMetadata } from "@/components/marketing/seo";
export const metadata: Metadata = publicMetadata("/privacy-policy", "Privacy Policy - GFVGO Growth Platform", "Privacy policy for GFVGO Growth Platform / GFVGO.");
export default function Page(){return <LegalPage title="Privacy Policy / Chính sách bảo mật" updated="13/09/2026" sections={privacySections}/>}
