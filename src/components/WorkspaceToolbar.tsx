import { Bell, LockKeyhole, Radio, Shield, ShieldCheck, WifiOff } from 'lucide-react';
import type { ConnectionState } from '../hooks/useRtRealtime';
import type { AuthUser } from '../types';

interface WorkspaceToolbarProps {
  regionIdentity?: string;
  authUser: AuthUser | null;
  onOpenPengurusPortal: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  connectionState: ConnectionState;
}

export function WorkspaceToolbar({
  regionIdentity = 'RT 01 / RW 05 · Kelurahan Dinoyo',
  authUser,
  onOpenPengurusPortal,
  unreadCount,
  onOpenNotifications,
  connectionState,
}: WorkspaceToolbarProps) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Civic Region & Real-Time WebSocket Connection Telemetry */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span className="font-medium text-slate-800">{regionIdentity}</span>
          <span aria-hidden="true" className="text-slate-300">
            /
          </span>
          <span className="inline-flex items-center gap-1.5">
            {connectionState === 'connected' ? (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                <span className="text-emerald-800 font-medium">
                  Pemantauan Real-Time Aktif
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                <span className="text-amber-700 font-medium">
                  {connectionState === 'connecting'
                    ? 'Menghubungkan...'
                    : 'Menyambung ulang...'}
                </span>
              </>
            )}
          </span>
        </div>

        {/* Citizen Actions: Notification Trigger + Dedicated Pengurus Portal Entry */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label={`Buka notifikasi real-time, ${unreadCount} belum dibaca`}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <Bell className="w-4 h-4 text-emerald-800" aria-hidden="true" />
            <span>Notifikasi</span>
            {unreadCount > 0 && (
              <span className="font-mono tabular-nums px-1.5 py-0.5 text-[11px] font-semibold bg-emerald-800 text-white rounded">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenPengurusPortal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 hover:border-emerald-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            {authUser ? (
              authUser.role === 'superadmin' ? (
                <>
                  <Shield className="w-3.5 h-3.5 text-emerald-800" aria-hidden="true" />
                  <span>Panel Superadmin</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" aria-hidden="true" />
                  <span>Laman Pengurus</span>
                </>
              )
            ) : (
              <>
                <LockKeyhole className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
                <span>Masuk Pengurus</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
