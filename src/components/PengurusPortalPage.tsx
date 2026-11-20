import {
  ArrowLeft,
  Bell,
  LogOut,
  Radio,
  WifiOff,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ConnectionState } from '../hooks/useRtRealtime';
import { formatRupiah } from '../lib/format';
import type { AuthUser, RtSnapshotState } from '../types';
import {
  type DashboardTool,
  PENGURUS_TOOL_ITEMS,
  PengurusDashboardPanel,
} from './PengurusDashboardPanel';

interface PengurusPortalPageProps {
  authUser: AuthUser;
  state: RtSnapshotState;
  connectionState: ConnectionState;
  unreadCount: number;
  initialTool?: DashboardTool;
  onOpenNotifications: () => void;
  onBackToWarga: () => void;
  onLogout: () => void;
}

export function PengurusPortalPage({
  authUser,
  state,
  connectionState,
  unreadCount,
  initialTool,
  onOpenNotifications,
  onBackToWarga,
  onLogout,
}: PengurusPortalPageProps) {
  const [activeTool, setActiveTool] = useState<DashboardTool>(
    initialTool || (authUser.role === 'superadmin' ? 'akun_pengurus' : 'input_kas')
  );

  const availableTools = useMemo(
    () =>
      PENGURUS_TOOL_ITEMS.filter(
        (item) => !item.superadminOnly || authUser.role === 'superadmin'
      ),
    [authUser.role]
  );

  const pengurusTools = availableTools.filter((t) => !t.superadminOnly);
  const superadminTools = availableTools.filter((t) => t.superadminOnly);

  const totalKasBalance = useMemo(
    () =>
      state.treasury.reduce(
        (acc, t) => acc + (t.type === 'pemasukan' ? t.amount : -t.amount),
        0
      ),
    [state.treasury]
  );

  const activeToolMeta =
    availableTools.find((t) => t.id === activeTool) || availableTools[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900">
      {/* Dedicated Pengurus / Superadmin Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/assets/aistudio/500309821_1300971965363211_2221899409798109426_n__1__55125c15.png"
              alt={`Logo ${state.siteSettings.webTitle}`}
              className="h-9 sm:h-10 w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="font-display text-sm sm:text-base font-bold text-slate-900 truncate">
                {authUser.role === 'superadmin'
                  ? `Portal Superadmin & Pengurus · ${state.siteSettings.regionCode}`
                  : `Laman Pengurus ${state.siteSettings.regionCode}`}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                <span className="font-medium text-slate-700">{authUser.displayName}</span>
                <span aria-hidden="true">·</span>
                <span>{state.siteSettings.regionIdentity}</span>
                <span aria-hidden="true" className="hidden sm:inline">
                  ·
                </span>
                <span className="hidden sm:inline-flex items-center gap-1">
                  {connectionState === 'connected' ? (
                    <>
                      <Radio className="w-3 h-3 text-emerald-700" aria-hidden="true" />
                      <span className="text-emerald-800 font-medium">Real-Time Aktif</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-amber-600" aria-hidden="true" />
                      <span className="text-amber-700">Menyambung...</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onBackToWarga}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Laman Warga</span>
              <span className="sm:hidden">Warga</span>
            </button>

            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label={`Notifikasi, ${unreadCount} belum dibaca`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-800" aria-hidden="true" />
              <span className="hidden sm:inline">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="font-mono tabular-nums px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-800 text-white rounded">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1320px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Compact Real-Time KPI Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">Total Saldo Kas RT</div>
            <div className="mt-1 font-mono text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
              {formatRupiah(totalKasBalance)}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">Agenda Terjadwal</div>
            <div className="mt-1 font-mono text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
              {state.agenda.length} kegiatan
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">Berita Terbit</div>
            <div className="mt-1 font-mono text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
              {state.news.length} berita
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="text-xs text-slate-500">Usulan Warga</div>
            <div className="mt-1 font-mono text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
              {state.proposals.length} usulan
            </div>
          </div>
        </div>

        {/* SaaS Sidebar + Active Management Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-4">
              <div>
                <div className="px-2.5 pb-2 text-[11px] font-semibold text-slate-500">
                  Manajemen Pengurus RT
                </div>
                <nav
                  aria-label="Navigasi menu pengurus"
                  className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0"
                >
                  {pengurusTools.map(({ id, label, icon: Icon }) => {
                    const isActive = activeTool === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActiveTool(id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 text-left ${
                          isActive
                            ? 'bg-emerald-800 text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {superadminTools.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="px-2.5 pb-2 text-[11px] font-semibold text-emerald-800">
                    Menu Khusus Superadmin
                  </div>
                  <nav
                    aria-label="Navigasi menu superadmin"
                    className="flex lg:flex-col gap-1"
                  >
                    {superadminTools.map(({ id, label, icon: Icon }) => {
                      const isActive = activeTool === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setActiveTool(id)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 text-left ${
                            isActive
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              )}
            </div>
          </aside>

          {/* Main Management Viewport */}
          <div className="lg:col-span-9 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h1 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                  {activeToolMeta.label}
                </h1>
                <p className="text-xs text-slate-600">{activeToolMeta.description}</p>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Hak akses:{' '}
                <span className="font-semibold text-slate-800">
                  {authUser.role === 'superadmin'
                    ? 'Superadmin (Akses Penuh)'
                    : 'Pengurus RT'}
                </span>
              </div>
            </div>

            <PengurusDashboardPanel
              authUser={authUser}
              activeTool={activeTool}
              siteSettings={state.siteSettings}
              hero={state.hero}
              officials={state.officials}
              divisions={state.divisions}
              treasury={state.treasury}
              agenda={state.agenda}
              news={state.news}
              notulen={state.notulen}
              proposals={state.proposals}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
