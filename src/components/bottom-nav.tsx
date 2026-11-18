"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

/* ---------- ikon ---------- */
type IconName = "home" | "news" | "wallet" | "chat" | "search" | "menu" | "plus";

function Icon({ name, active }: { name: IconName; active?: boolean }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: active ? 2.1 : 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "home":
      return (
        <svg {...common} fill={active ? "currentColor" : "none"}>
          <path d="M3 10.8 12 3l9 7.8V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case "news":
      return (
        <svg {...common}>
          <path d="M5 4h11a1 1 0 0 1 1 1v14H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1z" />
          <path d="M17 8h2a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2h-1M8 8h6M8 12h6M8 16h4" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...common}>
          <path d="M4 7a2 2 0 0 1 2-2h11v3" />
          <path d="M4 7v10a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6a2 2 0 0 1-2-1z" />
          <circle cx="16" cy="13.5" r="1" fill="currentColor" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4A8 8 0 1 1 20 11.5z" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common} strokeWidth={2}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
  }
}

/* ---------- tipe ---------- */
export type NavTab =
  | { href: string; label: string; icon: IconName; menu?: false }
  | { label: string; icon: IconName; menu: true; href?: undefined };

type SheetLink = { href: string; label: string };

type Props = {
  /** light = putih (situs warga), dark = gelap (SIM pengurus) */
  variant?: "light" | "dark";
  /** tepat 4 tab: 2 di kiri, 2 di kanan tombol tengah */
  tabs: [NavTab, NavTab, NavTab, NavTab];
  /** tombol "+" di tengah: langsung ke href, atau membuka daftar aksi cepat */
  fab: { label: string; href?: string; actions?: SheetLink[]; sheetTitle?: string };
  /** isi menu untuk tab bertipe menu */
  menu?: { title: string; links: SheetLink[]; footer?: ReactNode };
};

const THEME = {
  light: {
    bar: "#ffffff",
    shadow: "drop-shadow(0 10px 22px rgba(28,25,23,.14)) drop-shadow(0 1px 2px rgba(28,25,23,.08))",
    idle: "text-stone-400",
    on: "text-stone-900",
    dot: "bg-brand-600",
    sheet: "bg-white text-stone-800 shadow-xl shadow-stone-900/10 ring-1 ring-stone-200",
    sheetItem: "text-stone-700 active:bg-stone-100",
    sheetHead: "text-stone-400",
    divider: "border-stone-200",
  },
  dark: {
    bar: "#232326",
    shadow: "drop-shadow(0 12px 24px rgba(0,0,0,.35)) drop-shadow(0 1px 2px rgba(0,0,0,.3))",
    idle: "text-stone-500",
    on: "text-white",
    dot: "bg-brand-400",
    sheet: "bg-[#232326] text-stone-100 shadow-xl shadow-black/30 ring-1 ring-white/10",
    sheetItem: "text-stone-200 active:bg-white/10",
    sheetHead: "text-stone-500",
    divider: "border-white/10",
  },
} as const;

