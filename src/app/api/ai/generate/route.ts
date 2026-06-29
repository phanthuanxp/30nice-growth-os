import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { getAiProviderConfig, getDefaultAiProvider, getFallbackAiProvider } from "@/server/queries/ai-providers";

export type AiProvider = "claude" | "openai" | "gemini" | "niner_router";

const SYSTEM_PROMPTS: Record<string, string> = {
  article:
    "Bạn là chuyên gia viết nội dung tin tức và du lịch tiếng Việt. Viết nội dung chất lượng cao, thân thiện SEO, tự nhiên và hữu ích cho độc giả. Độ dài khoảng 400-600 từ trừ khi được yêu cầu khác.",
  seo_meta:
    'Bạn là chuyên gia SEO. Khi được cho một chủ đề hoặc nội dung, hãy tạo: 1 SEO Title (dưới 60 ký tự) và 1 Meta Description (dưới 155 ký tự). Trả lời theo định dạng:\nSEO TITLE: ...\nMETA DESCRIPTION: ...',
  excerpt:
    "Bạn là chuyên gia tóm tắt nội dung. Viết excerpt ngắn gọn (2-3 câu, dưới 200 ký tự) cho bài viết, súc tích và hấp dẫn người đọc nhấp vào.",
  outline:
    "Bạn là chuyên gia lên kế hoạch nội dung. Tạo dàn bài chi tiết cho bài viết với H2, H3, gợi ý từ khóa cho từng phần. Định dạng rõ ràng, có thể dùng trực tiếp để viết bài.",
  social:
    "Bạn là chuyên gia marketing mạng xã hội Việt Nam. Viết caption hấp dẫn cho Facebook/Zalo (150-300 từ), có emoji phù hợp, kêu gọi hành động rõ ràng.",
  seo_analyze:
    'Bạn là chuyên gia SEO Việt Nam với 10 năm kinh nghiệm tối ưu nội dung website doanh nghiệp. Phân tích toàn diện nội dung được cung cấp và trả về JSON hợp lệ DUY NHẤT theo cấu trúc sau (không có text thêm, không markdown):\n{\n  "score": <số 0-100>,\n  "issues": [\n    {"severity":"error|warning|info","field":"title|seoTitle|seoDescription|content|excerpt|cta|keyword","message":"mô tả vấn đề cụ thể"}\n  ],\n  "suggestions": {\n    "seoTitle": "...",\n    "seoTitleNote": "giải thích ngắn tại sao chọn title này",\n    "seoDescription": "...",\n    "seoDescriptionNote": "giải thích ngắn",\n    "excerpt": "...",\n    "ctaSuggestion": "đề xuất CTA phù hợp với ngữ cảnh",\n    "contentTips": ["gợi ý 1","gợi ý 2","gợi ý 3"]\n  },\n  "keywordsRecommended": ["kw1","kw2","kw3","kw4","kw5"],\n  "keywordsPresent": ["từ khóa mục tiêu đã có trong nội dung"],\n  "keywordsMissing": ["từ khóa mục tiêu chưa xuất hiện trong nội dung"]\n}\nQuy tắc chấm điểm: seoTitle đủ 50-60 ký tự +15đ, seoDescription đủ 120-155 ký tự +15đ, nội dung >300 từ +15đ, có CTA +10đ, từ khóa mục tiêu trong title +15đ, excerpt có +10đ, nội dung có H2/H3 +10đ, liên kết nội bộ +10đ.\nIssues: liệt kê CỤ THỂ từng vấn đề tìm thấy (thiếu field, quá ngắn, không có từ khóa mục tiêu, thiếu CTA, nội dung mỏng...).\ncontentTips: 3-5 gợi ý thực tế để cải thiện nội dung (thêm đoạn về X, viết lại tiêu đề phụ Y, bổ sung số liệu...).',
  content_brief:
    'Bạn là chuyên gia SEO và content strategist cho website tin tức tiếng Việt. Khi được cho một từ khóa/chủ đề, hãy tạo Content Brief chi tiết và trả về JSON hợp lệ DUY NHẤT theo cấu trúc sau (không có text thêm, không markdown):\n{\n  "keyword": "từ khóa chính",\n  "intent": "mô tả search intent (informational/navigational/transactional/commercial)",\n  "targetAudience": "đối tượng độc giả mục tiêu",\n  "recommendedLength": "số từ đề xuất",\n  "outline": [\n    {"type": "h1", "text": "tiêu đề chính"},\n    {"type": "h2", "text": "tiêu đề phụ"},\n    {"type": "h3", "text": "tiêu đề con"}\n  ],\n  "faqs": [\n    {"question": "câu hỏi", "answer": "gợi ý trả lời ngắn"}\n  ],\n  "relatedKeywords": ["kw1","kw2","kw3","kw4","kw5"],\n  "lsiKeywords": ["lsi1","lsi2","lsi3"],\n  "contentTips": ["gợi ý 1","gợi ý 2","gợi ý 3"],\n  "internalLinkSuggestions": ["chủ đề nên link đến 1","chủ đề nên link đến 2"],\n  "competitorGaps": ["cơ hội nội dung đối thủ chưa khai thác 1","cơ hội 2"]\n}\nYêu cầu: outline phải có đủ H1 (1 cái), H2 (3-5 cái), H3 (1-2 cái mỗi H2 quan trọng). faqs tối thiểu 5 câu hỏi thực tế. relatedKeywords: 5-8 từ khóa liên quan. contentTips: lời khuyên cụ thể để bài viết outrank đối thủ.',
};

