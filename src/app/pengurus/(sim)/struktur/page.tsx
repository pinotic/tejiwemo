import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, officers } from "@/db";
import { requireAccess, canWrite } from "@/lib/auth";
import { OFFICER_GROUP } from "@/lib/refs";

export const metadata = { title: "Susunan Pengurus RT" };
export const dynamic = "force-dynamic";

export default async function StrukturAdmin() {
  const user = await requireAccess("pengurus");
  const rows = await db.select().from(officers).orderBy(asc(officers.sortOrder), asc(officers.id));
  const w = canWrite(user.role, "pengurus");

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Susunan Pengurus RT</h1>
        {w && <Link href="/pengurus/struktur/baru" className="btn">+ Tambah</Link>}
      </div>
      <p className="mt-1 text-sm text-stone-600">Daftar ini tampil di halaman <span className="font-medium">Pengurus RT</span> pada situs warga. Terpisah dari akun login SIM.</p>

      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr><th className="th">Nama</th><th className="th">Jabatan</th><th className="th">Kelompok</th><th className="th">Urutan</th><th className="th">Tampil</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 && <tr><td colSpan={6} className="td text-center text-stone-500">Belum ada data pengurus.</td></tr>}
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="td font-medium">{o.name}</td>
                <td className="td">{o.jabatan}</td>
                <td className="td">{OFFICER_GROUP.find((g) => g.key === o.grup)?.label ?? o.grup}</td>
                <td className="td tabular-nums">{o.sortOrder}</td>
                <td className="td">{o.visible ? "Ya" : <span className="text-stone-400">Tidak</span>}</td>
                <td className="td text-right">{w && <Link href={`/pengurus/struktur/${o.id}`} className="btn-outline px-3 py-1.5 text-xs">Ubah</Link>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
