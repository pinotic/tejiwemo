import Link from "next/link";
import { requireUser, canRead, canWrite } from "@/lib/auth";
import BottomNav from "@/components/bottom-nav";
import { roleLabel, SITE, type Module } from "@/lib/refs";
import { logout } from "../login/actions";

const items: { href: string; label: string; mod?: Module }[] = [
  { href: "/pengurus", label: "Dasbor" },
  { href: "/pengurus/berita", label: "Berita", mod: "berita" },
  { href: "/pengurus/keuangan", label: "Keuangan", mod: "keuangan" },
  { href: "/pengurus/usulan", label: "Usulan Warga", mod: "usulan" },
  { href: "/pengurus/penduduk", label: "Data Penduduk", mod: "penduduk" },
  { href: "/pengurus/arsip", label: "Arsip Digital", mod: "arsip" },
  { href: "/pengurus/struktur", label: "Susunan Pengurus", mod: "pengurus" },
  { href: "/pengurus/akun", label: "Akun & Peran", mod: "akun" },
];

export default async function SimLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const visible = items.filter((i) => !i.mod || canRead(user.role, i.mod));

  const quick = [
    { href: "/pengurus/berita/baru", label: "Tulis berita", mod: "berita" as Module },
    { href: "/pengurus/keuangan", label: "Catat transaksi keuangan", mod: "keuangan" as Module },
    { href: "/pengurus/penduduk/baru", label: "Tambah penduduk", mod: "penduduk" as Module },
    { href: "/pengurus/arsip/baru", label: "Unggah arsip", mod: "arsip" as Module },
  ].filter((q) => canWrite(user.role, q.mod));

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-stone-200 bg-white md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link href="/pengurus" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">RT</span>
            SIM {SITE.name}
          </Link>
        </div>
        <nav className="hidden gap-1 px-3 md:flex md:flex-col">
          {visible.map((i) => (
            <Link key={i.href} href={i.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-brand-50 hover:text-brand-700">
              {i.label}
            </Link>
          ))}
        </nav>
        <div className="hidden border-t border-stone-200 p-4 md:mt-6 md:block">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-stone-500">{user.jabatan || roleLabel(user.role)}</p>
          <form action={logout} className="mt-3">
            <button className="btn-outline w-full">Keluar</button>
          </form>
          <Link href="/" className="mt-3 block text-center text-xs text-stone-500 hover:text-brand-700">Lihat situs warga ↗</Link>
        </div>
      </aside>
      <div className="flex-1">
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3 md:hidden">
          <span className="text-sm">{user.name} · {roleLabel(user.role)}</span>
          <form action={logout}><button className="btn-outline px-3 py-1.5">Keluar</button></form>
        </div>
        <main className="mx-auto max-w-5xl p-4 pb-28 md:p-8">{children}</main>
      </div>
      <BottomNav
        variant="dark"
        tabs={[
          { href: "/pengurus", label: "Dasbor", icon: "home" },
          { href: "/pengurus/usulan", label: "Usulan Warga", icon: "chat" },
          { href: "/pengurus/keuangan", label: "Keuangan", icon: "wallet" },
          { label: "Menu", icon: "menu", menu: true },
        ]}
        fab={
          quick.length
            ? { label: "Buat baru", sheetTitle: "Buat baru", actions: quick }
            : { label: "Lihat situs warga", href: "/" }
        }
        menu={{
          title: `${user.name} · ${user.jabatan || roleLabel(user.role)}`,
          links: visible,
          footer: (
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="px-2 text-sm text-stone-400">Lihat situs warga ↗</Link>
              <form action={logout}>
                <button className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-stone-100 active:bg-white/10">Keluar</button>
              </form>
            </div>
          ),
        }}
      />
    </div>
  );
}
