// Util sesi yang aman dipakai di middleware (edge) maupun server.
import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "rt_session";
const MAX_AGE = 60 * 60 * 8; // 8 jam

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET belum diatur (min. 16 karakter)");
  return new TextEncoder().encode(s);
}

export type SessionPayload = { uid: number; role: string };

export async function signSession(p: SessionPayload) {
  return new SignJWT({ ...p })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: Number(payload.uid), role: String(payload.role) };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};
