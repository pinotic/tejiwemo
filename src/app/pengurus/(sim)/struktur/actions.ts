"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, officers } from "@/db";
import { requireAccess } from "@/lib/auth";
import { OFFICER_GROUP } from "@/lib/refs";

const schema = z.object({
  name: z.string().trim().min(2, "Nama wajib diisi").max(100),
  jabatan: z.string().trim().min(2, "Jabatan wajib diisi").max(100),
  grup: z.enum(OFFICER_GROUP.map((g) => g.key) as [string, ...string[]]),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  visible: z.boolean(),
});

function done() {
  revalidatePath("/struktur");
  revalidatePath("/");
  redirect("/pengurus/struktur");
}

export async function saveOfficer(id: number | null, _: { error?: string } | undefined, form: FormData) {
  await requireAccess("pengurus", "write");
  const p = schema.safeParse({
    name: form.get("name"),
    jabatan: form.get("jabatan"),
    grup: form.get("grup"),
    sortOrder: form.get("sortOrder") || 0,
    visible: form.get("visible") === "on",
  });
  if (!p.success) return { error: p.error.issues[0].message };

  if (id) await db.update(officers).set(p.data).where(eq(officers.id, id));
  else await db.insert(officers).values(p.data);
  done();
}

export async function deleteOfficer(id: number) {
  await requireAccess("pengurus", "write");
  await db.delete(officers).where(eq(officers.id, id));
  done();
}
