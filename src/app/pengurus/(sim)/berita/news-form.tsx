"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveNews } from "./actions";

type Initial = { title: string; excerpt: string; body: string; eventDate: string | null; published: boolean };

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan…" : "Simpan"}</button>;
}

export default function NewsForm({ id, initial }: { id: number | null; initial?: Initial }) {
  const [state, action] = useFormState(saveNews.bind(null, id), undefined);
  return (
    <form action={action} className="card space-y-4">
      <div>
        <label className="label" htmlFor="title">Judul</label>
        <input id="title" name="title" className="input" defaultValue={initial?.title} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="eventDate">Tanggal kegiatan <span className="font-normal text-stone-400">(opsional)</span></label>
          <input id="eventDate" name="eventDate" type="date" className="input" defaultValue={initial?.eventDate ?? ""} />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" name="published" defaultChecked={initial?.published ?? true} className="h-4 w-4" />
          Tampilkan di situs warga
        </label>
      </div>
      <div>
        <label className="label" htmlFor="excerpt">Ringkasan singkat <span className="font-normal text-stone-400">(opsional)</span></label>
        <input id="excerpt" name="excerpt" className="input" maxLength={300} defaultValue={initial?.excerpt} />
      </div>
      <div>
        <label className="label" htmlFor="body">Isi berita</label>
        <textarea id="body" name="body" rows={12} className="input" defaultValue={initial?.body} required />
      </div>
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <Submit />
    </form>
  );
}
