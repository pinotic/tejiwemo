import Link from "next/link";
import { desc, and, eq, or, ilike, type SQL } from "drizzle-orm";
import { db, archives } from "@/db";
import { requireAccess, canWrite } from "@/lib/auth";
import { ARCHIVE_CATEGORY, archiveLabel } from "@/lib/refs";
import { formatBytes, tgl } from "@/lib/utils";
import { deleteArchive } from "./actions";

export const metadata = { title: "Arsip Digital" };
export const dynamic = "force-dynamic";

export default async function ArsipPage({ searchParams }: { searchParams: { kategori?: string; q?: string } }) {
  const user = await requireAccess("arsip");
  const w = canWrite(user.role, "arsip");
  const conds: SQL[] = [];
  const kategori = ARCHIVE_CATEGORY.some((c) => c.key === searchParams.kategori) ? searchParams.kategori! : "";
  if (kategori) conds.push(eq(archives.category, kategori));
  const q = (searchParams.q ?? "").trim().replace(/[%_]/g, "");
  if (q) conds.push(or(ilike(archives.title, `%${q}%`), ilike(archives.number, `%${q}%`), ilike(archives.party, `%${q}%`))!);

  const rows = await db.select().from(archives).where(conds.length ? and(...conds) : undefined).orderBy(desc(archives.docDate), desc(archives.id)).limit(300);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Arsip Digital</h1>
        {w && <Link href="/pengurus/arsip/baru" className="btn">+ Arsipkan dokumen</Link>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/pengurus/arsip" className={`rounded-full border px-3 py-1 text-sm ${!kategori ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300 bg-white hover:bg-stone-100"}`}>Semua</Link>
        {ARCHIVE_CATEGORY.map((c) => (
          <Link key={c.key} href={`/pengurus/arsip?kategori=${c.key}`} className={`rounded-full border px-3 py-1 text-sm ${kategori === c.key ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300 bg-white hover:bg-stone-100"}`}>{c.label}</Link>
        ))}
      </div>

      <form className="mt-4 flex gap-2">
        {kategori && <input type="hidden" name="kategori" value={kategori} />}
        <input name="q" defaultValue={q} placeholder="Cari judul, nomor, atau pihak terkait…" className="input max-w-sm" />
        <button className="btn-outline">Cari</button>
      </form>

      <div className="card mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr><th className="th">Tanggal</th><th className="th">Jenis</th><th className="th">Judul / nomor</th><th className="th">File</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.length === 0 && <tr><td colSpan={5} className="td text-center text-stone-500">Belum ada arsip.</td></tr>}
            {rows.map((a) => (
              <tr key={a.id} className="align-top">
                <td className="td whitespace-nowrap">{tgl(a.docDate)}</td>
                <td className="td"><span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs">{archiveLabel(a.category)}</span></td>
                <td className="td">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-stone-500">{[a.number, a.party].filter(Boolean).join(" · ")}</p>
                </td>
                <td className="td whitespace-nowrap">
                  <a href={`/pengurus/arsip/${a.id}/file`} target="_blank" className="text-brand-700 hover:underline">Buka</a>
                  <span className="ml-1 text-xs text-stone-400">{formatBytes(a.fileSize)}</span>
                </td>
                <td className="td text-right">
                  {w && (
                    <form action={deleteArchive.bind(null, a.id)}>
                      <button className="btn-danger">Hapus</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
