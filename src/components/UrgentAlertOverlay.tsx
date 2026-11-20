import {
  AlertTriangle,
  ChevronRight,
  Flame,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import { formatRelativeTime } from '../lib/format';
import type { UrgentAlertCategory, UrgentAlertItem } from '../types';

const ALERT_THEME: Record<
  UrgentAlertCategory,
  {
    kicker: string;
    bannerWrap: string;
    bannerTitle: string;
    bannerBtn: string;
    modalHeader: string;
    modalSub: string;
    modalCta: string;
    icon: typeof Flame;
  }
> = {
  kebakaran: {
    kicker: 'SIAGA DARURAT KEBAKARAN',
    bannerWrap: 'bg-red-700 border-b border-red-800 text-white',
    bannerTitle: 'text-white',
    bannerBtn: 'bg-white text-red-800 hover:bg-red-50',
    modalHeader: 'bg-red-700 text-white',
    modalSub: 'text-red-100',
    modalCta: 'bg-red-700 hover:bg-red-800 text-white',
    icon: Flame,
  },
  bencana: {
    kicker: 'PERINGATAN DARURAT BENCANA',
    bannerWrap: 'bg-amber-600 border-b border-amber-700 text-white',
    bannerTitle: 'text-white',
    bannerBtn: 'bg-white text-amber-900 hover:bg-amber-50',
    modalHeader: 'bg-amber-600 text-white',
    modalSub: 'text-amber-50',
    modalCta: 'bg-amber-700 hover:bg-amber-800 text-white',
    icon: AlertTriangle,
  },
  kematian: {
    kicker: 'BERITA DUKA / KEMATIAN WARGA',
    bannerWrap: 'bg-slate-900 border-b border-slate-950 text-white',
    bannerTitle: 'text-white',
    bannerBtn: 'bg-white text-slate-900 hover:bg-slate-100',
    modalHeader: 'bg-slate-900 text-white',
    modalSub: 'text-slate-300',
    modalCta: 'bg-slate-900 hover:bg-slate-800 text-white',
    icon: HeartHandshake,
  },
};

interface ActiveAlertBannerProps {
  activeAlerts: UrgentAlertItem[];
  onOpenAlert: (alertId: string) => void;
}

export function ActiveAlertBanner({
  activeAlerts,
  onOpenAlert,
}: ActiveAlertBannerProps) {
  if (activeAlerts.length === 0) return null;

  const latest = activeAlerts[0];
  const theme = ALERT_THEME[latest.category];
  const Icon = theme.icon;

  return (
    <section
      aria-label="Peringatan prioritas aktif"
      className={theme.bannerWrap}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-white/15 shrink-0">
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold tracking-wide uppercase opacity-95">
              <span>{theme.kicker}</span>
              <span aria-hidden="true">·</span>
              <span className="font-normal normal-case tracking-normal">
                {formatRelativeTime(latest.createdAt)}
              </span>
              {activeAlerts.length > 1 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>+{activeAlerts.length - 1} alert aktif lainnya</span>
                </>
              )}
            </div>
            <div className={`font-display text-sm sm:text-base font-bold truncate ${theme.bannerTitle}`}>
              {latest.title}
              {latest.category === 'kematian' && latest.deceasedName
                ? ` — Alm./Almh. ${latest.deceasedName}`
                : ''}
            </div>
            <p className="text-xs opacity-95 line-clamp-1 mt-0.5">
              {latest.location ? `${latest.location} · ` : ''}
              {latest.message}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenAlert(latest.id)}
          className={`inline-flex items-center justify-center gap-1 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors shrink-0 whitespace-nowrap ${theme.bannerBtn}`}
        >
          <span>Lihat Instruksi</span>
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

interface UrgentAlertModalProps {
  alert: UrgentAlertItem | null;
  activeCount: number;
  regionIdentity: string;
  onAcknowledge: (alertId: string) => void;
}

export function UrgentAlertModal({
  alert,
  activeCount,
  regionIdentity,
  onAcknowledge,
}: UrgentAlertModalProps) {
  useEffect(() => {
    if (!alert) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onAcknowledge(alert.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alert, onAcknowledge]);

  if (!alert) return null;

  const theme = ALERT_THEME[alert.category];
  const Icon = theme.icon;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="urgent-alert-modal-title"
      aria-describedby="urgent-alert-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-lg bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-2xl">
        {/* Urgent Header */}
        <div className={`px-5 py-4 flex items-start justify-between gap-3 ${theme.modalHeader}`}>
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-white/15 shrink-0">
              <Icon className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider">
                {theme.kicker}
              </div>
              <div className={`text-xs mt-0.5 ${theme.modalSub}`}>
                {regionIdentity} · {formatRelativeTime(alert.createdAt)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAcknowledge(alert.id)}
            aria-label="Tutup jendela alert"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-1">
            <h2
              id="urgent-alert-modal-title"
              className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-snug"
            >
              {alert.title}
            </h2>
            {!alert.active && (
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Status alert ini telah ditandai selesai oleh pengurus</span>
              </div>
            )}
          </div>

          {alert.category === 'kematian' && alert.deceasedName && (
            <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl flex items-start gap-2.5">
              <User className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Almarhum / Almarhumah
                </div>
                <div className="font-display text-base font-bold text-slate-900">
                  {alert.deceasedName}
                </div>
              </div>
            </div>
          )}

          {alert.location && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800">
              <MapPin className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
              <span>
                <span className="text-slate-500">Lokasi:</span>{' '}
                <span className="font-semibold">{alert.location}</span>
              </span>
            </div>
          )}

          <p
            id="urgent-alert-modal-desc"
            className="text-sm text-slate-800 leading-relaxed whitespace-pre-line"
          >
            {alert.message}
          </p>

          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Disiarkan oleh <span className="font-semibold text-slate-800">{alert.createdBy}</span>
              {activeCount > 1 && ` · ${activeCount} alert aktif`}
            </div>

            <button
              type="button"
              onClick={() => onAcknowledge(alert.id)}
              className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${theme.modalCta}`}
            >
              Saya Mengerti & Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
