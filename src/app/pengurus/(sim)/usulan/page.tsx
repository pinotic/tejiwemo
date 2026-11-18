import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, proposals } from "@/db";
import { requireAccess } from "@/lib/auth";
import { categoryLabel, statusLabel } from "@/lib/refs";
import { tgl } from "@/lib/utils";

export const metadata = { title: "Usulan Warga" };
export const dynamic = "force-dynamic";

export default async function UsulanAdmin() {
  await requireAccess("usulan");
  const rows = await db.select().from(proposals).orderBy(desc(proposals.createdAt)).limit(200);
  return (
    <div>
      <h1 className="text-2xl font-semibold">Usulan Warga</h1>
      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr><th className="th">Kode</th><th className="th">Usulan</th><th className="th">Pengusul</th><th className="th">Tanggal</th><th className="th">Tahapan</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 && <tr><td colSpan={5} className="td text-center text-stone-500">Belum ada usulan.</td></tr>}
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-stone-50">
                <td className="td whitespace-nowrap font-mono text-xs">{p.code}</td>
                <td className="td"><Link href={`/pengurus/usulan/${p.id}`} className="font-medium text-brand-700 hover:underline">{p.title}</Link><p className="text-xs text-stone-500">{categoryLabel(p.category)}</p></td>
                <td className="td">{p.submitterName}</td>
                <td className="td whitespace-nowrap">{tgl(p.createdAt)}</td>
                <td className="td"><span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{statusLabel(p.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
