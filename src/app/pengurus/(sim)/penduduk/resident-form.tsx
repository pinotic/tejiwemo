"use client";

import { useFormState, useFormStatus } from "react-dom";
import { RESIDENT_STATUS } from "@/lib/refs";
import { saveResident } from "./actions";

type Initial = { name: string; kk: string; nik: string; status: string; address: string; phone: string; notes: string };

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</button>;
}

export default function ResidentForm({ id, initial }: { id: number | null; initial?: Initial }) {
  const [state, action] = useFormState(saveResident.bind(null, id), undefined);
  return (
    <form action={action} className="card space-y-4">
      <div>
        <label className="label" htmlFor="name">Nama lengkap</label>
        <input id="name" name="name" className="input" defaultValue={initial?.name} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="kk">No. KK</label>
          <input id="kk" name="kk" inputMode="numeric" maxLength={16} className="input font-mono" defaultValue={initial?.kk} required />
        </div>
        <div>
          <label className="label" htmlFor="nik">NIK (No. KTP)</label>
          <input id="nik" name="nik" inputMode="numeric" maxLength={16} className="input font-mono" defaultValue={initial?.nik} required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="status">Status tinggal</label>
          <select id="status" name="status" className="input" defaultValue={initial?.status ?? "tetap"}>
            {RESIDENT_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="phone">No. HP <span className="font-normal text-stone-400">(opsional)</span></label>
          <input id="phone" name="phone" className="input" defaultValue={initial?.phone} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="address">Alamat / No. rumah <span className="font-normal text-stone-400">(opsional)</span></label>
        <input id="address" name="address" className="input" defaultValue={initial?.address} />
      </div>
      <div>
        <label className="label" htmlFor="notes">Catatan <span className="font-normal text-stone-400">(opsional)</span></label>
        <textarea id="notes" name="notes" rows={2} className="input" defaultValue={initial?.notes} />
      </div>
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <Submit />
    </form>
  );
}
