import Link from "next/link";
import ProposalForm from "./form";

export const metadata = { title: "Sampaikan Usulan" };

export default function UsulanPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Sampaikan Usulan</h1>
      <p className="mt-1 text-sm text-stone-600">
        Setelah dikirim, Anda mendapat <strong>kode lacak</strong> untuk memantau tahapan usulan. Simpan kodenya.
        Sudah punya kode?{" "}
        <Link href="/usulan/lacak" className="text-brand-700 hover:underline">Lacak usulan</Link>.
      </p>
      <div className="mt-6">
        <ProposalForm />
      </div>
    </div>
  );
}
