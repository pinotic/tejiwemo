"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ARCHIVE_CATEGORY } from "@/lib/refs";
import { addArchive } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Mengunggah…" : "Simpan arsip"}</button>;
}

export default function ArsipForm({ today, defaultCategory }: { today: string; defaultCategory: string }) {
  const [state, action] = useFormState(addArchive, undefined);
  return (
    <form action={action} className="card space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">Jenis arsip</label>
          <select id="category" name="category" className="input" defaultValue={defaultCategory}>
            {ARCHIVE_CATEGORY.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="docDate">Tanggal dokumen</label>
          <input id="docDate" name="docDate" type="date" defaultValue={today} className="input" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="title">Judul / perihal</label>
        <input id="title" name="title" className="input" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="number">Nomor dokumen <span className="font-normal text-stone-400">(opsional)</span></label>
          <input id="number" name="number" className="input" placeholder="mis. 012/RT/XI/2026" />
        </div>
        <div>
          <label className="label" htmlFor="party">Pengirim / tujuan / pihak terkait <span className="font-normal text-stone-400">(opsional)</span></label>
          <input id="party" name="party" className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">Keterangan <span className="font-normal text-stone-400">(opsional)</span></label>
        <textarea id="description" name="description" rows={2} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="file">File (PDF, foto, Word, Excel · maks. 4 MB)</label>
        <input id="file" name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700" />
      </div>
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <Submit />
    </form>
  );
}
