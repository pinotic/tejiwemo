"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addBidang } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan…" : "Tambah bidang"}</button>;
}

export default function BidangForm() {
  const [state, action] = useFormState(addBidang, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="card flex flex-wrap items-end gap-3">
      <div className="min-w-[12rem] flex-1">
        <label className="label" htmlFor="label">Nama bidang baru</label>
        <input id="label" name="label" className="input" placeholder="mis. Posyandu, Karang Taruna" required />
      </div>
      <Submit />
      {state?.error && <p role="alert" className="w-full text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="w-full text-sm text-brand-700">Bidang ditambahkan.</p>}
    </form>
  );
}
