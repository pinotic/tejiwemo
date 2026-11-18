"use client";

import { useFormState, useFormStatus } from "react-dom";
import { PROPOSAL_CATEGORY } from "@/lib/refs";
import { submitProposal } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Mengirim…" : "Kirim usulan"}</button>;
}

export default function ProposalForm() {
  const [state, action] = useFormState(submitProposal, undefined);
  return (
    <form action={action} className="card space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Nama</label>
          <input id="name" name="name" className="input" required maxLength={100} />
        </div>
        <div>
          <label className="label" htmlFor="contact">No. HP / alamat rumah <span className="font-normal text-stone-400">(opsional)</span></label>
          <input id="contact" name="contact" className="input" maxLength={100} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="category">Kategori</label>
        <select id="category" name="category" className="input" defaultValue="lainnya">
          {PROPOSAL_CATEGORY.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="title">Judul usulan</label>
        <input id="title" name="title" className="input" required minLength={5} maxLength={150} />
      </div>
      <div>
        <label className="label" htmlFor="description">Uraian usulan</label>
        <textarea id="description" name="description" rows={6} className="input" required minLength={15} maxLength={3000} />
      </div>
      {/* honeypot anti-bot: jangan diisi */}
      <div className="hidden" aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <Submit />
    </form>
  );
}
