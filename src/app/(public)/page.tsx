import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, news, officers } from "@/db";
import { currentMonth, getMonthlySummaries, monthLabel } from "@/lib/finance";
import { rupiah, tgl } from "@/lib/utils";
import { SITE } from "@/lib/refs";
import { initials } from "@/lib/utils";
import HeroSlider, { type HeroSlide } from "@/components/hero-slider";

export const dynamic = "force-dynamic";

const SLIDES: HeroSlide[] = [
  {
    eyebrow: "Selamat datang di portal",
    title: SITE.name,
    text: "Informasi kegiatan warga dalam satu tempat, langsung dari pengurus RT.",
    bg: "bg-gradient-to-br from-brand-900 to-brand-600",
    ctas: [
      { href: "/berita", label: "Lihat berita", primary: true },
      { href: "/struktur", label: "Pengurus RT" },
    ],
  },
  {
    eyebrow: "Transparan",
    title: "Keuangan yang terbuka",
    text: "Pantau pemasukan dan pengeluaran Kas RT, Dasawisma, Tahlil, PKK, hingga Masjid.",
    bg: "bg-gradient-to-br from-stone-900 to-brand-700",
    ctas: [{ href: "/keuangan", label: "Laporan keuangan", primary: true }],
  },
  {
    eyebrow: "Suara warga",
    title: "Usulan Anda kami dengar",
    text: "Sampaikan usulan, lalu lacak tahapannya dari diterima sampai selesai.",
    bg: "bg-gradient-to-br from-brand-700 to-brand-900",
    ctas: [
      { href: "/usulan", label: "Sampaikan usulan", primary: true },
      { href: "/usulan/lacak", label: "Lacak usulan saya" },
    ],
  },
];

export default async function Home() {
  const month = currentMonth();
  const [latest, summaries, inti] = await Promise.all([
    db.select().from(news).where(eq(news.published, true)).orderBy(desc(news.createdAt)).limit(3),
    getMonthlySummaries(month),
    db.select().from(officers).where(and(eq(officers.visible, true), eq(officers.grup, "inti"))).orderBy(asc(officers.sortOrder), asc(officers.id)).limit(6),
  ]);

  return (
    <div className="space-y-12">
      <HeroSlider slides={SLIDES} />

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Berita & kegiatan terbaru</h2>
          <Link href="/berita" className="text-sm text-brand-700 hover:underline">Semua berita →</Link>
        </div>
        {latest.length === 0 ? (
          <p className="card text-sm text-stone-500">Belum ada berita.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {latest.map((n) => (
              <Link key={n.id} href={`/berita/${n.slug}`} className="card transition hover:border-brand-200 hover:shadow">
                <p className="text-xs text-stone-500">{tgl(n.eventDate ?? n.createdAt)}</p>
                <h3 className="mt-1 font-semibold leading-snug">{n.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm text-stone-600">{n.excerpt || n.body}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {inti.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold">Pengurus RT</h2>
            <Link href="/struktur" className="text-sm text-brand-700 hover:underline">Susunan lengkap →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inti.map((o) => (
              <div key={o.id} className="card flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{initials(o.name)}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-stone-900">{o.name}</p>
                  <p className="text-sm text-stone-500">{o.jabatan}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Saldo akhir per bidang · {monthLabel(month)}</h2>
          <Link href="/keuangan" className="text-sm text-brand-700 hover:underline">Laporan lengkap →</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((s) => (
            <Link key={s.key} href={`/keuangan#${s.key}`} className="card flex items-center justify-between transition hover:border-brand-200 hover:shadow">
              <span className="font-medium">{s.label}</span>
              {s.reported ? (
                <span className={`tabular-nums ${s.saldoAkhir < 0 ? "text-red-600" : "text-brand-700"}`}>{rupiah(s.saldoAkhir)}</span>
              ) : (
                <span className="text-xs italic text-amber-700">Belum melapor</span>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
