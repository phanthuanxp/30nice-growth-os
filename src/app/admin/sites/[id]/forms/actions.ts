"use server";

import { prisma } from "@/server/db";
import { getSession } from "@/server/auth/session";
import { sendTelegram, sendZaloWebhook } from "@/lib/notifications";
import type { NotificationConfig } from "@/lib/notifications";

export async function saveFormNotifications(siteId: string, config: NotificationConfig) {
  const user = await getSession();
  if (!user) return { error: "Unauthorized" };

  try {
    const existing = await prisma.integration.findFirst({
      where: { tenantId: siteId, provider: "lead_notifications" },
      select: { id: true },
    });
    if (existing) {
      await prisma.integration.update({
        where: { id: existing.id },
        data: { status: "CONNECTED", config: config as object },
      });
    } else {
      await prisma.integration.create({
        data: { tenantId: siteId, provider: "lead_notifications", status: "CONNECTED", config: config as object },
      });
    }
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { error: "Lỗi khi lưu cài đặt" };
  }
}

export async function testTelegramNotification(siteId: string, botToken: string, chatId: string) {
  const user = await getSession();
  if (!user) return { error: "Unauthorized" };

  return sendTelegram(botToken, chatId, {
    name: "Test Lead",
    phone: "0912345678",
    message: "Đây là tin nhắn test từ hệ thống 30Nice Growth OS",
    sourceDomain: "admin-test",
  });
}

export async function testZaloNotification(siteId: string, webhookUrl: string) {
  const user = await getSession();
  if (!user) return { error: "Unauthorized" };

  return sendZaloWebhook(webhookUrl, {
    name: "Test Lead",
    phone: "0912345678",
    message: "Đây là tin nhắn test từ hệ thống 30Nice Growth OS",
    sourceDomain: "admin-test",
  });
}

export async function getFormConfig(siteId: string) {
  const user = await getSession();
  if (!user) return null;

  try {
    const integration = await prisma.integration.findFirst({
      where: { tenantId: siteId, provider: "lead_notifications" },
    });
    return integration?.config as NotificationConfig | null;
  } catch {
    return null;
  }
}
