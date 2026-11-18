import Link from "next/link";
import { count, eq, sql } from "drizzle-orm";
import { db, proposals, residents, archives, news } from "@/db";
import { requireUser, canRead } from "@/lib/auth";
import { getSummaries } from "@/lib/finance";
import { roleLabel } from "@/lib/refs";
import { rupiah } from "@/lib/utils";

export const metadata = { title: "Dasbor Pengurus" };
export const dynamic = "force-dynamic";

export default async function Dashboard({ searchParams }: { searchParams: { akses?: string } }) {
  const user = await requireUser();

  const [[openProps], [arc], [nw], summaries] = await Promise.all([
    db.select({ n: count() }).from(proposals).where(sql`${proposals.status} not in ('selesai','ditolak')`),
    db.select({ n: count() }).from(archives),
    db.select({ n: count() }).from(news).where(eq(news.published, true)),
    getSummaries(),
  ]);
  let residentCount: number | null = null;
  if (canRead(user.role, "penduduk")) {
    const [r] = await db.select({ n: count() }).from(residents);
    residentCount = r.n;
  }
  const totalSaldo = summaries.reduce((a, s) => a + s.saldo, 0);

  const stats = [
    { label: "Usulan berjalan", value: openProps.n, href: "/pengurus/usulan" },
    { label: "Total saldo semua lini", value: rupiah(totalSaldo), href: "/pengurus/keuangan" },
    { label: "Berita terbit", value: nw.n, href: "/pengurus/berita" },
    { label: "Dokumen diarsipkan", value: arc.n, href: "/pengurus/arsip" },
    ...(residentCount !== null ? [{ label: "Penduduk tercatat", value: residentCount, href: "/pengurus/penduduk" }] : []),
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold">Halo, {user.name}</h1>
      <p className="text-sm text-stone-600">Anda masuk sebagai {roleLabel(user.role)}.</p>
      {searchParams.akses === "ditolak" && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Peran Anda tidak memiliki akses ke halaman tersebut.</p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card transition hover:border-brand-200 hover:shadow">
            <p className="text-xs text-stone-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
