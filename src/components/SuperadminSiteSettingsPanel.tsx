import { CheckCircle2, Globe, MapPin, Type } from 'lucide-react';
import { useEffect, useState } from 'react';
import { authFetch } from '../lib/auth';
import type { SiteSettings } from '../types';

interface SuperadminSiteSettingsPanelProps {
  siteSettings: SiteSettings;
}

export function SuperadminSiteSettingsPanel({
  siteSettings,
}: SuperadminSiteSettingsPanelProps) {
  const [webTitle, setWebTitle] = useState(siteSettings.webTitle);
  const [regionIdentity, setRegionIdentity] = useState(siteSettings.regionIdentity);
  const [regionCode, setRegionCode] = useState(siteSettings.regionCode);
  const [locationName, setLocationName] = useState(siteSettings.locationName);
  const [syncHeroEyebrow, setSyncHeroEyebrow] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    setWebTitle(siteSettings.webTitle);
    setRegionIdentity(siteSettings.regionIdentity);
    setRegionCode(siteSettings.regionCode);
    setLocationName(siteSettings.locationName);
  }, [siteSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const res = await authFetch('/api/site-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webTitle,
          regionIdentity,
          regionCode,
          locationName,
          syncHeroEyebrow,
        }),
      });
      const data = (await res.json()) as {
        siteSettings?: SiteSettings;
        error?: string;
      };
      if (!res.ok || !data.siteSettings) {
        throw new Error(data.error || 'Gagal menyimpan pengaturan judul & identitas web.');
      }
      setFeedback({
        kind: 'ok',
        text: 'Judul web dan identitas wilayah berhasil diperbarui ke seluruh portal secara real-time.',
      });
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan.',
      });
    } finally {
      setSaving(false);
    }
  };

  const previewTitle = `${webTitle.trim() || 'Portal Warga'} · ${
    regionIdentity.trim() || 'RT 01 / RW 05 Dinoyo - Malang'
  }`;

  return (
    <div className="p-5 sm:p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Globe className="w-4 h-4 text-emerald-800" aria-hidden="true" />
          <span>Pengaturan Judul Web &amp; Identitas Wilayah</span>
        </div>
        <p className="mt-1 text-xs text-slate-600">
          Perubahan di sini otomatis diterapkan ke navbar atas, tab browser, toolbar warga,
          judul seksi berita/agenda, halaman login, dan footer portal.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3 text-xs rounded-lg border flex items-center gap-2 ${
            feedback.kind === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.kind === 'ok' && (
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div>
            <label
              htmlFor="site-web-title"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Judul Web (Logo Teks Navbar &amp; Nama Portal)
            </label>
            <div className="relative">
              <Type
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="site-web-title"
                type="text"
                required
                maxLength={60}
                value={webTitle}
                onChange={(e) => setWebTitle(e.target.value)}
                placeholder="Contoh: Portal Warga Dinoyo"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="site-region-identity"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Tulisan Identitas Wilayah (Toolbar, Tab Browser &amp; Footer)
            </label>
            <div className="relative">
              <MapPin
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="site-region-identity"
                type="text"
                required
                maxLength={100}
                value={regionIdentity}
                onChange={(e) => setRegionIdentity(e.target.value)}
                placeholder="Contoh: RT 01/ RW 05 Dinoyo - Malang"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="site-region-code"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Kode Singkat RT/RW (Judul Seksi)
              </label>
              <input
                id="site-region-code"
                type="text"
                required
                maxLength={40}
                value={regionCode}
                onChange={(e) => setRegionCode(e.target.value)}
                placeholder="Contoh: RT 01 / RW 05"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label
                htmlFor="site-location-name"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nama Sekretariat / Wilayah (Footer)
              </label>
              <input
                id="site-location-name"
                type="text"
                required
                maxLength={90}
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Contoh: Balai Warga Dinoyo - Malang"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={syncHeroEyebrow}
              onChange={(e) => setSyncHeroEyebrow(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              Sekalian perbarui teks wilayah (eyebrow) pada banner Hero beranda agar selaras dengan{' '}
              <span className="font-semibold text-slate-900">Tulisan Identitas Wilayah</span>.
            </span>
          </label>

          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Judul & Identitas Web'}</span>
            </button>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-800">
            Pratinjau Tampilan Portal
          </div>
          <div className="border border-slate-200 rounded-xl bg-slate-50 overflow-hidden divide-y divide-slate-200">
            <div className="px-4 py-2.5 bg-slate-100 text-[11px] font-mono text-slate-600 truncate">
              Tab Browser: {previewTitle}
            </div>
            <div className="px-4 py-3 bg-white flex items-center justify-between gap-2">
              <span className="font-display text-sm font-bold text-slate-900 truncate">
                {webTitle.trim() || 'Portal Warga'}
              </span>
              <span className="text-[11px] text-slate-400">Navbar Utama</span>
            </div>
            <div className="px-4 py-2.5 bg-white text-xs text-slate-700">
              <span className="font-medium text-slate-900">
                {regionIdentity.trim() || 'RT 01/ RW 05 Dinoyo - Malang'}
              </span>
            </div>
            <div className="px-4 py-3 bg-white space-y-1 text-xs text-slate-600">
              <div className="font-semibold text-slate-800">
                Berita {regionCode.trim() || 'RT 01 / RW 05'}
              </div>
              <div className="text-[11px] text-slate-500">
                Footer: {webTitle.trim() || 'Portal Warga'} ·{' '}
                {regionIdentity.trim() || 'RT 01/ RW 05 Dinoyo - Malang'} ·{' '}
                {locationName.trim() || 'Balai Warga Kelurahan Dinoyo'}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
