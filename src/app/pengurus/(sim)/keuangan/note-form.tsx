"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveNote } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan…" : "Simpan keterangan"}</button>;
}

export default function NoteForm({ lini, month, initial }: { lini: string; month: string; initial: string }) {
  const [state, action] = useFormState(saveNote, undefined);
  return (
    <form action={action} className="card space-y-3">
      <input type="hidden" name="lini" value={lini} />
      <input type="hidden" name="month" value={month} />
      <textarea name="note" rows={4} maxLength={2000} defaultValue={initial} className="input" placeholder="Kosongkan untuk tidak menampilkan keterangan." />
      <div className="flex items-center gap-3">
        <Submit />
        {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        {state?.ok && <p className="text-sm text-brand-700">Tersimpan.</p>}
      </div>
    </form>
  );
}
