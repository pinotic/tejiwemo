import { getMonthlySummaries, monthLabel, parseMonth } from "@/lib/finance";
import { rupiah } from "@/lib/utils";
import MonthNav from "@/components/month-nav";

export const metadata = { title: "Laporan Keuangan" };
export const dynamic = "force-dynamic";

export default async function KeuanganPage({ searchParams }: { searchParams: { bulan?: string } }) {
  const month = parseMonth(searchParams.bulan);
  const label = monthLabel(month);
  const rows = await getMonthlySummaries(month);
  const done = rows.filter((r) => r.reported).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Laporan Keuangan</h1>
          <p className="mt-1 text-sm text-stone-600">
            Pemasukan dan pengeluaran bulan {label} serta saldo akhirnya. {done} dari {rows.length} bidang sudah melapor.
          </p>
        </div>
        <MonthNav basePath="/keuangan" month={month} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {rows.map((r) => (
          <section key={r.key} id={r.key} className="card scroll-mt-20">
            <h2 className="font-semibold">{r.label}</h2>
            {r.reported ? (
              <>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3 sm:gap-4">
                  <div className="flex justify-between sm:block">
                    <dt className="text-xs text-stone-500">Pemasukan</dt>
                    <dd className="font-medium tabular-nums text-brand-700">{rupiah(r.masuk)}</dd>
                  </div>
                  <div className="flex justify-between sm:block">
                    <dt className="text-xs text-stone-500">Pengeluaran</dt>
                    <dd className="font-medium tabular-nums text-red-600">{rupiah(r.keluar)}</dd>
                  </div>
                  <div className="flex justify-between sm:block">
                    <dt className="text-xs text-stone-500">Saldo akhir</dt>
                    <dd className={`font-semibold tabular-nums ${r.saldoAkhir < 0 ? "text-red-600" : ""}`}>{rupiah(r.saldoAkhir)}</dd>
                  </div>
                </dl>
                {r.note && <p className="mt-3 whitespace-pre-line border-t border-stone-100 pt-3 text-sm text-stone-600">{r.note}</p>}
              </>
            ) : (
              <p className="mt-3 text-sm italic text-amber-700">Bidang {r.label} di bulan {label} belum melapor.</p>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
