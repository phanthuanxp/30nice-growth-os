import { getAiProviderConfig, getDefaultAiProvider } from "@/server/queries/ai-providers";

type GenResult = { text: string; provider: string };

async function callClaude(apiKey: string, model: string | undefined, system: string, prompt: string): Promise<string> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: model ?? "claude-sonnet-4-6",
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  return message.content[0].type === "text" ? message.content[0].text : "";
}

async function callOpenAI(apiKey: string, model: string | undefined, system: string, prompt: string): Promise<string> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    max_tokens: 1024,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  });
  return completion.choices[0]?.message?.content ?? "";
}

async function callGemini(apiKey: string, model: string | undefined, system: string, prompt: string): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const gModel = genAI.getGenerativeModel({
    model: model ?? "gemini-2.0-flash",
    systemInstruction: system,
  });
  const result = await gModel.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate text using the default active AI provider (DB config first, env fallback).
 * Throws if no provider is configured.
 */
export async function aiGenerate(system: string, prompt: string): Promise<GenResult> {
  // 1. Default provider from DB
  let provider: string | null = null;
  let apiKey: string | null = null;
  let model: string | undefined;

  try {
    const def = await getDefaultAiProvider();
    if (def?.apiKey) {
      provider = def.provider;
      apiKey = def.apiKey;
      model = def.model ?? undefined;
    }
  } catch { /* DB not ready */ }

  // 2. Any active provider from DB
  if (!apiKey) {
    for (const p of ["claude", "openai", "gemini"]) {
      try {
        const cfg = await getAiProviderConfig(p);
        if (cfg?.isActive && cfg.apiKey) {
          provider = p;
          apiKey = cfg.apiKey;
          model = cfg.model ?? undefined;
          break;
        }
      } catch { /* skip */ }
    }
  }

  // 3. Env fallback
  if (!apiKey) {
    if (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-api03-...")) {
      provider = "claude";
      apiKey = process.env.ANTHROPIC_API_KEY;
    } else if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith("sk-...")) {
      provider = "openai";
      apiKey = process.env.OPENAI_API_KEY;
    } else if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "YOUR_GEMINI_KEY") {
      provider = "gemini";
      apiKey = process.env.GEMINI_API_KEY;
    }
  }

  if (!provider || !apiKey) {
    throw new Error("Chưa cấu hình AI provider nào. Vào Cài đặt → AI để thêm API key.");
  }

  let text: string;
  switch (provider) {
    case "claude":
      text = await callClaude(apiKey, model, system, prompt);
      break;
    case "openai":
      text = await callOpenAI(apiKey, model, system, prompt);
      break;
    case "gemini":
      text = await callGemini(apiKey, model, system, prompt);
      break;
    default:
      throw new Error(`Provider không hỗ trợ: ${provider}`);
  }

  return { text, provider };
}

const SEO_META_SYSTEM =
  'Bạn là chuyên gia SEO. Khi được cho tiêu đề và nội dung, tạo SEO Title (50-60 ký tự, chứa từ khóa chính) và Meta Description (120-155 ký tự, hấp dẫn, có CTA). Trả lời CHÍNH XÁC theo định dạng, không thêm gì khác:\nSEO TITLE: ...\nMETA DESCRIPTION: ...';

export async function generateSeoMeta(input: {
  title: string;
  content?: string;
  siteName?: string;
}): Promise<{ seoTitle: string; seoDescription: string }> {
  const contentSnippet = (input.content ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 1500);

  const prompt = `Tiêu đề: ${input.title}\n${input.siteName ? `Website: ${input.siteName}\n` : ""}${
    contentSnippet ? `Nội dung: ${contentSnippet}` : ""
  }`;

  const { text } = await aiGenerate(SEO_META_SYSTEM, prompt);

  const titleMatch = text.match(/SEO TITLE:\s*(.+)/i);
  const descMatch = text.match(/META DESCRIPTION:\s*(.+)/i);

  const seoTitle = (titleMatch?.[1] ?? input.title).trim().slice(0, 70);
  const seoDescription = (descMatch?.[1] ?? "").trim().slice(0, 160);

  if (!seoDescription) throw new Error("AI không trả về meta description hợp lệ");
  return { seoTitle, seoDescription };
}
