"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/session";
import { getMetaRuntimeSettings, writeMetaSettings } from "@/server/meta/settings-store";

export type MetaSettingsActionState = { success?: boolean; error?: string };

export async function saveMetaSettingsAction(_prev: MetaSettingsActionState, formData: FormData): Promise<MetaSettingsActionState> {
  try {
    await requireAuth();
    const current = getMetaRuntimeSettings();
    const appId = (formData.get("appId") as string | null)?.trim() || current.appId || "";
    const appSecret = (formData.get("appSecret") as string | null)?.trim() || current.appSecret || "";
    const tokenEncryptionKey = (formData.get("tokenEncryptionKey") as string | null)?.trim() || current.tokenEncryptionKey || "";
    const webhookVerifyToken = (formData.get("webhookVerifyToken") as string | null)?.trim() || current.webhookVerifyToken || "";
    const redirectUri = (formData.get("redirectUri") as string | null)?.trim() || current.redirectUri || "";
    const graphVersion = (formData.get("graphVersion") as string | null)?.trim() || current.graphVersion || "v26.0";
    if (!appId) return { error: "Cần nhập Meta App ID" };
    if (!appSecret) return { error: "Cần nhập Meta App Secret" };
    if (!tokenEncryptionKey || tokenEncryptionKey.length < 32) return { error: "Token Encryption Key cần ít nhất 32 ký tự" };
    if (redirectUri && !redirectUri.startsWith("https://")) return { error: "Callback URL production phải dùng https://" };
    if (!/^v\d+\.\d+$/.test(graphVersion)) return { error: "Graph API version phải có dạng v26.0" };
    writeMetaSettings({ appId, appSecret, tokenEncryptionKey, webhookVerifyToken, redirectUri, graphVersion });
    revalidatePath("/admin/settings/meta");
    revalidatePath("/admin/social/pages");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không thể lưu Meta settings" };
  }
}
