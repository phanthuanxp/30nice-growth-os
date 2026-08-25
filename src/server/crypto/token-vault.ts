import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "v1";

function encryptionKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY chưa được cấu hình hoặc ngắn hơn 32 ký tự");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

export function tokenVaultConfigured() {
  return Boolean(process.env.TOKEN_ENCRYPTION_KEY && process.env.TOKEN_ENCRYPTION_KEY.length >= 32);
}

export function encryptToken(plainText: string) {
  if (!plainText) throw new Error("Không thể mã hóa token rỗng");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptToken(sealed: string) {
  const [version, ivValue, tagValue, encryptedValue] = sealed.split(".");
  if (version !== PREFIX || !ivValue || !tagValue || !encryptedValue) throw new Error("Token mã hóa không đúng định dạng");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
}
