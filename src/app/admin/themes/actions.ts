"use server";

import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { getTheme } from "@/lib/theme-registry";

export async function applyThemeToSite(siteId: string, themeId: string) {
  const user = await getSession();
  if (!user) return { error: "Unauthorized" };

  const theme = getTheme(themeId);
  if (!theme) return { error: "Theme không tồn tại" };
  if (theme.status !== "available") return { error: "Theme chưa sẵn sàng" };

  try {
    await prisma.siteSettings.upsert({
      where: { tenantId: siteId },
      create: { tenantId: siteId, theme: themeId },
      update: { theme: themeId },
    });
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { error: "Lỗi khi áp dụng theme" };
  }
}

export async function getThemeUsage() {
  try {
    const settings = await prisma.siteSettings.findMany({
      where: { theme: { not: null } },
      select: { tenantId: true, theme: true, tenant: { select: { name: true, slug: true, primaryDomain: true } } },
    });
    return settings;
  } catch {
    return [];
  }
}
