import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, news } from "@/db";
import { tgl } from "@/lib/utils";

export const metadata = { title: "Berita & Kegiatan" };
export const dynamic = "force-dynamic";

export default async function BeritaPage() {
  const rows = await db.select().from(news).where(eq(news.published, true)).orderBy(desc(news.createdAt)).limit(50);
  return (
    <div>
      <h1 className="text-2xl font-semibold">Berita & Kegiatan Warga</h1>
      <div className="mt-6 space-y-4">
        {rows.length === 0 && <p className="card text-sm text-stone-500">Belum ada berita.</p>}
        {rows.map((n) => (
          <Link key={n.id} href={`/berita/${n.slug}`} className="card block transition hover:border-brand-200 hover:shadow">
            <p className="text-xs text-stone-500">{tgl(n.eventDate ?? n.createdAt)}</p>
            <h2 className="mt-1 text-lg font-semibold">{n.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-stone-600">{n.excerpt || n.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
