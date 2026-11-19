import {
  CalendarCheck2,
  ChevronDown,
  ChevronUp,
  Clock,
  MapPin,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatDateId, formatRelativeTime, getDivisionShortLabel } from '../lib/format';
import type { AgendaItem, DivisionId, DivisionInfo, UserRole } from '../types';

interface AgendaSectionProps {
  agenda: AgendaItem[];
  divisions: DivisionInfo[];
  role: UserRole;
  regionCode?: string;
}

function loadInitialRsvpMap(): Record<string, string> {
  try {
    const savedMap = localStorage.getItem('rt04_rsvp_map');
    const parsedMap = savedMap ? (JSON.parse(savedMap) as Record<string, string>) : {};
    const savedLegacy = localStorage.getItem('rt04_rsvp_ids');
    if (savedLegacy) {
      const legacyIds = JSON.parse(savedLegacy) as string[];
      for (const id of legacyIds) {
        if (!parsedMap[id]) {
          parsedMap[id] = 'legacy';
        }
      }
    }
    return parsedMap;
  } catch {
    return {};
  }
}

export function AgendaSection({
  agenda,
  divisions,
  role,
  regionCode = 'RT 01 / RW 05',
}: AgendaSectionProps) {
  const [selectedDivision, setSelectedDivision] = useState<'all' | DivisionId>('all');
  const [rsvpMap, setRsvpMap] = useState<Record<string, string>>(loadInitialRsvpMap);
  const [expandedAttendeesId, setExpandedAttendeesId] = useState<string | null>(null);
  const [rsvpTargetAgenda, setRsvpTargetAgenda] = useState<AgendaItem | null>(null);
  const [rsvpName, setRsvpName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('rt04_resident_profile');
      return saved ? (JSON.parse(saved) as { name?: string }).name || '' : '';
    } catch {
      return '';
    }
  });
  const [rsvpBlock, setRsvpBlock] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('rt04_resident_profile');
      return saved ? (JSON.parse(saved) as { block?: string }).block || '' : '';
    } catch {
      return '';
    }
  });
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create agenda form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-11-30');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('');
  const [divisionId, setDivisionId] = useState<DivisionId>('kebersihan');
  const [category, setCategory] = useState('Kegiatan RT');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredAgenda = useMemo(() => {
    return agenda.filter(
      (item) => selectedDivision === 'all' || item.divisionId === selectedDivision
    );
  }, [agenda, selectedDivision]);

  const persistRsvpMap = (nextMap: Record<string, string>) => {
    setRsvpMap(nextMap);
    try {
      localStorage.setItem('rt04_rsvp_map', JSON.stringify(nextMap));
      localStorage.setItem('rt04_rsvp_ids', JSON.stringify(Object.keys(nextMap)));
    } catch {
      // ignore storage failure
    }
  };

  const handleRsvpButtonClick = async (item: AgendaItem) => {
    const existingAttendeeId = rsvpMap[item.id];
    if (existingAttendeeId) {
      const nextMap = { ...rsvpMap };
      delete nextMap[item.id];
      persistRsvpMap(nextMap);

      await fetch(`/api/agenda/${item.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attending: false,
          attendeeId: existingAttendeeId === 'legacy' ? undefined : existingAttendeeId,
        }),
      });
      return;
    }

    setRsvpError(null);
    setRsvpTargetAgenda(item);
  };

  const handleSubmitRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpTargetAgenda) return;

    const cleanName = rsvpName.trim();
    const cleanBlock = rsvpBlock.trim() || regionCode;
    if (!cleanName) {
      setRsvpError('Nama warga wajib diisi agar tercatat oleh pengurus.');
      return;
    }

    setRsvpSubmitting(true);
    setRsvpError(null);
    try {
      const res = await fetch(`/api/agenda/${rsvpTargetAgenda.id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attending: true,
          name: cleanName,
          block: cleanBlock,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        attendee?: { id: string };
      };
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mencatat konfirmasi hadir.');
      }

      const attendeeId = data.attendee?.id || `att-${Date.now()}`;
      persistRsvpMap({
        ...rsvpMap,
        [rsvpTargetAgenda.id]: attendeeId,
      });

      try {
        localStorage.setItem(
          'rt04_resident_profile',
          JSON.stringify({ name: cleanName, block: rsvpBlock.trim() })
        );
      } catch {
        // ignore storage failure
      }

      setRsvpTargetAgenda(null);
    } catch (err) {
      setRsvpError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const handleCreateAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date,
          startTime,
          endTime,
          location,
          divisionId,
          category,
          description,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menambahkan agenda');
      }
      setShowCreateModal(false);
      setTitle('');
      setLocation('');
      setDescription('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Compact November 2026 Calendar Matrix (Nov 1, 2026 is Sunday)
  const novDays = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const dateKey = `2026-11-${String(dayNum).padStart(2, '0')}`;
    const events = agenda.filter((a) => a.date === dateKey);
    return { dayNum, dateKey, events };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Agenda Kegiatan {regionCode}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Jadwal resmi kerja bakti, rapat warga, layanan posyandu, dan kegiatan kebersamaan warga.
          </p>
        </div>

        {role === 'pengurus' && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Tambah Agenda</span>
          </button>
        )}
      </div>

      {/* Division Filter */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit">
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

      {/* Two-Column Agenda Layout: Chronological List + Mini Month Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Chronological Schedule */}
        <div className="lg:col-span-8 space-y-4">
          {filteredAgenda.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <p className="text-sm font-medium text-slate-800">
                Belum ada agenda terjadwal untuk divisi ini.
              </p>
            </div>
          ) : (
            filteredAgenda.map((item) => {
              const parsed = new Date(`${item.date}T00:00:00`);
              const dayNum = Number.isNaN(parsed.getTime())
                ? '--'
                : parsed.getDate();
              const monthLabel = Number.isNaN(parsed.getTime())
                ? ''
                : new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(parsed);
              const isAttending = Boolean(rsvpMap[item.id]);
              const attendees = item.attendees ?? [];
              const isExpanded = expandedAttendeesId === item.id;

              return (
                <article
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Date Block */}
                      <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[11px] font-semibold uppercase text-emerald-800">
                          {monthLabel}
                        </span>
                        <span className="font-mono text-xl font-bold text-slate-900 leading-none tabular-nums">
                          {dayNum}
                        </span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                          <span className="font-medium text-emerald-800">
                            {getDivisionShortLabel(item.divisionId, divisions)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{formatDateId(item.date)}</span>
                        </div>

                        <h2 className="font-display text-base font-semibold text-slate-900">
                          {item.title}
                        </h2>

                        <div className="pt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                            <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            {item.startTime} – {item.endTime} WIB
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            {item.location}
                          </span>
                          <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <Users className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                            {item.rsvpCount} warga hadir
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {role === 'pengurus' && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAttendeesId(isExpanded ? null : item.id)
                          }
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Users className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                          <span>Daftar Hadir ({item.rsvpCount})</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRsvpButtonClick(item)}
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                          isAttending
                            ? 'bg-emerald-800 border-emerald-800 text-white'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <CalendarCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isAttending ? 'Terkonfirmasi Hadir' : 'Konfirmasi Hadir'}</span>
                      </button>
                    </div>
                  </div>

                  {role === 'pengurus' && isExpanded && (
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-xs font-semibold text-slate-800">
                          Daftar Warga Terkonfirmasi Hadir
                        </h3>
                        <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                          Total {item.rsvpCount} warga
                        </span>
                      </div>

                      {attendees.length === 0 ? (
                        <p className="text-xs text-slate-500 py-2">
                          Belum ada warga yang mengisi nama konfirmasi kehadiran.
                        </p>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg bg-slate-50/70">
                          {attendees.map((att) => (
                            <div
                              key={att.id}
                              className="px-3 py-2 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <span className="font-medium text-slate-900 truncate">
                                  {att.name}
                                </span>
                                <span className="text-slate-400" aria-hidden="true">
                                  ·
                                </span>
                                <span className="text-slate-600 font-mono text-[11px] shrink-0">
                                  {att.block}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 shrink-0 tabular-nums">
                                {formatRelativeTime(att.timestamp)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {attendees.length > 0 && item.rsvpCount > attendees.length && (
                        <p className="mt-1.5 text-[11px] text-slate-500">
                          Menampilkan {attendees.length} konfirmasi terbaru dari total{' '}
                          {item.rsvpCount} warga yang terdaftar hadir.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Mini Monthly Calendar Reference */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Kalender November 2026
            </h3>
            <span className="text-[11px] text-slate-500">{regionCode}</span>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
            <span>Min</span>
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1 text-center">
            {novDays.map((d) => {
              const hasEvent = d.events.length > 0;
              const isToday = d.dayNum === 17;
              return (
                <div
                  key={d.dateKey}
                  title={
                    hasEvent
                      ? d.events.map((e) => e.title).join(', ')
                      : undefined
                  }
                  className={`h-9 rounded-md flex flex-col items-center justify-center text-xs font-mono tabular-nums ${
                    hasEvent
                      ? 'bg-emerald-800 text-white font-semibold'
                      : isToday
                      ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-300'
                      : 'text-slate-600'
                  }`}
                >
                  <span>{d.dayNum}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-800 inline-block" aria-hidden="true" />
              <span>Tanggal dengan agenda kegiatan RT</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-300 inline-block" aria-hidden="true" />
              <span>Hari ini (17 November 2026)</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Create Agenda Modal (Pengurus RT) */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-agenda-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 id="create-agenda-title" className="font-display text-lg font-bold text-slate-900">
                Tambah Agenda Kegiatan
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Tutup form agenda"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAgenda} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Agenda
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Rapat Koordinasi Persiapan Akhir Tahun"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Divisi
                  </label>
                  <select
                    value={divisionId}
                    onChange={(e) => setDivisionId(e.target.value as DivisionId)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
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

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
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
                    Mulai
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Selesai
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
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
                  placeholder="Balai Warga RT 04"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Keterangan
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Informasi singkat agenda..."
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
                  {submitting ? 'Menyimpan...' : 'Simpan Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Konfirmasi Kehadiran Modal (Warga) */}
      {rsvpTargetAgenda && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rsvp-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => setRsvpTargetAgenda(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 id="rsvp-modal-title" className="font-display text-lg font-bold text-slate-900">
                Konfirmasi Kehadiran
              </h3>
              <button
                type="button"
                onClick={() => setRsvpTargetAgenda(null)}
                aria-label="Tutup konfirmasi kehadiran"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="text-xs font-semibold text-slate-900">
                {rsvpTargetAgenda.title}
              </div>
              <div className="text-[11px] text-slate-600 font-mono tabular-nums">
                {formatDateId(rsvpTargetAgenda.date)} · {rsvpTargetAgenda.startTime} WIB ·{' '}
                {rsvpTargetAgenda.location}
              </div>
            </div>

            <form onSubmit={handleSubmitRsvp} className="mt-4 space-y-4">
              {rsvpError && (
                <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  {rsvpError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Warga
                </label>
                <input
                  type="text"
                  required
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  placeholder="Contoh: Bpk. Budi Santoso"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Blok / Nomor Rumah
                </label>
                <input
                  type="text"
                  value={rsvpBlock}
                  onChange={(e) => setRsvpBlock(e.target.value)}
                  placeholder="Contoh: Blok A-05"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-1 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRsvpTargetAgenda(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={rsvpSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg"
                >
                  <CalendarCheck2 className="w-4 h-4" aria-hidden="true" />
                  <span>{rsvpSubmitting ? 'Mengirim...' : 'Konfirmasi Hadir'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
