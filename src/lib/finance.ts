import { sql, eq, desc, asc } from "drizzle-orm";
import { db, transactions, bidang, reportNotes } from "@/db";
import { LINI } from "./refs";

export type Bidang = { id: number; key: string; label: string; sortOrder: number; active: boolean };

/** Daftar bidang. Jika tabel masih kosong (instalasi baru), diisi dengan bidang bawaan. */
export async function getBidang(opts?: { all?: boolean }): Promise<Bidang[]> {
  const load = () => db.select().from(bidang).orderBy(asc(bidang.sortOrder), asc(bidang.id));
  let rows = await load();
  if (rows.length === 0) {
    await db.insert(bidang).values(LINI.map((l, i) => ({ key: l.key, label: l.label, sortOrder: (i + 1) * 10 }))).onConflictDoNothing();
    rows = await load();
  }
  return opts?.all ? rows : rows.filter((r) => r.active);
}

export type LiniSummary = { key: string; label: string; masuk: number; keluar: number; saldo: number };

export async function getSummaries(): Promise<LiniSummary[]> {
  const [list, rows] = await Promise.all([
    getBidang({ all: true }),
    db
      .select({
        lini: transactions.lini,
        masuk: sql<number>`coalesce(sum(case when ${transactions.type} = 'masuk' then ${transactions.amount} else 0 end), 0)::float8`,
        keluar: sql<number>`coalesce(sum(case when ${transactions.type} = 'keluar' then ${transactions.amount} else 0 end), 0)::float8`,
      })
      .from(transactions)
      .groupBy(transactions.lini),
  ]);

  return list.map((l) => {
    const r = rows.find((x) => x.lini === l.key);
    const masuk = r?.masuk ?? 0;
    const keluar = r?.keluar ?? 0;
    return { key: l.key, label: l.label, masuk, keluar, saldo: masuk - keluar };
  });
}

export async function getTransactions(lini: string, limit = 200) {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.lini, lini))
    .orderBy(desc(transactions.txDate), desc(transactions.id))
    .limit(limit);
}

// ---------- Laporan bulanan (untuk situs warga) ----------

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Bulan berjalan menurut WIB, format "YYYY-MM". */
export function currentMonth(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit" })
    .format(new Date())
    .slice(0, 7);
}

/** Ambil bulan dari query string; bulan tidak valid atau di masa depan diganti bulan berjalan. */
export function parseMonth(raw: string | undefined): string {
  const cur = currentMonth();
  return raw && MONTH_RE.test(raw) && raw <= cur ? raw : cur;
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export type MonthlySummary = {
  key: string;
  label: string;
  /** false jika tidak ada satu pun transaksi pada bulan tersebut */
  reported: boolean;
  masuk: number;
  keluar: number;
  /** saldo kumulatif sampai akhir bulan tersebut */
  saldoAkhir: number;
  /** keterangan yang ditulis bendahara untuk bulan tersebut (boleh kosong) */
  note: string;
};

export async function getMonthlySummaries(month: string): Promise<MonthlySummary[]> {
  const start = `${month}-01`;
  const next = `${shiftMonth(month, 1)}-01`;
  const inMonth = sql`${transactions.txDate} >= ${start}::date and ${transactions.txDate} < ${next}::date`;

  const [list, notes, rows] = await Promise.all([
    getBidang(),
    db.select().from(reportNotes).where(eq(reportNotes.month, month)),
    db
    .select({
      lini: transactions.lini,
      n: sql<number>`count(*) filter (where ${inMonth})::int`,
      masuk: sql<number>`coalesce(sum(case when ${transactions.type} = 'masuk' and ${inMonth} then ${transactions.amount} else 0 end), 0)::float8`,
      keluar: sql<number>`coalesce(sum(case when ${transactions.type} = 'keluar' and ${inMonth} then ${transactions.amount} else 0 end), 0)::float8`,
      saldo: sql<number>`coalesce(sum(case when ${transactions.txDate} < ${next}::date then (case when ${transactions.type} = 'masuk' then ${transactions.amount} else -${transactions.amount} end) else 0 end), 0)::float8`,
    })
    .from(transactions)
    .groupBy(transactions.lini),
  ]);

  return list.map((l) => {
    const r = rows.find((x) => x.lini === l.key);
    return {
      key: l.key,
      label: l.label,
      reported: (r?.n ?? 0) > 0,
      masuk: r?.masuk ?? 0,
      keluar: r?.keluar ?? 0,
      saldoAkhir: r?.saldo ?? 0,
      note: notes.find((n) => n.lini === l.key)?.note ?? "",
    };
  });
}
