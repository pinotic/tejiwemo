import { redirect } from "next/navigation";

export const metadata = { title: "Lacak Usulan" };

async function go(form: FormData) {
  "use server";
  const code = String(form.get("code") ?? "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  if (code) redirect(`/usulan/lacak/${code}`);
}

export default function LacakPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold">Lacak Usulan</h1>
      <p className="mt-1 text-sm text-stone-600">Masukkan kode lacak yang Anda terima saat mengirim usulan.</p>
      <form action={go} className="card mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="code">Kode lacak</label>
          <input id="code" name="code" placeholder="USL-XXXXXX" className="input uppercase" required />
        </div>
        <button className="btn">Cari usulan</button>
      </form>
    </div>
  );
}
