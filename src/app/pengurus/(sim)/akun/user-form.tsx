"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ROLES } from "@/lib/refs";
import { createUser } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan…" : "Tambah pengurus"}</button>;
}

export default function UserForm() {
  const [state, action] = useFormState(createUser, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);

  return (
    <form ref={ref} action={action} className="card grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="name">Nama</label>
        <input id="name" name="name" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="jabatan">Jabatan <span className="font-normal text-stone-400">(opsional)</span></label>
        <input id="jabatan" name="jabatan" className="input" placeholder="mis. Sekretaris RT" />
      </div>
      <div>
        <label className="label" htmlFor="username">Username</label>
        <input id="username" name="username" className="input" autoComplete="off" required />
      </div>
      <div>
        <label className="label" htmlFor="role">Peran akses</label>
        <select id="role" name="role" className="input" defaultValue="anggota">
          {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="password">Kata sandi awal (min. 10 karakter)</label>
        <input id="password" name="password" type="text" autoComplete="new-password" minLength={10} className="input" required />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Submit />
        {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        {state?.ok && <p className="text-sm text-brand-700">Akun dibuat.</p>}
      </div>
    </form>
  );
}
