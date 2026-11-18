"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import { z } from "zod";
import { db, archives } from "@/db";
import { requireAccess } from "@/lib/auth";
import { ARCHIVE_CATEGORY } from "@/lib/refs";

const MAX_BYTES = 4 * 1024 * 1024; // batas body Vercel Functions ~4,5 MB
const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const schema = z.object({
  category: z.enum(ARCHIVE_CATEGORY.map((c) => c.key) as [string, ...string[]]),
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(200),
  number: z.string().trim().max(100).default(""),
  docDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid"),
  party: z.string().trim().max(200).default(""),
  description: z.string().trim().max(1000).default(""),
});

export async function addArchive(_: { error?: string } | undefined, form: FormData) {
  const user = await requireAccess("arsip", "write");
  const p = schema.safeParse({
    category: form.get("category"),
    title: form.get("title"),
    number: form.get("number") ?? "",
    docDate: form.get("docDate"),
    party: form.get("party") ?? "",
    description: form.get("description") ?? "",
  });
  if (!p.success) return { error: p.error.issues[0].message };

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih file yang akan diarsipkan." };
  if (file.size > MAX_BYTES) return { error: "Ukuran file maksimal 4 MB." };
  if (!ALLOWED.has(file.type)) return { error: "Format file harus PDF, foto (JPG/PNG/WebP), Word, atau Excel." };

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
  const blob = await put(`arsip/${p.data.category}/${safeName}`, file, {
    access: "public",
    addRandomSuffix: true, // URL tidak dapat ditebak; unduhan tetap lewat rute terautentikasi
  });

  await db.insert(archives).values({
    ...p.data,
    fileUrl: blob.url,
    fileName: file.name.slice(0, 200),
    fileType: file.type,
    fileSize: file.size,
    uploadedBy: user.id,
  });
  revalidatePath("/pengurus/arsip");
  redirect("/pengurus/arsip");
}

export async function deleteArchive(id: number) {
  await requireAccess("arsip", "write");
  const [a] = await db.select().from(archives).where(eq(archives.id, id)).limit(1);
  if (a) {
    try { await del(a.fileUrl); } catch { /* file mungkin sudah tidak ada */ }
    await db.delete(archives).where(eq(archives.id, id));
  }
  revalidatePath("/pengurus/arsip");
}
