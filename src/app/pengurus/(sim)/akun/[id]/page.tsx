import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { requireAccess } from "@/lib/auth";
import EditUserForm from "./edit-form";

export const metadata = { title: "Ubah Akun" };
export const dynamic = "force-dynamic";

export default async function EditAkun({ params }: { params: { id: string } }) {
  const me = await requireAccess("akun");
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!u) notFound();

  return (
    <div>
      <Link href="/pengurus/akun" className="text-sm text-stone-500 hover:text-brand-700">← Akun pengurus</Link>
      <h1 className="mt-2 text-2xl font-semibold">Ubah akun</h1>
      <div className="mt-6">
        <EditUserForm
          id={u.id}
          isSelf={me.id === u.id}
          initial={{ name: u.name, username: u.username, jabatan: u.jabatan, role: u.role }}
        />
      </div>
    </div>
  );
}
