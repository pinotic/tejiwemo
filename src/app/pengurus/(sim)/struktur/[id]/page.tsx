import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, officers } from "@/db";
import { requireAccess } from "@/lib/auth";
import OfficerForm from "../officer-form";
import { deleteOfficer } from "../actions";

export const metadata = { title: "Ubah Pengurus RT" };
export const dynamic = "force-dynamic";

export default async function EditOfficer({ params }: { params: { id: string } }) {
  await requireAccess("pengurus", "write");
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const [o] = await db.select().from(officers).where(eq(officers.id, id)).limit(1);
  if (!o) notFound();
  return (
    <div>
      <Link href="/pengurus/struktur" className="text-sm text-stone-500 hover:text-brand-700">← Susunan pengurus</Link>
      <h1 className="mt-2 text-2xl font-semibold">Ubah pengurus RT</h1>
      <div className="mt-6">
        <OfficerForm id={o.id} initial={{ name: o.name, jabatan: o.jabatan, grup: o.grup, sortOrder: o.sortOrder, visible: o.visible }} />
      </div>
      <form action={deleteOfficer.bind(null, o.id)} className="mt-6">
        <button className="btn-danger">Hapus dari susunan</button>
      </form>
    </div>
  );
}
