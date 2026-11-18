"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addTransaction } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return <button className="btn" disabled={pending}>{pending ? "Menyimpan…" : "Catat transaksi"}</button>;
}

export default function TxForm({ lini, today }: { lini: string; today: string }) {
  const [state, action] = useFormState(addTransaction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);

  return (
    <form ref={ref} action={action} className="card grid gap-4 sm:grid-cols-6">
      <input type="hidden" name="lini" value={lini} />
      <div className="sm:col-span-2">
        <label className="label" htmlFor="txDate">Tanggal</label>
        <input id="txDate" name="txDate" type="date" defaultValue={today} className="input" required />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="type">Jenis</label>
        <select id="type" name="type" className="input" defaultValue="masuk">
          <option value="masuk">Pemasukan</option>
          <option value="keluar">Pengeluaran</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="amount">Nominal (Rp)</label>
        <input id="amount" name="amount" inputMode="numeric" placeholder="50000" className="input" required />
      </div>
      <div className="sm:col-span-6">
        <label className="label" htmlFor="description">Keterangan</label>
        <input id="description" name="description" className="input" placeholder="mis. Iuran warga bulan November" required />
      </div>
      <div className="flex items-center gap-3 sm:col-span-6">
        <Submit />
        {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
        {state?.ok && <p className="text-sm text-brand-700">Tersimpan.</p>}
      </div>
    </form>
  );
}
