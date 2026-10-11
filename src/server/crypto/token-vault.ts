import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getMetaRuntimeSettings } from "@/server/meta/settings-store";

const PREFIX = "v1";

function encryptionKey() {
  const secret = getMetaRuntimeSettings().tokenEncryptionKey;
  if (!secret || secret.length < 32) {
    throw new Error("Token Encryption Key chưa được cấu hình hoặc ngắn hơn 32 ký tự");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

export function tokenVaultConfigured() {
  const secret = getMetaRuntimeSettings().tokenEncryptionKey;
  return Boolean(secret && secret.length >= 32);
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
