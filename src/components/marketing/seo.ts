import type { Metadata } from "next";
import { COMPANY } from "./site";

export function publicMetadata(path: string, title: string, description: string): Metadata {
  const url = `${COMPANY.domain}${path}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, siteName: COMPANY.product, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}
