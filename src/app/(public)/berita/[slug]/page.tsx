import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, news } from "@/db";
import { tgl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BeritaDetail({ params }: { params: { slug: string } }) {
  const [n] = await db
    .select()
    .from(news)
    .where(and(eq(news.slug, params.slug), eq(news.published, true)))
    .limit(1);
  if (!n) notFound();

  return (
    <article className="mx-auto max-w-2xl">
      <Link href="/berita" className="text-sm text-stone-500 hover:text-brand-700">← Semua berita</Link>
      <p className="mt-4 text-sm text-stone-500">{tgl(n.eventDate ?? n.createdAt)}</p>
      <h1 className="mt-1 text-3xl font-semibold leading-tight">{n.title}</h1>
      {/* Isi berita ditampilkan sebagai teks biasa (bukan HTML) agar aman dari XSS */}
      <div className="mt-6 whitespace-pre-line leading-relaxed text-stone-700">{n.body}</div>
    </article>
  );
}