export default function BottomNav({ variant = "light", tabs, fab, menu }: Props) {
  const t = THEME[variant];
  const pathname = usePathname();
  const [sheet, setSheet] = useState<null | "fab" | "menu">(null);

  // tutup saat pindah halaman / tekan Esc
  useEffect(() => setSheet(null), [pathname]);
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const isActive = (href: string) => {
    const root = href === "/" || href === "/pengurus";
    return root ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  };

  const fabHasSheet = !!fab.actions?.length;
  const sheetLinks = sheet === "fab" ? fab.actions ?? [] : menu?.links ?? [];
  const sheetTitle = sheet === "fab" ? fab.sheetTitle ?? "Buat baru" : menu?.title ?? "Menu";

  const renderTab = (tab: NavTab) => {
    const active = tab.menu ? sheet === "menu" : isActive(tab.href);
    const cls = `relative flex h-12 w-12 items-center justify-center rounded-full transition-colors ${active ? t.on : t.idle}`;
    const inner = (
      <>
        <Icon name={tab.icon} active={active} />
        <span className="sr-only">{tab.label}</span>
        {active && <span className={`absolute bottom-0 h-1.5 w-1.5 rounded-full ${t.dot}`} />}
      </>
    );
    return (
      <li key={tab.label} className="flex justify-center">
        {tab.menu ? (
          <button type="button" className={cls} aria-expanded={sheet === "menu"} onClick={() => setSheet(sheet === "menu" ? null : "menu")}>
            {inner}
          </button>
        ) : (
          <Link href={tab.href} className={cls} aria-current={active ? "page" : undefined}>
            {inner}
          </Link>
        )}
      </li>
    );
  };

  const fabInner = (
    <>
      {variant === "light" && (
        <span className="pointer-events-none absolute -inset-2 rounded-full border-2 border-dotted border-brand-400/60" />
      )}
      <span
        className={
          variant === "light"
            ? "relative flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-[0_8px_22px_rgba(35,122,79,.5),inset_0_1px_0_rgba(255,255,255,.35)]"
            : "relative flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-brand-400 text-brand-300 shadow-[0_0_20px_rgba(85,183,131,.45),inset_0_0_12px_rgba(85,183,131,.25)]"
        }
      >
        <span className={`transition-transform duration-200 ${sheet === "fab" ? "rotate-45" : ""}`}>
          <Icon name="plus" />
        </span>
      </span>
      <span className="sr-only">{fab.label}</span>
    </>
  );
  const fabCls = "relative -translate-y-6 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2";

  return (
    <div className="md:hidden">
      {/* latar + sheet */}
      {sheet && (
        <>
          <button type="button" aria-label="Tutup" className="fixed inset-0 z-30 bg-stone-900/30 backdrop-blur-[2px]" onClick={() => setSheet(null)} />
          <div
            role="dialog"
            aria-label={sheetTitle}
            className={`sheet-in fixed inset-x-3 z-30 mx-auto max-w-md rounded-3xl p-2 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] ${t.sheet}`}
          >
            <p className={`px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider ${t.sheetHead}`}>{sheetTitle}</p>
            <ul className="max-h-[55vh] overflow-y-auto">
              {sheetLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={`block rounded-2xl px-4 py-3 text-[15px] font-medium ${t.sheetItem}`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            {sheet === "menu" && menu?.footer && <div className={`mt-1 border-t px-2 pt-3 pb-1 ${t.divider}`}>{menu.footer}</div>}
          </div>
        </>
      )}

      {/* bar */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto max-w-md"
        style={{ ["--bar" as string]: t.bar }}
      >
        <div className="relative h-16">
          <div className="absolute inset-0" style={{ filter: t.shadow }}>
            <div className="absolute inset-0 rounded-[28px]" style={{ background: "var(--bar)" }} />
            <svg
              className="absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2"
              width="128" height="23" viewBox="0 0 128 23" aria-hidden
              style={{ fill: "var(--bar)" }}
            >
              <path d="M0 23C26 23 32 0 64 0s38 23 64 23z" />
            </svg>
          </div>

          <ul className="relative grid h-full grid-cols-5 items-center">
            {renderTab(tabs[0])}
            {renderTab(tabs[1])}
            <li className="flex justify-center">
              {fabHasSheet ? (
                <button type="button" className={fabCls} aria-expanded={sheet === "fab"} onClick={() => setSheet(sheet === "fab" ? null : "fab")}>
                  {fabInner}
                </button>
              ) : (
                <Link href={fab.href ?? "/"} className={fabCls}>
                  {fabInner}
                </Link>
              )}
            </li>
            {renderTab(tabs[2])}
            {renderTab(tabs[3])}
          </ul>
        </div>
      </nav>
    </div>
  );
}
