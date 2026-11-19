import { Bell, X } from 'lucide-react';
import { getStatusMeta } from '../lib/format';
import type { NotificationItem } from '../types';

interface LiveToastStackProps {
  toasts: NotificationItem[];
  onDismiss: (id: string) => void;
  onInspectProposal: (proposalId: string) => void;
}

export function LiveToastStack({
  toasts,
  onDismiss,
  onInspectProposal,
}: LiveToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-24 md:bottom-4 right-4 z-50 flex flex-col gap-2.5 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => {
        const statusMeta = toast.status ? getStatusMeta(toast.status) : null;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white border border-slate-200 shadow-lg rounded-xl p-4 flex items-start gap-3"
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
                  onClick={() => onDismiss(toast.id)}
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
              {toast.proposalId && (
                <button
                  type="button"
                  onClick={() => {
                    onInspectProposal(toast.proposalId!);
                    onDismiss(toast.id);
                  }}
                  className="mt-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
                >
                  Pantau Progress →
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
