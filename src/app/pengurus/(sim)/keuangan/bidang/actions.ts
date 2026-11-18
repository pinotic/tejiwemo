"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, bidang } from "@/db";
import { requireAccess } from "@/lib/auth";
import { getBidang } from "@/lib/finance";

const labelSchema = z.string().trim().min(2, "Nama bidang minimal 2 karakter").max(60, "Nama bidang maksimal 60 karakter");

function refresh() {
  revalidatePath("/pengurus/keuangan", "layout");
  revalidatePath("/keuangan", "layout");
  revalidatePath("/");
}

const toKey = (label: string) =>
  label.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "bidang";

export async function addBidang(_: { error?: string; ok?: boolean } | undefined, form: FormData) {
  await requireAccess("keuangan", "write");
  const p = labelSchema.safeParse(form.get("label"));
  if (!p.success) return { error: p.error.issues[0].message };

  const all = await getBidang({ all: true }); // juga memastikan bidang bawaan sudah terisi
  if (all.some((b) => b.label.toLowerCase() === p.data.toLowerCase())) return { error: "Nama bidang sudah ada." };

  let key = toKey(p.data);
  for (let n = 2; all.some((b) => b.key === key); n++) key = `${toKey(p.data)}_${n}`;
  const order = Math.max(0, ...all.map((b) => b.sortOrder)) + 10;

  await db.insert(bidang).values({ key, label: p.data, sortOrder: order });
  refresh();
  return { ok: true };
}

const updateSchema = z.object({
  label: labelSchema,
  sortOrder: z.coerce.number().int().min(0).max(9999),
  active: z.boolean(),
});

export async function updateBidang(id: number, form: FormData) {
  await requireAccess("keuangan", "write");
  const p = updateSchema.safeParse({
    label: form.get("label"),
    sortOrder: form.get("sortOrder") || 0,
    active: form.get("active") === "on",
  });
  if (!p.success) return;
  const dupe = await db.select({ id: bidang.id }).from(bidang).where(sql`lower(${bidang.label}) = lower(${p.data.label}) and ${bidang.id} <> ${id}`).limit(1);
  if (dupe.length) return;
  await db.update(bidang).set(p.data).where(eq(bidang.id, id));
  refresh();
}
