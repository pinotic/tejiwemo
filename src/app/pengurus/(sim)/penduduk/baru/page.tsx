import { requireAccess } from "@/lib/auth";
import ResidentForm from "../resident-form";

export const metadata = { title: "Tambah Penduduk" };

export default async function NewResident() {
  await requireAccess("penduduk", "write");
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Tambah penduduk</h1>
      <ResidentForm id={null} />
    </div>
  );
}
