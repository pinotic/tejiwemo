import { requireAccess } from "@/lib/auth";
import NewsForm from "../news-form";

export const metadata = { title: "Berita Baru" };

export default async function NewNews() {
  await requireAccess("berita", "write");
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Berita baru</h1>
      <NewsForm id={null} />
    </div>
  );
}
