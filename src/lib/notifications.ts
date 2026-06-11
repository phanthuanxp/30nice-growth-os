export interface LeadNotificationPayload {
  name: string;
  phone: string;
  message?: string;
  sourceDomain?: string;
  extra?: Record<string, string>;
}

function formatLeadMessage(payload: LeadNotificationPayload): string {
  const lines = [
    `🚗 *Đặt xe mới!*`,
    `👤 Tên: ${payload.name}`,
    `📞 SĐT: ${payload.phone}`,
  ];
  if (payload.message) lines.push(`📝 Thông tin: ${payload.message}`);
  if (payload.sourceDomain) lines.push(`🌐 Website: ${payload.sourceDomain}`);
  lines.push(`🕐 Thời gian: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`);
  return lines.join("\n");
}

export async function sendTelegram(
  botToken: string,
  chatId: string,
  payload: LeadNotificationPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const text = formatLeadMessage(payload);
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) return { ok: false, error: data.description };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function sendZaloWebhook(
  webhookUrl: string,
  payload: LeadNotificationPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "new_lead",
        name: payload.name,
        phone: payload.phone,
        message: payload.message ?? "",
        source: payload.sourceDomain ?? "",
        timestamp: new Date().toISOString(),
      }),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function sendEmailNotification(
  recipients: string[],
  payload: LeadNotificationPayload
): Promise<{ ok: boolean; error?: string }> {
  // Placeholder — integrate with SMTP/Resend/SendGrid via Integration config
  // For now logs to console; wire up actual transport in Integration settings
  console.log("[Email notification]", { recipients, payload });
  return { ok: true };
}

export interface NotificationConfig {
  telegram?: { botToken: string; chatId: string; enabled: boolean };
  zalo?: { webhookUrl: string; enabled: boolean };
  email?: { recipients: string[]; enabled: boolean };
}

export async function dispatchLeadNotifications(
  config: NotificationConfig,
  payload: LeadNotificationPayload
) {
  const results: { channel: string; ok: boolean; error?: string }[] = [];

  if (config.telegram?.enabled && config.telegram.botToken && config.telegram.chatId) {
    const r = await sendTelegram(config.telegram.botToken, config.telegram.chatId, payload);
    results.push({ channel: "telegram", ...r });
  }

  if (config.zalo?.enabled && config.zalo.webhookUrl) {
    const r = await sendZaloWebhook(config.zalo.webhookUrl, payload);
    results.push({ channel: "zalo", ...r });
  }

  if (config.email?.enabled && config.email.recipients.length > 0) {
    const r = await sendEmailNotification(config.email.recipients, payload);
    results.push({ channel: "email", ...r });
  }

  return results;
}
