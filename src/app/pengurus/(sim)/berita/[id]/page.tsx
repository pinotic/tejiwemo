import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, news } from "@/db";
import { requireAccess } from "@/lib/auth";
import NewsForm from "../news-form";
import { deleteNews } from "../actions";

export const metadata = { title: "Ubah Berita" };
export const dynamic = "force-dynamic";

export default async function EditNews({ params }: { params: { id: string } }) {
  await requireAccess("berita", "write");
  const id = Number(params.id);
  if (!Number.isInteger(id)) notFound();
  const [n] = await db.select().from(news).where(eq(news.id, id)).limit(1);
  if (!n) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Ubah berita</h1>
      <NewsForm id={n.id} initial={{ title: n.title, excerpt: n.excerpt, body: n.body, eventDate: n.eventDate, published: n.published }} />
      <form action={deleteNews.bind(null, n.id)} className="mt-6">
        <button className="btn-danger">Hapus berita ini</button>
      </form>
    </div>
  );
}
