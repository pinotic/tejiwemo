import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, proposals, proposalUpdates } from "@/db";
import { requireAccess, canWrite } from "@/lib/auth";
import { categoryLabel, statusLabel } from "@/lib/refs";
import { tgl } from "@/lib/utils";
import StatusForm from "../status-form";

export const dynamic = "force-dynamic";

export default async function UsulanDetail({ params }: { params: { id: string } }) {
  const user = await requireAccess("usulan");
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const [p] = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  if (!p) notFound();
  const updates = await db.select().from(proposalUpdates).where(eq(proposalUpdates.proposalId, id)).orderBy(desc(proposalUpdates.createdAt), desc(proposalUpdates.id));

  return (
    <div className="max-w-2xl">
      <Link href="/pengurus/usulan" className="text-sm text-stone-500 hover:text-brand-700">← Semua usulan</Link>
      <p className="mt-3 font-mono text-xs text-stone-500">{p.code} · {categoryLabel(p.category)} · {tgl(p.createdAt)}</p>
      <h1 className="mt-1 text-2xl font-semibold">{p.title}</h1>
      <p className="mt-1 text-sm text-stone-600">Pengusul: {p.submitterName}{p.submitterContact ? ` (${p.submitterContact})` : ""}</p>
      <p className="mt-4 whitespace-pre-line">{p.description}</p>

      <div className="mt-6">
        {canWrite(user.role, "usulan") ? <StatusForm id={p.id} current={p.status} /> : (
          <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-600">Status saat ini: {statusLabel(p.status)}. Peran Anda hanya dapat melihat.</p>
        )}
      </div>

      <div className="card mt-4">
        <h2 className="font-semibold">Riwayat</h2>
        <ul className="mt-3 space-y-3">
          {updates.map((u) => (
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
