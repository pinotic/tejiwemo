import Link from "next/link";
import { requireAccess } from "@/lib/auth";
import OfficerForm from "../officer-form";

export const metadata = { title: "Tambah Pengurus RT" };

export default async function BaruOfficer() {
  await requireAccess("pengurus", "write");
  return (
    <div>
      <Link href="/pengurus/struktur" className="text-sm text-stone-500 hover:text-brand-700">← Susunan pengurus</Link>
      <h1 className="mt-2 text-2xl font-semibold">Tambah pengurus RT</h1>
      <div className="mt-6"><OfficerForm id={null} /></div>
    </div>
  );
}
