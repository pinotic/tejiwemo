import { Calendar, MapPin, Plus, Users, X } from 'lucide-react';
import { useState } from 'react';
import { formatDateId, getDivisionName, getDivisionShortLabel } from '../lib/format';
import type { ActivityItem, DivisionId, DivisionInfo, UserRole } from '../types';

interface InfoKegiatanSectionProps {
  activities: ActivityItem[];
  divisions: DivisionInfo[];
  role: UserRole;
}

export function InfoKegiatanSection({
  activities,
  divisions,
  role,
}: InfoKegiatanSectionProps) {
  const [selectedDivision, setSelectedDivision] = useState<'all' | DivisionId>('all');
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for Pengurus RT
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Lingkungan');
  const [divisionId, setDivisionId] = useState<DivisionId>('kebersihan');
  const [date, setDate] = useState('2026-11-28');
  const [time, setTime] = useState('08:00 – 11:00 WIB');
  const [location, setLocation] = useState('');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [coordinator, setCoordinator] = useState('Pengurus RT 04');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = activities.filter(
    (act) => selectedDivision === 'all' || act.divisionId === selectedDivision
  );

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          divisionId,
          date,
          time,
          location,
          summary,
          details,
          coordinator,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menerbitkan info kegiatan');
      }
      setShowCreateModal(false);
      setTitle('');
      setLocation('');
      setSummary('');
      setDetails('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Info Kegiatan Warga
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Dokumentasi pelaksanaan program dan pengumuman kegiatan lingkungan RT 04 / RW 07.
          </p>
        </div>

        {role === 'pengurus' && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Terbitkan Info Kegiatan</span>
          </button>
        )}
      </div>

      {/* Interactive Division Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit">
        <button
          type="button"
          onClick={() => setSelectedDivision('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
            selectedDivision === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua Divisi
        </button>
        {divisions.map((div) => (
          <button
            key={div.id}
            type="button"
            onClick={() => setSelectedDivision(div.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedDivision === div.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {div.shortName}
          </button>
        ))}
      </div>

      {/* Activities Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-slate-800">
            Belum ada info kegiatan untuk divisi ini.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Pilih filter divisi lain atau tunggu pengumuman dari pengurus RT.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((activity) => (
            <article
              key={activity.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-colors hover:border-slate-300"
            >
              <div>
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                  {activity.imageUrl ? (
                    <img
                      src={activity.imageUrl}
                      alt={activity.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-100 p-6 text-center">
                      <Calendar className="w-8 h-8 text-emerald-700 mb-2" aria-hidden="true" />
                      <span className="text-xs font-medium text-slate-600">
                        {getDivisionName(activity.divisionId, divisions)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-emerald-800">
                      {getDivisionShortLabel(activity.divisionId, divisions)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDateId(activity.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activity.status}</span>
                  </div>

                  <h2 className="mt-1.5 font-display text-base font-semibold text-slate-900 leading-snug line-clamp-2">
                    {activity.title}
                  </h2>

                  <p className="mt-1.5 text-xs text-slate-500 truncate">
                    {activity.location}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                  <Users className="w-3.5 h-3.5" aria-hidden="true" />
                  {activity.attendeesCount} peserta
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedActivity(activity)}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 whitespace-nowrap shrink-0"
                >
                  Detail →
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => setSelectedActivity(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedActivity.imageUrl && (
              <div className="aspect-[16/9] bg-slate-100 overflow-hidden shrink-0">
                <img
                  src={selectedActivity.imageUrl}
                  alt={selectedActivity.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-emerald-800">
                    {getDivisionName(selectedActivity.divisionId, divisions)}
                  </span>{' '}
                  · {selectedActivity.category} · {selectedActivity.status}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  aria-label="Tutup rincian kegiatan"
                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h3
                id="activity-modal-title"
                className="font-display text-xl font-bold text-slate-900 leading-snug"
              >
                {selectedActivity.title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>
                    {formatDateId(selectedActivity.date)} · {selectedActivity.time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>{selectedActivity.location}</span>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">
                {selectedActivity.details}
              </p>

              <div className="pt-2 text-xs text-slate-500">
                Penanggung Jawab: <span className="font-medium text-slate-800">{selectedActivity.coordinator}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Activity Modal (Pengurus RT) */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-activity-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3
                id="create-activity-title"
                className="font-display text-lg font-bold text-slate-900"
              >
                Terbitkan Info Kegiatan Baru
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Tutup form kegiatan"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Judul Kegiatan
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Fogging Nyamuk Demam Berdarah Blok A–D"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Divisi Pelaksana
                  </label>
                  <select
                    value={divisionId}
                    onChange={(e) => setDivisionId(e.target.value as DivisionId)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
                  >
                    {divisions.map((div) => (
                      <option key={div.id} value={div.id}>
                        {div.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Waktu
                  </label>
                  <input
                    type="text"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Lokasi
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Balai Warga RT 04 / Jl. Anggrek"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Ringkasan Singkat
                </label>
                <textarea
                  rows={2}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Penjelasan ringkas tujuan dan persiapan warga..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Rincian Lengkap & Perlengkapan
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Informasi tambahan untuk warga..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Koordinator / PIC
                </label>
                <input
                  type="text"
                  value={coordinator}
                  onChange={(e) => setCoordinator(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg"
                >
                  {submitting ? 'Menyimpan...' : 'Publikasikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
