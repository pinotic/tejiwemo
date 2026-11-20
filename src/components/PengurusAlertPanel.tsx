import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  HeartHandshake,
  MapPin,
  Radio,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { authFetch } from '../lib/auth';
import { formatRelativeTime } from '../lib/format';
import type {
  AuthUser,
  SiteSettings,
  UrgentAlertCategory,
  UrgentAlertItem,
} from '../types';

interface PengurusAlertPanelProps {
  authUser: AuthUser;
  siteSettings: SiteSettings;
  alerts: UrgentAlertItem[];
}

const CATEGORY_CONFIG: Record<
  UrgentAlertCategory,
  {
    label: string;
    shortDesc: string;
    defaultTitle: string;
    placeholderMsg: string;
    buttonBg: string;
    activeCard: string;
    surfaceBg: string;
    textAccent: string;
    icon: typeof Flame;
  }
> = {
  kebakaran: {
    label: 'Kebakaran',
    shortDesc: 'Api, korsleting, asap tebal',
    defaultTitle: 'Siaga Darurat Kebakaran',
    placeholderMsg:
      'Contoh: Terjadi kebakaran di rumah Blok C-04. Mohon warga sekitar segera membantu evakuasi, menjauhkan kendaraan, dan menyiapkan APAR/air.',
    buttonBg: 'bg-red-700 hover:bg-red-800 text-white',
    activeCard: 'border-red-600 bg-red-50 text-red-950',
    surfaceBg: 'bg-red-50 border-red-200',
    textAccent: 'text-red-800',
    icon: Flame,
  },
  bencana: {
    label: 'Bencana',
    shortDesc: 'Banjir, angin kencang, gempa',
    defaultTitle: 'Peringatan Darurat Bencana',
    placeholderMsg:
      'Contoh: Debit air selokan meluap di Gang Anggrek. Warga diimbau mengamankan barang elektronik dan menuju titik kumpul Balai Warga.',
    buttonBg: 'bg-amber-700 hover:bg-amber-800 text-white',
    activeCard: 'border-amber-600 bg-amber-50 text-amber-950',
    surfaceBg: 'bg-amber-50 border-amber-200',
    textAccent: 'text-amber-900',
    icon: AlertTriangle,
  },
  kematian: {
    label: 'Kematian',
    shortDesc: 'Berita duka & takziah warga',
    defaultTitle: 'Berita Duka Warga',
    placeholderMsg:
      'Contoh: Innalillahi wa inna ilaihi rajiun. Jenazah disemayamkan di rumah duka Blok B-07 dan rencana dimakamkan pukul 13.00 WIB.',
    buttonBg: 'bg-slate-900 hover:bg-slate-800 text-white',
    activeCard: 'border-slate-900 bg-slate-100 text-slate-950',
    surfaceBg: 'bg-slate-100 border-slate-300',
    textAccent: 'text-slate-900',
    icon: HeartHandshake,
  },
};

