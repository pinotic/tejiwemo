import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { COOKIE, verifySession } from "./session";
import { READ_ACCESS, WRITE_ACCESS, type Module } from "./refs";

export type CurrentUser = {
  id: number;
  username: string;
  name: string;
  jabatan: string;
  role: string;
};

// Selalu cek ulang ke database: akun yang dinonaktifkan langsung kehilangan akses.
export async function getUser(): Promise<CurrentUser | null> {
  const s = await verifySession(cookies().get(COOKIE)?.value);
  if (!s) return null;
  const [u] = await db.select().from(users).where(eq(users.id, s.uid)).limit(1);
  if (!u || !u.active) return null;
  return { id: u.id, username: u.username, name: u.name, jabatan: u.jabatan, role: u.role };
}

export async function requireUser(): Promise<CurrentUser> {
  const u = await getUser();
  if (!u) redirect("/pengurus/login");
  return u;
}

export async function requireAccess(mod: Module, mode: "read" | "write" = "read") {
  const u = await requireUser();
  const allowed = (mode === "write" ? WRITE_ACCESS : READ_ACCESS)[mod];
  if (!allowed.includes(u.role)) redirect("/pengurus?akses=ditolak");
  return u;
}

export const canWrite = (role: string, mod: Module) => WRITE_ACCESS[mod].includes(role);
export const canRead = (role: string, mod: Module) => READ_ACCESS[mod].includes(role);
