import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, residents } from "@/db";
import { requireAccess } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import ResidentForm from "../resident-form";
import { deleteResident } from "../actions";

export const metadata = { title: "Ubah Data Penduduk" };
export const dynamic = "force-dynamic";

export default async function EditResident({ params }: { params: { id: string } }) {
  await requireAccess("penduduk", "write");
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const [r] = await db.select().from(residents).where(eq(residents.id, id)).limit(1);
  if (!r) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/pengurus/penduduk" className="text-sm text-stone-500 hover:text-brand-700">← Data penduduk</Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">{r.name}</h1>
      <ResidentForm
        id={r.id}
        initial={{ name: r.name, kk: decrypt(r.kkEnc), nik: decrypt(r.nikEnc), status: r.status, address: r.address, phone: r.phone, notes: r.notes }}
      />
      <form action={deleteResident.bind(null, r.id)} className="mt-6">
        <button className="btn-danger">Hapus data ini</button>
      </form>
    </div>
  );
}
