import { Bell, X } from 'lucide-react';
import { getStatusMeta } from '../lib/format';
import type { NotificationItem } from '../types';

interface LiveToastStackProps {
  toasts: NotificationItem[];
  onDismiss: (id: string) => void;
  onOpenNotification: (notification: NotificationItem) => void;
}

export function LiveToastStack({
  toasts,
  onDismiss,
  onOpenNotification,
}: LiveToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-24 md:bottom-4 right-4 z-50 flex flex-col gap-2.5 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => {
        const statusMeta = toast.status ? getStatusMeta(toast.status) : null;
        const actionLabel =
          toast.type === 'agenda_new'
            ? 'Lihat Agenda →'
            : toast.type === 'treasury_new'
              ? 'Lihat Laporan Kas →'
              : 'Pantau Progress →';

        return (
          <div
            key={toast.id}
            onClick={() => {
              onOpenNotification(toast);
              onDismiss(toast.id);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenNotification(toast);
                onDismiss(toast.id);
              }
            }}
            className="pointer-events-auto cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 shadow-lg rounded-xl p-4 flex items-start gap-3 transition-colors"
          >
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg shrink-0">
              <Bell className="w-4 h-4" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-emerald-800">
                  Pembaruan Real-Time
                  {statusMeta ? ` · ${statusMeta.label}` : ''}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(toast.id);
                  }}
                  aria-label="Tutup notifikasi"
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-slate-900 leading-snug">
                {toast.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                {toast.message}
              </p>
              <span className="mt-2 inline-block text-xs font-semibold text-emerald-800">
                {actionLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
