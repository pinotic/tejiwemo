"use client";

import { useFormState, useFormStatus } from "react-dom";
import { PROPOSAL_STATUS } from "@/lib/refs";
import { updateProposalStatus } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan…" : "Perbarui tahapan"}</button>;
}

export default function StatusForm({ id, current }: { id: number; current: string }) {
  const [state, action] = useFormState(updateProposalStatus.bind(null, id), undefined);
  return (
    <form action={action} className="card space-y-4">
      <h2 className="font-semibold">Perbarui tahapan</h2>
      <div>
        <label className="label" htmlFor="status">Tahapan</label>
        <select id="status" name="status" className="input" defaultValue={current}>
          {PROPOSAL_STATUS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="note">Catatan untuk pengusul <span className="font-normal text-stone-400">(tampil di halaman lacak)</span></label>
        <textarea id="note" name="note" rows={3} className="input" maxLength={1000} />
      </div>
      <div className="flex items-center gap-3">
        <Submit />
        {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        {state?.ok && <p className="text-sm text-brand-700">Tersimpan.</p>}
      </div>
    </form>
  );
}
