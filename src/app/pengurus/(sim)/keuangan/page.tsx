import Link from "next/link";
import { requireAccess, canWrite } from "@/lib/auth";
import { getBidang, getSummaries, getTransactions, currentMonth, parseMonth, monthLabel } from "@/lib/finance";
import { rupiah, tgl, today } from "@/lib/utils";
import TxForm from "./tx-form";
import NoteForm from "./note-form";
import { db, reportNotes } from "@/db";
import { and, eq } from "drizzle-orm";
import { deleteTransaction } from "./actions";

export const metadata = { title: "Keuangan" };
export const dynamic = "force-dynamic";

export default async function KeuanganAdmin({ searchParams }: { searchParams: { lini?: string; bulan?: string } }) {
  const user = await requireAccess("keuangan");
  const list = await getBidang();
  const lini = list.some((l) => l.key === searchParams.lini) ? searchParams.lini! : list[0]?.key ?? "";
  const liniName = list.find((l) => l.key === lini)?.label ?? "";
  const month = parseMonth(searchParams.bulan);
  const [summaries, txs, [noteRow]] = await Promise.all([
    getSummaries(),
    getTransactions(lini, 100),
    db.select().from(reportNotes).where(and(eq(reportNotes.lini, lini), eq(reportNotes.month, month))).limit(1),
  ]);
  const s = summaries.find((x) => x.key === lini) ?? { masuk: 0, keluar: 0, saldo: 0 };
  const monthTx = txs.filter((t) => String(t.txDate).startsWith(month)).length;
  const w = canWrite(user.role, "keuangan");

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Keuangan</h1>
        {w && <Link href="/pengurus/keuangan/bidang" className="btn-outline">Kelola bidang</Link>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {list.map((l) => (
          <Link key={l.key} href={`/pengurus/keuangan?lini=${l.key}`}
            className={`rounded-full border px-3 py-1 text-sm ${l.key === lini ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"}`}>
            {l.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="card"><p className="text-xs text-stone-500">Pemasukan {liniName}</p><p className="mt-1 text-lg font-semibold tabular-nums text-brand-700">{rupiah(s.masuk)}</p></div>
        <div className="card"><p className="text-xs text-stone-500">Pengeluaran</p><p className="mt-1 text-lg font-semibold tabular-nums text-red-600">{rupiah(s.keluar)}</p></div>
        <div className="card"><p className="text-xs text-stone-500">Saldo</p><p className="mt-1 text-lg font-semibold tabular-nums">{rupiah(s.saldo)}</p></div>
      </div>

      {w ? (
        <div className="mt-6"><TxForm lini={lini} today={today()} /></div>
      ) : (
        <p className="mt-6 rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">Peran Anda hanya dapat melihat data keuangan.</p>
      )}

      {w && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Keterangan laporan untuk warga</h2>
          <p className="mt-1 text-sm text-stone-600">Tampil di bawah angka {liniName} pada halaman Laporan Keuangan situs warga. Tulis ringkasan rincian, mis. &quot;Iuran 42 KK, beli lampu jalan Rp 350.000&quot;.</p>
          <form method="get" className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="lini" value={lini} />
            <div>
              <label className="label" htmlFor="bulan">Bulan laporan</label>
              <input id="bulan" name="bulan" type="month" max={currentMonth()} defaultValue={month} className="input" />
            </div>
            <button className="btn-outline">Tampilkan</button>
          </form>
          <p className="mt-2 text-xs text-stone-500">{monthLabel(month)}: {monthTx > 0 ? `${monthTx} transaksi tercatat.` : "belum ada transaksi, bidang ini akan tampil \"belum melapor\" di situs warga."}</p>
          <div className="mt-3"><NoteForm key={`${lini}-${month}`} lini={lini} month={month} initial={noteRow?.note ?? ""} /></div>
        </section>
      )}

      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[600px]">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr><th className="th">Tanggal</th><th className="th">Keterangan</th><th className="th text-right">Masuk</th><th className="th text-right">Keluar</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {txs.length === 0 && <tr><td colSpan={5} className="td text-center text-stone-500">Belum ada transaksi.</td></tr>}
            {txs.map((t) => (
              <tr key={t.id}>
                <td className="td whitespace-nowrap">{tgl(t.txDate)}</td>
                <td className="td">{t.description}</td>
                <td className="td text-right tabular-nums text-brand-700">{t.type === "masuk" ? rupiah(t.amount) : ""}</td>
                <td className="td text-right tabular-nums text-red-600">{t.type === "keluar" ? rupiah(t.amount) : ""}</td>
                <td className="td text-right">
                  {w && (
                    <form action={deleteTransaction.bind(null, t.id)}>
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
