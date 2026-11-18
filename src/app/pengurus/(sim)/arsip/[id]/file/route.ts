import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, archives } from "@/db";
import { getUser, canRead } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Unduhan arsip hanya untuk pengurus yang login; file diteruskan dari server
// sehingga alamat penyimpanan tidak pernah dibagikan ke browser.
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getUser();
  if (!user || !canRead(user.role, "arsip")) return new NextResponse("Tidak diizinkan", { status: 401 });

  const id = Number(params.id);
  if (!Number.isInteger(id)) return new NextResponse("Tidak ditemukan", { status: 404 });
  const [a] = await db.select().from(archives).where(eq(archives.id, id)).limit(1);
  if (!a) return new NextResponse("Tidak ditemukan", { status: 404 });

  const upstream = await fetch(a.fileUrl);
  if (!upstream.ok || !upstream.body) return new NextResponse("File tidak tersedia", { status: 502 });

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": a.fileType || "application/octet-stream",
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(a.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
