import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, users } from "@/db";
import { requireAccess } from "@/lib/auth";
import { roleLabel } from "@/lib/refs";
import UserForm from "./user-form";
import { toggleActive } from "./actions";

export const metadata = { title: "Akun Pengurus" };
export const dynamic = "force-dynamic";

export default async function AkunPage() {
  const me = await requireAccess("akun");
  const rows = await db.select().from(users).orderBy(asc(users.name));
  return (
    <div>
      <h1 className="text-2xl font-semibold">Akun Pengurus</h1>
      <p className="mt-1 text-sm text-stone-600">Khusus superadmin. Hanya akun di sini yang dapat masuk ke SIM. Ubah username, sandi, dan peran lewat tombol Ubah; nonaktifkan akun pengurus yang sudah tidak menjabat.</p>

      <div className="mt-6"><UserForm /></div>

      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr><th className="th">Nama</th><th className="th">Username</th><th className="th">Peran</th><th className="th">Status</th><th className="th" /></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((u) => (
              <tr key={u.id} className="align-top">
                <td className="td"><p className="font-medium">{u.name}</p><p className="text-xs text-stone-500">{u.jabatan}</p></td>
                <td className="td font-mono text-xs">{u.username}</td>
                <td className="td">{roleLabel(u.role)}</td>
                <td className="td">{u.active ? <span className="text-brand-700">Aktif</span> : <span className="text-stone-500">Nonaktif</span>}</td>
                <td className="td">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link href={`/pengurus/akun/${u.id}`} className="btn-outline px-3 py-1.5 text-xs">Ubah</Link>
                    {u.id !== me.id && (
                      <form action={toggleActive.bind(null, u.id)}>
                        <button className="btn-danger">{u.active ? "Nonaktifkan" : "Aktifkan"}</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
