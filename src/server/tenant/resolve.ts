import { headers } from "next/headers";
import { getTenantByDomain } from "@/server/queries/tenants";
import { tenants as demoTenants } from "@/server/queries/demo-data";

export type ResolvedTenant = { id: string; name: string; slug: string; primaryDomain: string | null };

export async function resolveTenant(): Promise<ResolvedTenant> {
  const host = (await headers()).get("host")?.replace(/^www\./, "") ?? "cms.30nice.vn";
  try {
    const tenant = await getTenantByDomain(host);
    if (tenant) return tenant;
  } catch {
    // DB not available — fall through to demo
  }
  const demo = demoTenants.find((t) => t.primaryDomain === host) ?? demoTenants[0];
  return demo;
}
