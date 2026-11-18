"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, residents } from "@/db";
import { requireAccess } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { RESIDENT_STATUS } from "@/lib/refs";

const schema = z.object({
  name: z.string().trim().min(2, "Nama wajib diisi").max(120),
  kk: z.string().trim().regex(/^\d{16}$/, "No. KK harus 16 digit angka"),
  nik: z.string().trim().regex(/^\d{16}$/, "NIK harus 16 digit angka"),
  status: z.enum(RESIDENT_STATUS.map((s) => s.key) as [string, ...string[]]),
  address: z.string().trim().max(200).default(""),
  phone: z.string().trim().max(30).default(""),
  notes: z.string().trim().max(500).default(""),
});

export async function saveResident(id: number | null, _: { error?: string } | undefined, form: FormData) {
  await requireAccess("penduduk", "write");
  const p = schema.safeParse({
    name: form.get("name"),
    kk: String(form.get("kk") ?? "").replace(/\s/g, ""),
    nik: String(form.get("nik") ?? "").replace(/\s/g, ""),
    status: form.get("status"),
    address: form.get("address") ?? "",
    phone: form.get("phone") ?? "",
    notes: form.get("notes") ?? "",
  });
  if (!p.success) return { error: p.error.issues[0].message };
  const { kk, nik, ...rest } = p.data;
  const values = { ...rest, kkEnc: encrypt(kk), nikEnc: encrypt(nik) };

  if (id) await db.update(residents).set(values).where(eq(residents.id, id));
  else await db.insert(residents).values(values);

  revalidatePath("/pengurus/penduduk");
  redirect("/pengurus/penduduk");
}

export async function deleteResident(id: number) {
  await requireAccess("penduduk", "write");
  await db.delete(residents).where(eq(residents.id, id));
  revalidatePath("/pengurus/penduduk");
  redirect("/pengurus/penduduk");
}
