import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const stateSchema = z.object({
  nonce: z.string().min(20),
  userId: z.string().min(1),
  socialPageId: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

export type MetaOauthState = z.infer<typeof stateSchema>;

function signingSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET chưa được cấu hình");
  return secret;
}

export function sealMetaOauthState(state: MetaOauthState) {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  const signature = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function openMetaOauthState(value: string | undefined): MetaOauthState | null {
  if (!value) return null;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return null;
  const payload = value.slice(0, separator);
  const supplied = Buffer.from(value.slice(separator + 1), "base64url");
  const expected = createHmac("sha256", signingSecret()).update(payload).digest();
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const parsed = stateSchema.safeParse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
    if (!parsed.success || parsed.data.expiresAt < Date.now()) return null;
    return parsed.data;
  } catch {
    return null;
  }
}
