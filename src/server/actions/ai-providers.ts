"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/server/auth/session";
import {
  upsertAiProviderConfig,
  setDefaultAiProvider,
  setFallbackAiProvider,
  clearDefaultAiProvider,
  clearFallbackAiProvider,
} from "@/server/queries/ai-providers";

export type AiProviderActionState = { success?: boolean; error?: string };

const PROVIDER_LABELS: Record<string, string> = {
  claude: "Claude (Anthropic)",
  openai: "OpenAI (GPT)",
  gemini: "Google Gemini",
  niner_router: "9Router",
};

const VALID_PROVIDERS = ["claude", "openai", "gemini", "niner_router"];

export async function saveAiProviderAction(
  provider: string,
  _prev: AiProviderActionState,
  formData: FormData
): Promise<AiProviderActionState> {
  try {
    await requireAuth();
    if (!VALID_PROVIDERS.includes(provider)) return { error: "Provider không hợp lệ" };

    const apiKey = (formData.get("apiKey") as string | null)?.trim() || null;
    const baseUrl = (formData.get("baseUrl") as string | null)?.trim() || null;
    const model = (formData.get("model") as string | null)?.trim() || null;
    const isActive = formData.get("isActive") === "true";

    await upsertAiProviderConfig(provider, {
      label: PROVIDER_LABELS[provider] ?? provider,
      apiKey,
      baseUrl,
      model,
      isActive,
    });

    revalidatePath("/admin/settings/ai");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi lưu cấu hình" };
  }
}

export async function setDefaultProviderAction(
  _prev: AiProviderActionState,
  formData: FormData
): Promise<AiProviderActionState> {
  try {
    await requireAuth();
    const provider = formData.get("provider") as string;
    if (!VALID_PROVIDERS.includes(provider)) return { error: "Provider không hợp lệ" };
    await setDefaultAiProvider(provider);
    revalidatePath("/admin/settings/ai");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi cập nhật" };
  }
}

export async function setFallbackProviderAction(
  _prev: AiProviderActionState,
  formData: FormData
): Promise<AiProviderActionState> {
  try {
    await requireAuth();
    const provider = formData.get("provider") as string;
    if (!VALID_PROVIDERS.includes(provider)) return { error: "Provider không hợp lệ" };
    await setFallbackAiProvider(provider);
    revalidatePath("/admin/settings/ai");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi cập nhật" };
  }
}

export async function clearDefaultProviderAction(
  _prev: AiProviderActionState,
  formData: FormData
): Promise<AiProviderActionState> {
  try {
    await requireAuth();
    const provider = formData.get("provider") as string;
    await clearDefaultAiProvider(provider);
    revalidatePath("/admin/settings/ai");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi cập nhật" };
  }
}

export async function clearFallbackProviderAction(
  _prev: AiProviderActionState,
  formData: FormData
): Promise<AiProviderActionState> {
  try {
    await requireAuth();
    const provider = formData.get("provider") as string;
    await clearFallbackAiProvider(provider);
    revalidatePath("/admin/settings/ai");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi cập nhật" };
  }
}