export function PengurusAlertPanel({
  authUser,
  siteSettings,
  alerts,
}: PengurusAlertPanelProps) {
  const [category, setCategory] = useState<UrgentAlertCategory>('kebakaran');
  const [deceasedName, setDeceasedName] = useState('');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const selectedMeta = CATEGORY_CONFIG[category];
  const activeAlerts = alerts.filter((a) => a.active);
  const resolvedAlerts = alerts.filter((a) => !a.active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!message.trim()) {
      setFeedback({
        kind: 'err',
        text: 'Pesan atau instruksi darurat wajib diisi sebelum menyiarkan alert.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await authFetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          title: title.trim() || undefined,
          deceasedName: category === 'kematian' ? deceasedName.trim() || undefined : undefined,
          location: location.trim() || undefined,
          message: message.trim(),
        }),
      });
      const data = (await res.json()) as { alert?: UrgentAlertItem; error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyiarkan alert prioritas.');
      }

      setTitle('');
      setDeceasedName('');
      setLocation('');
      setMessage('');
      setFeedback({
        kind: 'ok',
        text: `Alert ${selectedMeta.label} berhasil disiarkan ke laman warga & push notifikasi perangkat.`,
      });
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan saat mengirim alert.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (alert: UrgentAlertItem, nextActive: boolean) => {
    setFeedback(null);
    setBusyId(alert.id);
    try {
      const res = await authFetch(`/api/alerts/${alert.id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextActive }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui status alert.');
      }
      setFeedback({
        kind: 'ok',
        text: nextActive
          ? 'Alert kembali diaktifkan pada laman warga.'
          : 'Alert ditandai selesai dan banner darurat pada laman warga ditutup.',
      });
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Gagal memperbarui status alert.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setFeedback(null);
    setBusyId(id);
    try {
      const res = await authFetch(`/api/alerts/${id}`, {
        method: 'DELETE',
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus riwayat alert.');
      }
      setConfirmDeleteId(null);
      setFeedback({ kind: 'ok', text: 'Riwayat alert berhasil dihapus.' });
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Gagal menghapus riwayat alert.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const renderAlertCard = (item: UrgentAlertItem) => {
    const meta = CATEGORY_CONFIG[item.category];
    const Icon = meta.icon;
    const isBusy = busyId === item.id;

    return (
      <div
        key={item.id}
        className={`rounded-xl border p-4 space-y-2.5 ${
          item.active ? meta.surfaceBg : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div
              className={`flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                item.active ? meta.textAccent : 'text-slate-500'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{meta.label}</span>
              <span aria-hidden="true">·</span>
              <span>{item.active ? 'Aktif di Portal Warga' : 'Sudah Selesai'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-normal normal-case tracking-normal">
                {formatRelativeTime(item.createdAt)}
              </span>
            </div>
            <h4 className="font-display text-sm font-bold text-slate-900">{item.title}</h4>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {item.active ? (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleToggleActive(item, false)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-900 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Tandai Selesai</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isBusy}
                onClick={() => handleToggleActive(item, true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Aktifkan Lagi</span>
              </button>
            )}

            {confirmDeleteId === item.id ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDelete(item.id)}
                  className="px-2 py-1.5 text-xs font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg"
                >
                  Hapus
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-2 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                type="button"
                aria-label={`Hapus alert ${item.title}`}
                onClick={() => setConfirmDeleteId(item.id)}
                className="p-1.5 text-slate-500 hover:text-red-700 bg-white border border-slate-200 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {item.category === 'kematian' && item.deceasedName && (
          <div className="px-3 py-2 bg-white/90 border border-slate-300 rounded-lg text-xs text-slate-900">
            <span className="text-slate-500">Almarhum / Almarhumah:</span>{' '}
            <span className="font-bold">{item.deceasedName}</span>
          </div>
        )}

        {item.location && (
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
            <span>{item.location}</span>
          </div>
        )}

        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
          {item.message}
        </p>

        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/70">
          Disiarkan oleh <span className="font-medium text-slate-700">{item.createdBy}</span>
          {item.resolvedAt && (
            <>
              {' '}
              · Diselesaikan {formatRelativeTime(item.resolvedAt)}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Form Broadcast Alert Prioritas */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-800">
            <Radio className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Siaran Darurat Khusus Pengurus · {siteSettings.regionCode}</span>
          </div>
          <h3 className="font-display text-base font-bold text-slate-900">
            Kirim Alert Prioritas ke Warga
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Alert langsung memunculkan jendela peringatan mendesak di portal warga serta
            mengirim notifikasi push prioritas tinggi ke seluruh perangkat terdaftar.
          </p>
        </div>

        {feedback && (
          <div
            role="status"
            className={`px-3.5 py-2.5 rounded-lg border text-xs leading-relaxed ${
              feedback.kind === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div>
          <span className="block text-xs font-medium text-slate-700 mb-2">
            Pilih Kategori Alert
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['kebakaran', 'bencana', 'kematian'] as UrgentAlertCategory[]).map((key) => {
              const cfg = CATEGORY_CONFIG[key];
              const Icon = cfg.icon;
              const isSelected = category === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setCategory(key);
                    setFeedback(null);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? cfg.activeCard
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1.5" aria-hidden="true" />
                  <div className="text-xs font-bold">{cfg.label}</div>
                  <div className="text-[10px] leading-snug opacity-80 mt-0.5">
                    {cfg.shortDesc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {category === 'kematian' && (
          <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg space-y-1.5">
            <label
              htmlFor="alert-deceased-name"
              className="block text-xs font-semibold text-slate-900"
            >
              Nama Almarhum / Almarhumah (Opsional)
            </label>
            <input
              id="alert-deceased-name"
              type="text"
              value={deceasedName}
              onChange={(e) => setDeceasedName(e.target.value)}
              placeholder="Contoh: Bpk. H. Sugiono (Blok B-07)"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <p className="text-[11px] text-slate-500">
              Ditampilkan secara khusus pada judul & kotak informasi berita duka warga.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="alert-title" className="block text-xs font-medium text-slate-700 mb-1">
            Judul Singkat (Opsional)
          </label>
          <input
            id="alert-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              category === 'kematian' && deceasedName.trim()
                ? `Berita Duka: ${deceasedName.trim()}`
                : selectedMeta.defaultTitle
            }
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div>
          <label htmlFor="alert-location" className="block text-xs font-medium text-slate-700 mb-1">
            Lokasi / Blok Kejadian (Opsional)
          </label>
          <input
            id="alert-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Contoh: Blok C-04 / Gang Anggrek"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div>
          <label htmlFor="alert-message" className="block text-xs font-medium text-slate-700 mb-1">
            Pesan & Instruksi Warga
          </label>
          <textarea
            id="alert-message"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={selectedMeta.placeholderMsg}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        <div className="text-[11px] text-slate-500">
          Pengirim tercatat sebagai{' '}
          <span className="font-semibold text-slate-700">{authUser.displayName}</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${selectedMeta.buttonBg}`}
        >
          <selectedMeta.icon className="w-4 h-4" aria-hidden="true" />
          <span>
            {submitting
              ? 'Menyiarkan Alert...'
              : `Siarkan Alert ${selectedMeta.label} Sekarang`}
          </span>
        </button>
      </form>

      {/* Daftar Alert Aktif & Riwayat */}
      <div className="lg:col-span-7 space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">
                Alert Sedang Aktif
              </h3>
              <p className="text-xs text-slate-500">
                Banner darurat tetap tampil di laman warga sampai pengurus menekan Tandai Selesai.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums">
              {activeAlerts.length} aktif
            </span>
          </div>

          {activeAlerts.length === 0 ? (
            <div className="py-6 px-4 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
              Tidak ada alert darurat aktif saat ini. Situasi lingkungan terpantau kondusif.
            </div>
          ) : (
            <div className="space-y-3">{activeAlerts.map(renderAlertCard)}</div>
          )}
        </div>

        {resolvedAlerts.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-bold text-slate-900">
                Riwayat Alert Selesai
              </h3>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                {resolvedAlerts.length} arsip
              </span>
            </div>
            <div className="space-y-3">{resolvedAlerts.map(renderAlertCard)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
