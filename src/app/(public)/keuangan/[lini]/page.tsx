import { redirect } from "next/navigation";

// Rincian per bidang kini ada di halaman utama laporan (kartu per bidang).
export default function LiniPage({ params }: { params: { lini: string } }) {
  redirect(`/keuangan#${encodeURIComponent(params.lini)}`);
}
