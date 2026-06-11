"use server";

import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import type { TaxiThemeConfig } from "@/components/themes/taxi/types";

export async function saveThemeSettings(
  siteId: string,
  data: {
    theme: string;
    phone?: string;
    zaloLink?: string;
    primaryColor?: string;
    logoUrl?: string;
    themeConfig?: Partial<TaxiThemeConfig>;
  }
) {
  const user = await getSession();
  if (!user) return { error: "Unauthorized" };

  try {
    const existing = await prisma.siteSettings.findUnique({ where: { tenantId: siteId } });
    const socialLinks = (existing?.socialLinks as Record<string, string> | null) ?? {};

    await prisma.siteSettings.upsert({
      where: { tenantId: siteId },
      create: {
        tenantId: siteId,
        theme: data.theme,
        phone: data.phone ?? null,
        primaryColor: data.primaryColor ?? null,
        logoUrl: data.logoUrl ?? null,
        socialLinks: { ...socialLinks, zalo: data.zaloLink ?? "" },
        themeConfig: (data.themeConfig ?? {}) as object,
      },
      update: {
        theme: data.theme,
        phone: data.phone ?? existing?.phone ?? null,
        primaryColor: data.primaryColor ?? existing?.primaryColor ?? null,
        logoUrl: data.logoUrl ?? existing?.logoUrl ?? null,
        socialLinks: { ...socialLinks, zalo: data.zaloLink ?? "" },
        themeConfig: (data.themeConfig ?? existing?.themeConfig ?? {}) as object,
      },
    });
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { error: "Lỗi khi lưu cài đặt" };
  }
}
