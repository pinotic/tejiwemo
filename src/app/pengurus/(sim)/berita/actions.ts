"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, news } from "@/db";
import { requireAccess } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const schema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(200),
  excerpt: z.string().trim().max(300).default(""),
  body: z.string().trim().min(10, "Isi berita minimal 10 karakter").max(20000),
  eventDate: z.string().optional(),
  published: z.boolean(),
});

function parse(form: FormData) {
  return schema.safeParse({
    title: form.get("title"),
    excerpt: form.get("excerpt") ?? "",
    body: form.get("body"),
    eventDate: String(form.get("eventDate") ?? "") || undefined,
    published: form.get("published") === "on",
  });
}

export async function saveNews(id: number | null, _: { error?: string } | undefined, form: FormData) {
  const user = await requireAccess("berita", "write");
  const p = parse(form);
  if (!p.success) return { error: p.error.issues[0].message };
  const d = p.data;

  if (id) {
    await db.update(news).set({ title: d.title, excerpt: d.excerpt, body: d.body, eventDate: d.eventDate ?? null, published: d.published }).where(eq(news.id, id));
  } else {
    await db.insert(news).values({ slug: slugify(d.title), title: d.title, excerpt: d.excerpt, body: d.body, eventDate: d.eventDate ?? null, published: d.published, authorId: user.id });
  }
  revalidatePath("/berita");
  revalidatePath("/");
  redirect("/pengurus/berita");
}

export async function deleteNews(id: number) {
  await requireAccess("berita", "write");
  await db.delete(news).where(eq(news.id, id));
  revalidatePath("/berita");
  revalidatePath("/");
  redirect("/pengurus/berita");
}
