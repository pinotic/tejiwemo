import Link from "next/link";
import { asc, ilike, and, eq, type SQL } from "drizzle-orm";
import { db, residents } from "@/db";
import { requireAccess } from "@/lib/auth";
import { decrypt, mask } from "@/lib/crypto";
import { RESIDENT_STATUS, residentStatusLabel } from "@/lib/refs";

export const metadata = { title: "Data Penduduk" };
export const dynamic = "force-dynamic";

export default async function PendudukPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  await requireAccess("penduduk");
  const conds: SQL[] = [];
  const q = (searchParams.q ?? "").trim();
  if (q) conds.push(ilike(residents.name, `%${q.replace(/[%_]/g, "")}%`));
  if (RESIDENT_STATUS.some((s) => s.key === searchParams.status)) conds.push(eq(residents.status, searchParams.status!));

  const rows = await db.select().from(residents).where(conds.length ? and(...conds) : undefined).orderBy(asc(residents.name)).limit(500);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Data Penduduk</h1>
        <Link href="/pengurus/penduduk/baru" className="btn">+ Tambah penduduk</Link>
      </div>
      <p className="mt-1 text-sm text-stone-600">NIK dan No. KK disimpan terenkripsi dan ditampilkan tersamar. Buka rincian untuk melihat lengkap.</p>

      <form className="mt-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Cari nama…" className="input max-w-xs" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="input w-auto">
          <option value="">Semua status</option>
          {RESIDENT_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button className="btn-outline">Cari</button>
      </form>

      <div className="card mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr><th className="th">Nama</th><th className="th">No. KK</th><th className="th">NIK</th><th className="th">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 && <tr><td colSpan={4} className="td text-center text-stone-500">Tidak ada data.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-stone-50">
                <td className="td"><Link href={`/pengurus/penduduk/${r.id}`} className="font-medium text-brand-700 hover:underline">{r.name}</Link></td>
                <td className="td font-mono text-xs">{mask(decrypt(r.kkEnc))}</td>
                <td className="td font-mono text-xs">{mask(decrypt(r.nikEnc))}</td>
                <td className="td">{residentStatusLabel(r.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-stone-500">{rows.length} data ditampilkan.</p>
    </div>
  );
}
