import { Bell, BellOff, BellRing, CheckCheck, Eye, Radio, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ConnectionState } from '../hooks/useRtRealtime';
import {
  type BrowserPushState,
  detectBrowserPushState,
  sendSelfTestPush,
  subscribeWebPush,
  unsubscribeWebPush,
} from '../lib/fcm';
import { formatRelativeTime, getStatusMeta } from '../lib/format';
import type { NotificationItem } from '../types';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  watchedProposalIds: string[];
  connectionState: ConnectionState;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onInspectProposal: (proposalId: string) => void;
  topOffsetClass?: string;
}

export function NotificationDrawer({
  open,
  onClose,
  notifications,
  watchedProposalIds,
  connectionState,
  onMarkRead,
  onMarkAllRead,
  onInspectProposal,
  topOffsetClass = 'top-0 md:top-16',
}: NotificationDrawerProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'watched'>('all');
  const [pushState, setPushState] = useState<BrowserPushState>('checking');
  const [pushBusy, setPushBusy] = useState(false);
  const [pushFeedback, setPushFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setPushFeedback(null);
    detectBrowserPushState()
      .then(({ state }) => {
        if (active) setPushState(state);
      })
      .catch(() => {
        if (active) setPushState('unsupported');
      });
    return () => {
      active = false;
    };
  }, [open]);

  const handleEnablePush = async () => {
    setPushBusy(true);
    setPushFeedback(null);
    try {
      await subscribeWebPush();
      setPushState('subscribed');
      setPushFeedback('Notifikasi push berhasil diaktifkan untuk perangkat ini.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengaktifkan notifikasi push.';
      setPushFeedback(msg);
      const next = await detectBrowserPushState().catch(() => null);
      if (next) setPushState(next.state);
    } finally {
      setPushBusy(false);
    }
  };

  const handleDisablePush = async () => {
    setPushBusy(true);
    setPushFeedback(null);
    try {
      await unsubscribeWebPush();
      setPushState('prompt');
      setPushFeedback('Notifikasi push perangkat ini dinonaktifkan.');
    } finally {
      setPushBusy(false);
    }
  };

  const handleTestPush = async () => {
    setPushBusy(true);
    setPushFeedback(null);
    try {
      await sendSelfTestPush();
      setPushFeedback(
        'Tes push terkirim oleh server! Tutup/minimize tab browser jika ingin melihatnya di notification bar.'
      );
    } catch (err) {
      setPushFeedback(
        err instanceof Error ? err.message : 'Gagal mengirim tes notifikasi push.'
      );
    } finally {
      setPushBusy(false);
    }
  };

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread') return !n.read;
      if (filter === 'watched') {
        return Boolean(n.proposalId && watchedProposalIds.includes(n.proposalId));
      }
      return true;
    });
  }, [notifications, filter, watchedProposalIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-drawer-title"
      className={`fixed inset-x-0 bottom-0 ${topOffsetClass} z-30 flex justify-end bg-slate-900/40`}
      onClick={onClose}
    >
      <aside
        className="bg-white border-l border-slate-200 w-full max-w-md h-full pb-24 md:pb-0 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-800" aria-hidden="true" />
              <h2
                id="notif-drawer-title"
                className="font-display text-base font-bold text-slate-900"
              >
                Pusat Notifikasi Real-Time
              </h2>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <Radio
                className={`w-3.5 h-3.5 ${
                  connectionState === 'connected'
                    ? 'text-emerald-700'
                    : 'text-amber-600'
                }`}
                aria-hidden="true"
              />
              <span>
                {connectionState === 'connected'
                  ? 'Terhubung langsung ke pembaruan status RT'
                  : 'Menyambungkan saluran pembaruan...'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel notifikasi"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device Push Opt-In Bar */}
        {pushState !== 'checking' && (
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70">
            {pushState === 'prompt' && (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <BellRing className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
                    <span>Notifikasi Push Perangkat</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                    Terima info Agenda, Usulan Warga & Laporan Kas meski browser ditutup.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pushBusy}
                  onClick={handleEnablePush}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 disabled:opacity-60 text-white transition-colors"
                >
                  {pushBusy ? 'Memproses...' : 'Aktifkan'}
                </button>
              </div>
            )}

            {pushState === 'subscribed' && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium min-w-0">
                  <BellRing className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">Notifikasi push aktif di perangkat ini</span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    disabled={pushBusy}
                    onClick={handleTestPush}
                    className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 disabled:opacity-60"
                  >
                    Tes Push
                  </button>
                  <button
                    type="button"
                    disabled={pushBusy}
                    onClick={handleDisablePush}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
                  >
                    {pushBusy ? '...' : 'Nonaktifkan'}
                  </button>
                </div>
              </div>
            )}

            {pushState === 'denied' && (
              <div className="flex items-start gap-2 text-[11px] text-amber-800 leading-snug">
                <BellOff className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Izin notifikasi diblokir browser. Aktifkan lewat ikon pengaturan di bilah alamat untuk menerima push.
                </span>
              </div>
            )}

            {pushState === 'unconfigured' && (
              <div className="flex items-start gap-2 text-[11px] text-slate-500 leading-snug">
                <Bell className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" aria-hidden="true" />
                <span>
                  Push notifikasi perangkat siap diaktifkan setelah kunci Firebase (FCM) diisi pada pengaturan server.
                </span>
              </div>
            )}

            {pushState === 'unsupported' && (
              <div className="flex items-start gap-2 text-[11px] text-slate-500 leading-snug">
                <BellOff className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" aria-hidden="true" />
                <span>
                  Browser ini belum mendukung push notifikasi (di iPhone/iPad, tambahkan web ke Layar Utama terlebih dahulu).
                </span>
              </div>
            )}

            {pushFeedback && (
              <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">{pushFeedback}</p>
            )}
          </div>
        )}

        {/* Filter Controls */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors tabular-nums ${
                filter === 'unread'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belum Dibaca ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('watched')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'watched'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dipantau
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:text-emerald-950 whitespace-nowrap"
            >
              <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tandai Dibaca</span>
            </button>
          )}
        </div>

        {/* Notification Feed */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Tidak ada notifikasi pada kategori ini.
            </div>
          ) : (
            filtered.map((item) => {
              const statusMeta = item.status ? getStatusMeta(item.status) : null;
              const isWatched = Boolean(
                item.proposalId && watchedProposalIds.includes(item.proposalId)
              );

              return (
                <div
                  key={item.id}
                  className={`p-4 transition-colors ${
                    item.read ? 'bg-white' : 'bg-emerald-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      {!item.read && (
                        <span className="font-semibold text-emerald-800">BARU</span>
                      )}
                      {statusMeta && (
                        <span className={`font-semibold ${statusMeta.textClass}`}>
                          {statusMeta.label}
                        </span>
                      )}
                      {isWatched && (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Eye className="w-3 h-3" aria-hidden="true" />
                          Dipantau
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>

                  <h3 className="mt-1 text-sm font-semibold text-slate-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {item.message}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    {item.proposalId ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!item.read) onMarkRead(item.id);
                          onInspectProposal(item.proposalId!);
                          onClose();
                        }}
                        className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
                      >
                        Lihat Progress Usulan →
                      </button>
                    ) : (
                      <span />
                    )}

                    {!item.read && (
                      <button
                        type="button"
                        onClick={() => onMarkRead(item.id)}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
