import Link from "next/link";
import { requireAccess, canWrite } from "@/lib/auth";
import { getBidang } from "@/lib/finance";
import BidangForm from "./bidang-form";
import { updateBidang } from "./actions";

export const metadata = { title: "Kelola Bidang Keuangan" };
export const dynamic = "force-dynamic";

export default async function BidangPage() {
  const user = await requireAccess("keuangan");
  const w = canWrite(user.role, "keuangan");
  const list = await getBidang({ all: true });

  return (
    <div>
      <Link href="/pengurus/keuangan" className="text-sm text-stone-500 hover:text-brand-700">← Keuangan</Link>
      <h1 className="mt-2 text-2xl font-semibold">Bidang keuangan</h1>
      <p className="mt-1 text-sm text-stone-600">
        Bidang yang aktif muncul di laporan keuangan situs warga dan di pilihan pencatatan transaksi.
        Bidang yang tidak lagi dipakai cukup dinonaktifkan; riwayat transaksinya tetap tersimpan.
      </p>

      {w && <div className="mt-6"><BidangForm /></div>}

      <div className="card mt-6 divide-y divide-stone-100 p-0">
        {list.map((b) => (
          <form key={b.id} action={updateBidang.bind(null, b.id)} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <input name="label" defaultValue={b.label} disabled={!w} className="input min-w-[10rem] flex-1" aria-label="Nama bidang" required />
            <label className="flex items-center gap-1.5 text-sm text-stone-600">
              Urutan
              <input name="sortOrder" type="number" min={0} max={9999} defaultValue={b.sortOrder} disabled={!w} className="input w-20 py-1.5" />
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="active" defaultChecked={b.active} disabled={!w} className="h-4 w-4" /> Aktif
            </label>
            {w && <button className="btn-outline px-3 py-1.5 text-xs">Simpan</button>}
          </form>
        ))}
      </div>
    </div>
  );
}
