"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ROLES } from "@/lib/refs";
import { updateUser } from "../actions";

type Initial = { name: string; username: string; jabatan: string; role: string };

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan…" : "Simpan perubahan"}</button>;
}

export default function EditUserForm({ id, isSelf, initial }: { id: number; isSelf: boolean; initial: Initial }) {
  const [state, action] = useFormState(updateUser.bind(null, id), undefined);
  return (
    <form action={action} className="card grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="name">Nama</label>
        <input id="name" name="name" className="input" defaultValue={initial.name} required />
      </div>
      <div>
        <label className="label" htmlFor="jabatan">Jabatan <span className="font-normal text-stone-400">(opsional)</span></label>
        <input id="jabatan" name="jabatan" className="input" defaultValue={initial.jabatan} />
      </div>
      <div>
        <label className="label" htmlFor="username">Username</label>
        <input id="username" name="username" className="input" defaultValue={initial.username} autoComplete="off" required />
      </div>
      <div>
        <label className="label" htmlFor="role">Peran akses</label>
        <select id="role" name="role" className="input" defaultValue={initial.role} disabled={isSelf}>
          {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
        {isSelf && <p className="mt-1 text-xs text-stone-500">Peran akun Anda sendiri tidak dapat diubah.</p>}
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="password">Kata sandi baru <span className="font-normal text-stone-400">(kosongkan jika tidak diganti, min. 10 karakter)</span></label>
        <input id="password" name="password" type="text" autoComplete="new-password" className="input" />
      </div>
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2"><Submit /></div>
    </form>
  );
}
