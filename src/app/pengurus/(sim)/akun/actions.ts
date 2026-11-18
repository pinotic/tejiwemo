"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, users } from "@/db";
import { requireAccess } from "@/lib/auth";
import { ROLES } from "@/lib/refs";

const roleEnum = z.enum(ROLES.map((r) => r.key) as [string, ...string[]]);

const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,30}$/, "Username 3-30 karakter: huruf kecil, angka, titik, strip");

const createSchema = z.object({
  name: z.string().trim().min(2, "Nama wajib diisi").max(100),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,30}$/, "Username 3-30 karakter: huruf kecil, angka, titik, strip"),
  jabatan: z.string().trim().max(80).default(""),
  role: roleEnum,
  password: z.string().min(10, "Kata sandi minimal 10 karakter").max(100),
});

export async function createUser(_: { error?: string; ok?: boolean } | undefined, form: FormData) {
  await requireAccess("akun", "write");
  const p = createSchema.safeParse({
    name: form.get("name"),
    username: form.get("username"),
    jabatan: form.get("jabatan") ?? "",
    role: form.get("role"),
    password: form.get("password"),
  });
  if (!p.success) return { error: p.error.issues[0].message };
  const { password, ...rest } = p.data;

  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.username, rest.username)).limit(1);
  if (exists) return { error: "Username sudah dipakai." };

  await db.insert(users).values({ ...rest, passwordHash: await bcrypt.hash(password, 12) });
  revalidatePath("/pengurus/akun");
  return { ok: true };
}

export async function toggleActive(id: number) {
  const me = await requireAccess("akun", "write");
  if (me.id === id) return; // tidak boleh menonaktifkan diri sendiri
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u) return;
  await db.update(users).set({ active: !u.active }).where(eq(users.id, id));
  revalidatePath("/pengurus/akun");
}

export async function resetPassword(id: number, form: FormData) {
  await requireAccess("akun", "write");
  const pw = String(form.get("password") ?? "");
  if (pw.length < 10 || pw.length > 100) return;
  await db.update(users).set({ passwordHash: await bcrypt.hash(pw, 12) }).where(eq(users.id, id));
  revalidatePath("/pengurus/akun");
}

const updateSchema = z.object({
  name: z.string().trim().min(2, "Nama wajib diisi").max(100),
  username: usernameSchema,
  jabatan: z.string().trim().max(80).default(""),
  role: roleEnum,
  password: z.string().max(100).default(""),
});

// Superadmin mengubah nama, username, jabatan, peran, dan (opsional) kata sandi akun.
export async function updateUser(id: number, _: { error?: string } | undefined, form: FormData) {
  const me = await requireAccess("akun", "write");
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return { error: "Akun tidak ditemukan." };

  const isSelf = me.id === id;
  const p = updateSchema.safeParse({
    name: form.get("name"),
    username: form.get("username"),
    jabatan: form.get("jabatan") ?? "",
    // Peran sendiri tidak boleh diubah (mencegah sistem tanpa superadmin).
    role: isSelf ? target.role : form.get("role"),
    password: form.get("password") ?? "",
  });
  if (!p.success) return { error: p.error.issues[0].message };
  const { password, ...d } = p.data;
  if (password && password.length < 10) return { error: "Kata sandi baru minimal 10 karakter." };

  const [dupe] = await db.select({ id: users.id }).from(users).where(and(eq(users.username, d.username), ne(users.id, id))).limit(1);
  if (dupe) return { error: "Username sudah dipakai akun lain." };

  await db
    .update(users)
    .set({ ...d, ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) })
    .where(eq(users.id, id));
  revalidatePath("/pengurus/akun");
  redirect("/pengurus/akun");
}
