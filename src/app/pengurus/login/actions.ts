"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, users } from "@/db";
import { COOKIE, cookieOptions, signSession } from "@/lib/session";

// Pembatas percobaan login sederhana (per instance server). Untuk perlindungan
// yang lebih kuat di skala besar, tambahkan rate limit di level Vercel/WAF.
const attempts = new Map<string, { n: number; until: number }>();
const MAX = 5;
const LOCK_MS = 10 * 60 * 1000;

export async function login(_: { error?: string } | undefined, form: FormData) {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!username || !password) return { error: "Isi username dan kata sandi." };

  const rec = attempts.get(username);
  if (rec && rec.until > Date.now() && rec.n >= MAX) {
    return { error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." };
  }

  const [u] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  // bandingkan hash walau user tidak ada, supaya waktu respons tidak membocorkan keberadaan akun
  const hash = u?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const ok = await bcrypt.compare(password, hash);

  if (!u || !u.active || !ok) {
    const n = (rec && rec.until > Date.now() ? rec.n : 0) + 1;
    attempts.set(username, { n, until: Date.now() + LOCK_MS });
    return { error: "Username atau kata sandi salah." };
  }

  attempts.delete(username);
  const token = await signSession({ uid: u.id, role: u.role });
  cookies().set(COOKIE, token, cookieOptions);
  redirect("/pengurus");
}

export async function logout() {
  cookies().delete(COOKIE);
  redirect("/pengurus/login");
}
