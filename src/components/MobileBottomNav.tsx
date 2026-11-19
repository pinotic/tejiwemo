import {
  Bell,
  CalendarDays,
  ClipboardList,
  Home,
  LockKeyhole,
  Newspaper,
  Plus,
  Shield,
  ShieldCheck,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { AuthUser } from '../types';
import type { NavTab } from './TopBar';

interface MobileBottomNavProps {
  regionCode?: string;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenProposalForm: () => void;
  onOpenNotifications: () => void;
  notificationsOpen: boolean;
  unreadCount: number;
  authUser: AuthUser | null;
  onOpenPengurusPortal: () => void;
}

const SHEET_TABS: Array<{ id: NavTab; label: string; icon: typeof Home }> = [
  { id: 'ringkasan', label: 'Home', icon: Home },
  { id: 'berita', label: 'Berita', icon: Newspaper },
  { id: 'kas', label: 'Kas Divisi', icon: Wallet },
  { id: 'usulan', label: 'Usulan Warga', icon: ClipboardList },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
];

export function MobileBottomNav({
  regionCode = 'RT 01 / RW 05',
  activeTab,
  onSelectTab,
  onOpenProposalForm,
  onOpenNotifications,
  notificationsOpen,
  unreadCount,
  authUser,
  onOpenPengurusPortal,
}: MobileBottomNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isMenuSectionActive =
    menuOpen ||
    activeTab === 'berita' ||
    activeTab === 'kas' ||
    activeTab === 'usulan';

  const handleNav = (tab: NavTab) => {
    onSelectTab(tab);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Backdrop + Quick Menu Sheet for other tabs & dedicated Pengurus portal link */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
          />

          <div
            role="dialog"
            aria-label="Menu navigasi portal warga"
            className="absolute bottom-[92px] left-3 right-3 max-w-[440px] mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  Menu Portal {regionCode}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pilih halaman warga atau masuk ke laman pengurus
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Tutup menu"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SHEET_TABS.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleNav(id)}
                    className={`min-h-[44px] px-3 py-2.5 rounded-xl border text-left flex items-center gap-2.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-600 pl-1">
                Akses Pengurus
              </span>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenPengurusPortal();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                {authUser ? (
                  authUser.role === 'superadmin' ? (
                    <>
                      <Shield className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                      <span>Buka Superadmin</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                      <span>Buka Laman Pengurus</span>
                    </>
                  )
                ) : (
                  <>
                    <LockKeyhole className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span>Login Pengurus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Curved Bottom Navigation Bar (Mobile Only - Dark Theme with Emerald Accent) */}
      <nav
        aria-label="Navigasi seluler utama"
        className="md:hidden fixed bottom-3 left-3 right-3 z-40 max-w-[440px] mx-auto h-[72px]"
      >
        {/* Curved Pill Silhouette with Central Wave Crest */}
        <svg
          viewBox="0 0 360 74"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-[0_14px_28px_rgba(15,23,42,0.28)]"
        >
          <path
            d="M31 13 H124 C147 13, 156 2, 180 2 C204 2, 213 13, 236 13 H329 A30 30 0 0 1 329 73 H31 A30 30 0 0 1 31 13 Z"
            fill="#181A1F"
            stroke="#2A2E37"
            strokeWidth="0.9"
          />
        </svg>

        <div className="relative z-10 grid grid-cols-5 items-center h-full pt-[10px] px-2">
          {/* Slot 1: Home */}
          <button
            type="button"
            onClick={() => handleNav('ringkasan')}
            aria-label="Home"
            aria-current={activeTab === 'ringkasan' ? 'page' : undefined}
            className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Home
              className={`w-[21px] h-[21px] transition-colors ${
                activeTab === 'ringkasan'
                  ? 'text-white fill-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              strokeWidth={activeTab === 'ringkasan' ? 2 : 1.75}
              aria-hidden="true"
            />
            <span
              className={`mt-1 w-1.5 h-1.5 rounded-full transition-opacity ${
                activeTab === 'ringkasan'
                  ? 'bg-emerald-400 opacity-100'
                  : 'opacity-0'
              }`}
              aria-hidden="true"
            />
          </button>

          {/* Slot 2: Agenda (Calendar Icon) */}
          <button
            type="button"
            onClick={() => handleNav('agenda')}
            aria-label="Agenda"
            aria-current={activeTab === 'agenda' ? 'page' : undefined}
            className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <CalendarDays
              className={`w-[21px] h-[21px] transition-colors ${
                activeTab === 'agenda'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              strokeWidth={activeTab === 'agenda' ? 2.25 : 1.75}
              aria-hidden="true"
            />
            <span
              className={`mt-1 w-1.5 h-1.5 rounded-full transition-opacity ${
                activeTab === 'agenda' ? 'bg-emerald-400 opacity-100' : 'opacity-0'
              }`}
              aria-hidden="true"
            />
          </button>

          {/* Slot 3: Center Circular + Button (Ajukan Usulan) */}
          <div className="flex items-center justify-center -mt-3.5">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onOpenProposalForm();
              }}
              aria-label="Ajukan Usulan Baru"
              className="relative w-12 h-12 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 active:scale-95 transition-transform"
            >
              <span className="w-11 h-11 rounded-full bg-[#1F222A] text-emerald-400 ring-2 ring-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.45)] flex items-center justify-center">
                <Plus className="w-5 h-5" strokeWidth={2.25} aria-hidden="true" />
              </span>
            </button>
          </div>

          {/* Slot 4: Notifikasi (Bell) */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onOpenNotifications();
            }}
            aria-label={`Notifikasi, ${unreadCount} belum dibaca`}
            className="relative min-h-[44px] min-w-[44px] flex flex-col items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <div className="relative">
              <Bell
                className={`w-[21px] h-[21px] transition-colors ${
                  notificationsOpen
                    ? 'text-white fill-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                strokeWidth={notificationsOpen ? 2 : 1.75}
                aria-hidden="true"
              />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#181A1F]"
                />
              )}
            </div>
            <span
              className={`mt-1 w-1.5 h-1.5 rounded-full transition-opacity ${
                notificationsOpen ? 'bg-emerald-400 opacity-100' : 'opacity-0'
              }`}
              aria-hidden="true"
            />
          </button>

          {/* Slot 5: Menu & Portal Pengurus */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Menu halaman dan akses pengurus"
            aria-expanded={menuOpen}
            className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <User
              className={`w-[21px] h-[21px] transition-colors ${
                isMenuSectionActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              strokeWidth={isMenuSectionActive ? 2.25 : 1.75}
              aria-hidden="true"
            />
            <span
              className={`mt-1 w-1.5 h-1.5 rounded-full transition-opacity ${
                isMenuSectionActive ? 'bg-emerald-400 opacity-100' : 'opacity-0'
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>
    </>
  );
}
