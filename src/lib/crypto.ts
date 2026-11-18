import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Enkripsi AES-256-GCM untuk NIK & No. KK. Format tersimpan: iv.tag.data (base64url)
function key(): Buffer {
  const hex = process.env.DATA_KEY ?? "";
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("DATA_KEY harus 64 karakter hex (openssl rand -hex 32)");
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  const tag = c.getAuthTag();
  return [iv, tag, data].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(stored: string): string {
  const [iv, tag, data] = stored.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}

export function mask(value: string): string {
  if (value.length <= 6) return "•".repeat(value.length);
  return value.slice(0, 4) + "•".repeat(value.length - 8) + value.slice(-4);
}
