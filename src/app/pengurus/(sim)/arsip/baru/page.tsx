import { requireAccess } from "@/lib/auth";
import { today } from "@/lib/utils";
import ArsipForm from "../arsip-form";

export const metadata = { title: "Arsipkan Dokumen" };

export default async function NewArsip({ searchParams }: { searchParams: { kategori?: string } }) {
  await requireAccess("arsip", "write");
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Arsipkan dokumen</h1>
      <ArsipForm today={today()} defaultCategory={searchParams.kategori ?? "surat_masuk"} />
    </div>
  );
}
