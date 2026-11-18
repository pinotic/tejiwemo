import Link from "next/link";
import { SITE } from "@/lib/refs";
import BottomNav from "@/components/bottom-nav";
import SocialLinks from "@/components/social-links";

const nav = [
  { href: "/berita", label: "Berita" },
  { href: "/struktur", label: "Pengurus RT" },
  { href: "/keuangan", label: "Keuangan" },
  { href: "/usulan", label: "Usulan" },
  { href: "/usulan/lacak", label: "Lacak Usulan" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">RT</span>
            {SITE.name}
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hidden rounded-lg px-3 py-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900 md:inline-block">
                {n.label}
              </Link>
            ))}
            <Link href="/pengurus" className="ml-1 rounded-lg border border-stone-300 px-3 py-1.5 text-stone-700 hover:bg-stone-100">
              Pengurus
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-stone-200 bg-white pb-28 pt-6 text-center text-sm text-stone-500 md:pb-6">
        <SocialLinks className="mb-4 justify-center" />
        <p className="mb-2">
          <Link href="/struktur" className="hover:text-brand-700 hover:underline">Pengurus RT</Link>
        </p>
        © {new Date().getFullYear()} {SITE.name} · {SITE.tagline}
      </footer>
      <BottomNav
        variant="light"
        tabs={[
          { href: "/", label: "Beranda", icon: "home" },
          { href: "/berita", label: "Berita", icon: "news" },
          { href: "/keuangan", label: "Keuangan", icon: "wallet" },
          { href: "/usulan/lacak", label: "Lacak Usulan", icon: "search" },
        ]}
        fab={{ label: "Kirim usulan", href: "/usulan" }}
      />
    </div>
  );
}
