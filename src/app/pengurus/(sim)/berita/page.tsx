import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, news } from "@/db";
import { requireAccess, canWrite } from "@/lib/auth";
import { tgl } from "@/lib/utils";

export const metadata = { title: "Kelola Berita" };
export const dynamic = "force-dynamic";

export default async function BeritaAdmin() {
  const user = await requireAccess("berita");
  const rows = await db.select().from(news).orderBy(desc(news.createdAt));
  const w = canWrite(user.role, "berita");
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Berita & Kegiatan</h1>
        {w && <Link href="/pengurus/berita/baru" className="btn">+ Berita baru</Link>}
      </div>
      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[520px]">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr><th className="th">Judul</th><th className="th">Tanggal</th><th className="th">Status</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 && <tr><td colSpan={4} className="td text-center text-stone-500">Belum ada berita.</td></tr>}
            {rows.map((n) => (
              <tr key={n.id}>
                <td className="td font-medium">{n.title}</td>
                <td className="td whitespace-nowrap">{tgl(n.createdAt)}</td>
                <td className="td">{n.published ? <span className="text-brand-700">Tayang</span> : <span className="text-stone-500">Draf</span>}</td>
                <td className="td text-right">{w && <Link href={`/pengurus/berita/${n.id}`} className="text-brand-700 hover:underline">Ubah</Link>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
