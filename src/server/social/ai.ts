import { z } from "zod";
import { aiGenerate } from "@/server/ai/generate";

const strategySchema = z.object({
  positioning: z.string().min(20).max(800),
  promise: z.string().min(10).max(300),
  description: z.string().min(20).max(800),
  audience: z.object({
    summary: z.string().min(20).max(800),
    pains: z.array(z.string().min(2).max(200)).min(2).max(8),
    desires: z.array(z.string().min(2).max(200)).min(2).max(8),
  }),
  brandVoice: z.object({
    summary: z.string().min(10).max(400),
    do: z.array(z.string().min(2).max(180)).min(2).max(8),
    avoid: z.array(z.string().min(2).max(180)).min(2).max(8),
  }),
  pillars: z.array(z.object({
    key: z.string().min(2).max(40),
    label: z.string().min(2).max(100),
    ratio: z.number().int().min(5).max(60),
    description: z.string().min(10).max(300),
  })).min(4).max(6),
  contentRules: z.array(z.string().min(3).max(240)).min(3).max(10),
  visualDirection: z.string().min(10).max(600),
  usernameSuggestions: z.array(z.string().min(2).max(80)).min(2).max(6),
});

const planItemSchema = z.object({
  day: z.number().int().min(1).max(30),
  pillar: z.string().min(2).max(80),
  format: z.enum(["POST", "CAROUSEL", "REEL", "STORY"]),
  topic: z.string().min(5).max(240),
  title: z.string().min(5).max(240),
  hook: z.string().min(5).max(500),
  caption: z.string().min(40).max(3000),
  callToAction: z.string().min(3).max(400),
  hashtags: z.array(z.string().min(2).max(80)).max(12),
  mediaBrief: z.object({
    concept: z.string().min(10).max(800),
    visualStyle: z.string().min(5).max(400),
    onImageText: z.string().max(180),
    aspectRatio: z.enum(["1:1", "4:5", "9:16", "16:9"]),
  }),
});

const planSchema = z.object({
  strategy: z.object({
    summary: z.string().min(20).max(1000),
    campaignThemes: z.array(z.string().min(3).max(160)).min(3).max(10),
    postingCadence: z.string().min(10).max(400),
  }),
  items: z.array(planItemSchema).length(30),
});

export type GeneratedSocialStrategy = z.infer<typeof strategySchema>;
export type GeneratedSocialPlan = z.infer<typeof planSchema>;

function parseJsonObject(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("AI không trả về JSON hợp lệ");
  return JSON.parse(cleaned.slice(start, end + 1));
}

const STRATEGY_SYSTEM = `Bạn là chiến lược gia Facebook Page cấp cao. Hãy xây chiến lược thực tế, khác biệt và có thể triển khai ngay.
Chỉ trả về một JSON object thuần, không markdown, đúng cấu trúc được yêu cầu. Tỷ lệ các content pillar phải cộng lại đúng 100.`;

export async function generateSocialStrategy(input: {
  pageName: string;
  category: string;
  objective: string;
  audience: unknown;
  brandVoice: unknown;
  locale: string;
}): Promise<{ strategy: GeneratedSocialStrategy; provider: string }> {
  const prompt = `Tạo chiến lược Facebook Page với dữ liệu sau:
${JSON.stringify(input, null, 2)}

JSON bắt buộc:
{
  "positioning": "định vị Page",
  "promise": "lời hứa giá trị",
  "description": "mô tả Page",
  "audience": { "summary": "...", "pains": ["..."], "desires": ["..."] },
  "brandVoice": { "summary": "...", "do": ["..."], "avoid": ["..."] },
  "pillars": [{ "key": "education", "label": "...", "ratio": 30, "description": "..." }],
  "contentRules": ["..."],
  "visualDirection": "...",
  "usernameSuggestions": ["..."]
}`;
  const { text, provider } = await aiGenerate(STRATEGY_SYSTEM, prompt, { maxTokens: 5000, temperature: 0.65 });
  const strategy = strategySchema.parse(parseJsonObject(text));
  const ratio = strategy.pillars.reduce((sum, pillar) => sum + pillar.ratio, 0);
  if (ratio !== 100) throw new Error(`Tổng tỷ lệ content pillar do AI tạo là ${ratio}%, cần đúng 100%`);
  return { strategy, provider };
}

const PLAN_SYSTEM = `Bạn là Social Media Manager chuyên xây Facebook Page dài hạn. Hãy tạo đúng 30 bài khác nhau, hữu ích, tự nhiên và phù hợp thương hiệu.
Mỗi caption phải hoàn chỉnh, sẵn sàng để biên tập; không bịa số liệu, đánh giá khách hàng hoặc cam kết không được cung cấp. Không lặp hook, chủ đề hoặc CTA.
Chỉ trả về một JSON object thuần, không markdown, đúng cấu trúc được yêu cầu.`;

export async function generateSocialPlan(input: {
  pageName: string;
  category: string;
  objective: string;
  targetAudience: unknown;
  brandVoice: unknown;
  contentPillars: unknown;
  launchKit: unknown;
  campaignObjective: string;
  language: string;
}): Promise<{ plan: GeneratedSocialPlan; provider: string }> {
  const prompt = `Tạo kế hoạch Facebook 30 ngày theo dữ liệu:
${JSON.stringify(input, null, 2)}

Yêu cầu:
- day phải đủ từ 1 đến 30, không trùng và theo đúng thứ tự.
- caption khoảng 80–180 từ, đúng ngôn ngữ ${input.language}.
- hashtag không có khoảng trắng và bắt đầu bằng #.
- phân bổ pillar bám sát tỷ lệ chiến lược.
- REEL/STORY cần brief dọc 9:16; POST/CAROUSEL ưu tiên 4:5 hoặc 1:1.

JSON bắt buộc:
{
  "strategy": {
    "summary": "chiến lược chiến dịch",
    "campaignThemes": ["..."],
    "postingCadence": "..."
  },
  "items": [{
    "day": 1,
    "pillar": "education",
    "format": "POST",
    "topic": "...",
    "title": "...",
    "hook": "...",
    "caption": "...",
    "callToAction": "...",
    "hashtags": ["#..."],
    "mediaBrief": {
      "concept": "...",
      "visualStyle": "...",
      "onImageText": "...",
      "aspectRatio": "4:5"
    }
  }]
}`;
  const { text, provider } = await aiGenerate(PLAN_SYSTEM, prompt, { maxTokens: 16000, temperature: 0.72 });
  const plan = planSchema.parse(parseJsonObject(text));
  const days = new Set(plan.items.map((item) => item.day));
  if (days.size !== 30) throw new Error("AI trả về ngày bị trùng trong kế hoạch 30 ngày");
  return { plan, provider };
}