async function resolveApiKey(provider: AiProvider, envKey: string, envFallback?: string): Promise<{ apiKey: string; model?: string; baseUrl?: string }> {
  try {
    const cfg = await getAiProviderConfig(provider);
    if (cfg?.isActive && cfg.apiKey) {
      return { apiKey: cfg.apiKey, model: cfg.model ?? undefined, baseUrl: cfg.baseUrl ?? undefined };
    }
  } catch { /* DB not ready, fall through */ }
  const key = process.env[envKey] ?? envFallback ?? "";
  return { apiKey: key };
}

async function generateClaude(prompt: string, systemPrompt: string, type: string) {
  const { apiKey, model: cfgModel } = await resolveApiKey("claude", "ANTHROPIC_API_KEY");
  if (!apiKey || apiKey.startsWith("sk-ant-api03-...")) throw new Error("ANTHROPIC_API_KEY chưa được cấu hình");
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: cfgModel ?? "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const tokens = message.usage.input_tokens + message.usage.output_tokens;
  try {
    const { prisma } = await import("@/server/db");
    const tenant = await prisma.tenant.findFirst({ orderBy: { createdAt: "asc" } });
    if (tenant) await prisma.aiUsageLog.create({ data: { tenantId: tenant.id, feature: `claude_${type}`, tokens } });
  } catch { /* non-critical */ }
  return { text, tokens };
}

async function generateOpenAI(prompt: string, systemPrompt: string) {
  const { apiKey, model: cfgModel } = await resolveApiKey("openai", "OPENAI_API_KEY");
  if (!apiKey || apiKey.startsWith("sk-...")) throw new Error("OPENAI_API_KEY chưa được cấu hình");
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });
  const model = cfgModel ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const completion = await client.chat.completions.create({
    model,
    max_tokens: 2048,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  });
  const text = completion.choices[0]?.message?.content ?? "";
  const tokens = completion.usage ? completion.usage.prompt_tokens + completion.usage.completion_tokens : undefined;
  return { text, tokens };
}

async function generateGemini(prompt: string, systemPrompt: string) {
  const { apiKey, model: cfgModel } = await resolveApiKey("gemini", "GEMINI_API_KEY");
  if (!apiKey || apiKey === "YOUR_GEMINI_KEY") throw new Error("GEMINI_API_KEY chưa được cấu hình");
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = cfgModel ?? process.env.GEMINI_MODEL ?? "gemini-1.5-flash";
  const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt });
  const result = await model.generateContent(prompt);
  return { text: result.response.text() };
}

async function generateNinerRouter(prompt: string, systemPrompt: string) {
  const { apiKey, model: cfgModel, baseUrl: cfgBaseUrl } = await resolveApiKey("niner_router", "NINER_ROUTER_API_KEY");
  const baseUrl = cfgBaseUrl ?? process.env.NINER_ROUTER_BASE_URL ?? "https://api.9router.com/v1";
  const modelName = cfgModel ?? process.env.NINER_ROUTER_MODEL ?? "default";
  if (!apiKey || apiKey === "YOUR_9ROUTER_KEY") throw new Error("NINER_ROUTER_API_KEY chưa được cấu hình");

  const res = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`9Router API lỗi ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as Record<string, unknown>;
  const text =
    (data.result as string) ||
    (data.content as string) ||
    ((data.choices as Array<{ message?: { content?: string } }>)?.[0]?.message?.content) ||
    (data.text as string) ||
    "";
  if (!text) throw new Error("9Router trả về kết quả không đúng format");
  return { text };
}

async function runGenerate(provider: AiProvider, prompt: string, systemPrompt: string, type: string): Promise<{ text: string; tokens?: number }> {
  switch (provider) {
    case "openai":       return generateOpenAI(prompt, systemPrompt);
    case "gemini":       return generateGemini(prompt, systemPrompt);
    case "niner_router": return generateNinerRouter(prompt, systemPrompt);
    default:             return generateClaude(prompt, systemPrompt, type);
  }
}

async function resolveProvider(requested: string): Promise<AiProvider> {
  if (requested && requested !== "auto") return requested as AiProvider;
  try {
    const def = await getDefaultAiProvider();
    if (def) return def.provider as AiProvider;
  } catch { /* fall through */ }
  return "claude";
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.prompt) return NextResponse.json({ error: "Thiếu nội dung yêu cầu" }, { status: 400 });

  const { prompt, type = "article", provider: requestedProvider = "auto" } = body as {
    prompt: string; type?: string; provider?: string;
  };
  const systemPrompt = SYSTEM_PROMPTS[type] ?? SYSTEM_PROMPTS.article;
  const provider = await resolveProvider(requestedProvider);

  try {
    const result = await runGenerate(provider, prompt, systemPrompt, type);
    return NextResponse.json({ text: result.text, provider, tokens: result.tokens });
  } catch (primaryError) {
    // Try fallback provider if primary fails
    try {
      const fallback = await getFallbackAiProvider();
      if (fallback && fallback.provider !== provider) {
        const result = await runGenerate(fallback.provider as AiProvider, prompt, systemPrompt, type);
        return NextResponse.json({ text: result.text, provider: fallback.provider, fallback: true, tokens: result.tokens });
      }
    } catch { /* fallback also failed */ }
    const msg = primaryError instanceof Error ? primaryError.message : "Lỗi kết nối AI";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
