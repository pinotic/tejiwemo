"use client";

import { useFormState, useFormStatus } from "react-dom";
import { OFFICER_GROUP } from "@/lib/refs";
import { saveOfficer } from "./actions";

type Initial = { name: string; jabatan: string; grup: string; sortOrder: number; visible: boolean };

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</button>;
}

export default function OfficerForm({ id, initial }: { id: number | null; initial?: Initial }) {
  const [state, action] = useFormState(saveOfficer.bind(null, id), undefined);
  return (
    <form action={action} className="card grid gap-4 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="name">Nama</label>
        <input id="name" name="name" className="input" defaultValue={initial?.name} required />
      </div>
      <div>
        <label className="label" htmlFor="jabatan">Jabatan</label>
        <input id="jabatan" name="jabatan" className="input" placeholder="mis. Ketua RT, Koordinator Dasawisma 1" defaultValue={initial?.jabatan} required />
      </div>
      <div>
        <label className="label" htmlFor="grup">Kelompok</label>
        <select id="grup" name="grup" className="input" defaultValue={initial?.grup ?? "inti"}>
          {OFFICER_GROUP.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="sortOrder">Urutan tampil <span className="font-normal text-stone-400">(kecil tampil lebih dulu)</span></label>
        <input id="sortOrder" name="sortOrder" type="number" min={0} max={999} className="input" defaultValue={initial?.sortOrder ?? 0} />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="visible" defaultChecked={initial?.visible ?? true} className="h-4 w-4" />
        Tampilkan di situs warga
      </label>
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2"><Submit /></div>
    </form>
  );
}
