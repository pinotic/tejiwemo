import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, proposals, proposalUpdates } from "@/db";
import { PROPOSAL_STATUS, categoryLabel, statusLabel } from "@/lib/refs";
import { tgl } from "@/lib/utils";

export const metadata = { title: "Status Usulan" };
export const dynamic = "force-dynamic";

export default async function LacakDetail({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { baru?: string };
}) {
  const [p] = await db.select().from(proposals).where(eq(proposals.code, params.code.toUpperCase())).limit(1);

  if (!p) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-xl font-semibold">Usulan tidak ditemukan</h1>
        <p className="mt-2 text-sm text-stone-600">Periksa kembali kode lacak Anda.</p>
        <Link href="/usulan/lacak" className="btn mt-4">Coba lagi</Link>
      </div>
    );
  }

  const updates = await db.select().from(proposalUpdates).where(eq(proposalUpdates.proposalId, p.id)).orderBy(asc(proposalUpdates.createdAt), asc(proposalUpdates.id));

  // Tahapan utama (alur normal). "ditolak" ditangani terpisah.
  const steps = PROPOSAL_STATUS.filter((s) => s.key !== "ditolak");
  const currentIdx = steps.findIndex((s) => s.key === p.status);
  const rejected = p.status === "ditolak";

  return (
    <div className="mx-auto max-w-2xl">
      {searchParams.baru && (
        <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
          Usulan Anda sudah terkirim. <strong>Simpan kode lacak ini: {p.code}</strong>
        </div>
      )}
      <p className="text-sm text-stone-500">{p.code} · {categoryLabel(p.category)} · {tgl(p.createdAt)}</p>
      <h1 className="mt-1 text-2xl font-semibold">{p.title}</h1>
      <p className="mt-3 whitespace-pre-line text-stone-700">{p.description}</p>

      <div className="card mt-8">
        <h2 className="font-semibold">Tahapan</h2>
        <p className="mt-1 text-sm text-stone-600">
          Status saat ini: <strong>{statusLabel(p.status)}</strong>
        </p>
        <ol className="mt-4 space-y-3">
          {steps.map((s, i) => {
            const done = !rejected && i <= currentIdx;
            return (
              <li key={s.key} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-brand-600 text-white" : "bg-stone-200 text-stone-500"}`}>
                  {done ? "✓" : i + 1}
                </span>
                <div>
                  <p className={`text-sm font-medium ${done ? "text-stone-900" : "text-stone-400"}`}>{s.label}</p>
                  <p className="text-xs text-stone-500">{s.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
        {rejected && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Usulan ini belum dapat ditindaklanjuti. Lihat catatan di bawah.</p>}
      </div>

      <div className="card mt-4">
        <h2 className="font-semibold">Riwayat</h2>
        <ul className="mt-3 space-y-3">
          {[...updates].reverse().map((u) => (
            <li key={u.id} className="border-l-2 border-brand-200 pl-3">
              <p className="text-sm font-medium">{statusLabel(u.status)} <span className="font-normal text-stone-500">· {tgl(u.createdAt)}</span></p>
              {u.note && <p className="text-sm text-stone-600">{u.note}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
