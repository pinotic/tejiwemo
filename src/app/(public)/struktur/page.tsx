import { asc, eq } from "drizzle-orm";
import { db, officers } from "@/db";
import { OFFICER_GROUP } from "@/lib/refs";
import { initials } from "@/lib/utils";

export const metadata = { title: "Pengurus RT" };
export const dynamic = "force-dynamic";

export default async function StrukturPage() {
  const rows = await db.select().from(officers).where(eq(officers.visible, true)).orderBy(asc(officers.sortOrder), asc(officers.id));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Pengurus RT</h1>
      <p className="mt-1 text-sm text-stone-600">Susunan pengurus yang sedang menjabat.</p>

      {rows.length === 0 && <p className="card mt-6 text-sm text-stone-500">Susunan pengurus belum diisi.</p>}

      {OFFICER_GROUP.map((g) => {
        const list = rows.filter((o) => o.grup === g.key);
        if (list.length === 0) return null;
        return (
          <section key={g.key} className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">{g.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((o) => (
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
        );
      })}
    </div>
  );
}
