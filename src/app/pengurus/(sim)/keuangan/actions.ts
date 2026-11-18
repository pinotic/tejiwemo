"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, transactions, bidang, reportNotes } from "@/db";
import { requireAccess } from "@/lib/auth";
import { currentMonth } from "@/lib/finance";

const schema = z.object({
  lini: z.string().min(1).max(60),
  type: z.enum(["masuk", "keluar"]),
  amount: z.coerce.number().int("Nominal harus bilangan bulat").positive("Nominal harus lebih dari 0").max(10_000_000_000),
  description: z.string().trim().min(3, "Keterangan minimal 3 karakter").max(300),
  txDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
});

export async function addTransaction(_: { error?: string; ok?: boolean } | undefined, form: FormData) {
  const user = await requireAccess("keuangan", "write");
  const p = schema.safeParse({
    lini: form.get("lini"),
    type: form.get("type"),
    amount: String(form.get("amount") ?? "").replace(/[.\s]/g, ""),
    description: form.get("description"),
    txDate: form.get("txDate"),
  });
  if (!p.success) return { error: p.error.issues[0].message };

  const [b] = await db.select({ id: bidang.id }).from(bidang).where(and(eq(bidang.key, p.data.lini), eq(bidang.active, true))).limit(1);
  if (!b) return { error: "Bidang tidak ditemukan atau sudah dinonaktifkan." };

  await db.insert(transactions).values({ ...p.data, createdBy: user.id });
  revalidatePath("/pengurus/keuangan");
  revalidatePath("/keuangan", "layout");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteTransaction(id: number) {
  await requireAccess("keuangan", "write");
  await db.delete(transactions).where(eq(transactions.id, id));
  revalidatePath("/pengurus/keuangan");
  revalidatePath("/keuangan", "layout");
  revalidatePath("/");
}

// Keterangan laporan bulanan yang tampil di situs warga. Kosong = hapus.
export async function saveNote(_: { error?: string; ok?: boolean } | undefined, form: FormData) {
  const user = await requireAccess("keuangan", "write");
  const lini = String(form.get("lini") ?? "");
  const month = String(form.get("month") ?? "");
  const note = String(form.get("note") ?? "").trim();
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month > currentMonth()) return { error: "Bulan tidak valid." };
  if (note.length > 2000) return { error: "Keterangan maksimal 2000 karakter." };
  const [b] = await db.select({ id: bidang.id }).from(bidang).where(eq(bidang.key, lini)).limit(1);
  if (!b) return { error: "Bidang tidak ditemukan." };

  if (!note) {
    await db.delete(reportNotes).where(and(eq(reportNotes.lini, lini), eq(reportNotes.month, month)));
  } else {
    await db
      .insert(reportNotes)
      .values({ lini, month, note, updatedBy: user.id })
      .onConflictDoUpdate({ target: [reportNotes.lini, reportNotes.month], set: { note, updatedBy: user.id, updatedAt: new Date() } });
  }
  revalidatePath("/pengurus/keuangan");
  revalidatePath("/keuangan", "layout");
  return { ok: true };
}
