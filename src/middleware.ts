import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, verifySession } from "@/lib/session";

// Lapis pertama: semua /pengurus/* (kecuali halaman login) wajib punya sesi valid.
// Setiap halaman & aksi server tetap memverifikasi ulang (lihat src/lib/auth.ts).
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/pengurus/login") return NextResponse.next();

  const session = await verifySession(req.cookies.get(COOKIE)?.value);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/pengurus/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = { matcher: ["/pengurus/:path*"] };
