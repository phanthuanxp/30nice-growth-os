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

function leadEmailHtml(payload: LeadNotificationPayload): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 12px;color:#64748b;font-size:13px;white-space:nowrap">${label}</td><td style="padding:8px 12px;color:#0f172a;font-size:14px;font-weight:500">${value}</td></tr>`;
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="background:#1d4ed8;padding:16px 20px"><p style="margin:0;color:#ffffff;font-size:16px;font-weight:bold">🚗 Lead mới từ website</p></div>
    <table style="width:100%;border-collapse:collapse">
      ${row("Tên", payload.name)}
      ${row("SĐT", `<a href="tel:${payload.phone.replace(/\s/g, "")}" style="color:#1d4ed8">${payload.phone}</a>`)}
      ${payload.message ? row("Thông tin", payload.message) : ""}
      ${payload.sourceDomain ? row("Website", payload.sourceDomain) : ""}
      ${row("Thời gian", new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }))}
    </table>
    <div style="padding:12px 20px;border-top:1px solid #f1f5f9"><p style="margin:0;color:#94a3b8;font-size:11px">Gửi tự động bởi 30Nice Growth OS — liên hệ khách trong 5 phút để tăng tỉ lệ chốt.</p></div>
  </div></body></html>`;
}

export async function sendEmailNotification(
  recipients: string[],
  payload: LeadNotificationPayload,
  options?: { resendApiKey?: string; from?: string }
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = options?.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Chưa cấu hình Resend API key (RESEND_API_KEY hoặc trong Forms & Lead)" };
  }
  const from = options?.from || process.env.RESEND_FROM || "30Nice Growth OS <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: `🚗 Lead mới: ${payload.name} — ${payload.phone}${payload.sourceDomain ? ` (${payload.sourceDomain})` : ""}`,
        html: leadEmailHtml(payload),
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { message?: string } | null;
      return { ok: false, error: data?.message ?? `Resend HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export interface NotificationConfig {
  telegram?: { botToken: string; chatId: string; enabled: boolean };
  zalo?: { webhookUrl: string; enabled: boolean };
  email?: { recipients: string[]; enabled: boolean; resendApiKey?: string; from?: string };
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
    const r = await sendEmailNotification(config.email.recipients, payload, {
      resendApiKey: config.email.resendApiKey,
      from: config.email.from,
    });
    results.push({ channel: "email", ...r });
  }

  return results;
}
