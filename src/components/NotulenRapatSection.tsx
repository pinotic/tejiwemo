import {
  Calendar,
  FileText,
  MapPin,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  formatDateId,
  formatMonthId,
  getDivisionName,
  getDivisionShortLabel,
  getMonthKey,
} from '../lib/format';
import type {
  DivisionId,
  DivisionInfo,
  MeetingNoteItem,
} from '../types';

interface NotulenRapatSectionProps {
  divisions: DivisionInfo[];
  notulen: MeetingNoteItem[];
}

const DEFAULT_MONTH = '2026-11';

export function NotulenRapatSection({
  divisions,
  notulen,
}: NotulenRapatSectionProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(DEFAULT_MONTH);
  const [activeDivision, setActiveDivision] = useState<'all' | DivisionId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<MeetingNoteItem | null>(null);

  const availableMonths = useMemo(() => {
    const set = new Set<string>([DEFAULT_MONTH]);
    notulen.forEach((n) => {
      const m = getMonthKey(n.date);
      if (m) set.add(m);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [notulen]);

  const periodNotes = useMemo(() => {
    if (selectedMonth === 'all') return notulen;
    return notulen.filter((n) => getMonthKey(n.date) === selectedMonth);
  }, [notulen, selectedMonth]);

  const divisionSummaries = useMemo(() => {
    return divisions.map((div) => {
      const items = periodNotes
        .filter((n) => n.divisionId === div.id)
        .sort((a, b) => b.date.localeCompare(a.date));
      const totalAttendees = items.reduce((sum, n) => sum + (n.attendeesCount || 0), 0);
      return {
        ...div,
        count: items.length,
        latestDate: items[0]?.date || null,
        totalAttendees,
      };
    });
  }, [divisions, periodNotes]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return periodNotes
      .filter((item) => {
        if (activeDivision !== 'all' && item.divisionId !== activeDivision) return false;
        if (
          q &&
          !item.title.toLowerCase().includes(q) &&
          !item.agendaTopics.toLowerCase().includes(q) &&
          !item.decisions.toLowerCase().includes(q) &&
          !item.leader.toLowerCase().includes(q) &&
          !item.noteTaker.toLowerCase().includes(q) &&
          !item.referenceCode.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [periodNotes, activeDivision, searchQuery]);

  const periodLabel =
    selectedMonth === 'all' ? 'Semua Periode' : formatMonthId(selectedMonth);

  return (
    <div className="space-y-8">
      {/* Header + Period Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Notulen Rapat Per Divisi
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Arsip catatan rapat, pokok bahasan, dan hasil keputusan tiap divisi ({periodLabel}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <label htmlFor="notulen-month-select" className="text-xs font-medium text-slate-600">
              Periode:
            </label>
            <select
              id="notulen-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Bulan</option>
              {availableMonths.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {formatMonthId(monthKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Per-Division Summary Cards (No "Belum Lapor" status) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {divisionSummaries.map((div) => {
          const isSelected = activeDivision === div.id;
          return (
            <button
              key={div.id}
              type="button"
              onClick={() => setActiveDivision(isSelected ? 'all' : div.id)}
              className={`text-left p-4 rounded-xl border transition-colors flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/70 border-emerald-700'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {div.shortName}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {div.coordinator}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div
                  className={`font-mono text-lg font-semibold tabular-nums ${
                    div.count > 0 ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {div.count} Notulen
                </div>
                <div className="mt-1 text-[11px] text-slate-500 truncate tabular-nums">
                  {div.latestDate
                    ? `Terbaru ${formatDateId(div.latestDate)}`
                    : periodLabel}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter Bar & Meeting Minutes Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs font-medium text-slate-600 tabular-nums">
              Menampilkan <span className="font-semibold text-slate-900">{filteredNotes.length}</span> catatan rapat
            </div>

            {activeDivision !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveDivision('all')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
              >
                <span>Divisi: {getDivisionShortLabel(activeDivision, divisions)}</span>
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="relative w-full lg:w-80">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul rapat, keputusan, atau notulis..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4 whitespace-nowrap">Tanggal</th>
                <th className="py-3 px-4 whitespace-nowrap">Kode Ref</th>
                <th className="py-3 px-4 whitespace-nowrap">Divisi</th>
                <th className="py-3 px-4">Judul &amp; Pokok Bahasan</th>
                <th className="py-3 px-4 whitespace-nowrap">Notulis</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Hadir</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <p className="text-sm text-slate-500">
                      {activeDivision !== 'all'
                        ? `Belum ada catatan notulen rapat untuk ${getDivisionName(activeDivision, divisions)} pada ${periodLabel}.`
                        : `Belum ada catatan notulen rapat pada ${periodLabel} dengan filter ini.`}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredNotes.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedNote(item)}
                  >
                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap font-mono tabular-nums align-top">
                      <div>{formatDateId(item.date)}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.time}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap align-top">
                      {item.referenceCode}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-800 whitespace-nowrap align-top">
                      {getDivisionShortLabel(item.divisionId, divisions)}
                    </td>
                    <td className="py-3.5 px-4 min-w-[260px] align-top">
                      <div className="text-sm font-semibold text-slate-900 leading-snug">
                        {item.title}
                      </div>
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.agendaTopics}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap align-top">
                      <div>{item.noteTaker}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Pimpinan: {item.leader}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-xs font-semibold text-slate-700 tabular-nums align-top">
                      {item.attendeesCount} org
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap align-top">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNote(item);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Baca Notulen</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Notulen Modal */}
      {selectedNote && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="notulen-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setSelectedNote(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-semibold text-emerald-800">
                    {selectedNote.referenceCode}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-slate-700">
                    {getDivisionName(selectedNote.divisionId, divisions)}
                  </span>
                </div>
                <h2
                  id="notulen-detail-title"
                  className="mt-1.5 font-display text-xl font-bold text-slate-900 leading-snug"
                >
                  {selectedNote.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                aria-label="Tutup detail notulen"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div>
                <dt className="text-slate-500">Tanggal &amp; Waktu</dt>
                <dd className="mt-0.5 font-semibold text-slate-900 font-mono tabular-nums">
                  {formatDateId(selectedNote.date)} · {selectedNote.time}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Lokasi Rapat</dt>
                <dd className="mt-0.5 font-semibold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>{selectedNote.location}</span>
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Pimpinan Rapat</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">{selectedNote.leader}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Notulis &amp; Kehadiran</dt>
                <dd className="mt-0.5 font-semibold text-slate-900 flex items-center gap-1.5 tabular-nums">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>
                    {selectedNote.noteTaker} · {selectedNote.attendeesCount} peserta hadir
                  </span>
                </dd>
              </div>
            </dl>

            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Pokok Bahasan
                </h3>
                <p className="whitespace-pre-line text-slate-800">
                  {selectedNote.agendaTopics}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1.5">
                  Hasil Keputusan &amp; Tindak Lanjut
                </h3>
                <div className="whitespace-pre-line text-slate-900 bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 leading-relaxed">
                  {selectedNote.decisions}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Tutup Notulen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
