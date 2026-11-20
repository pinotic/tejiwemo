import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { authFetch } from '../lib/auth';
import { formatDateId, getDivisionShortLabel } from '../lib/format';
import type {
  AuthUser,
  DivisionId,
  DivisionInfo,
  MeetingNoteItem,
  SiteSettings,
} from '../types';

interface PengurusNotulenPanelProps {
  authUser: AuthUser;
  siteSettings: SiteSettings;
  divisions: DivisionInfo[];
  notulen: MeetingNoteItem[];
}

export function PengurusNotulenPanel({
  authUser,
  siteSettings,
  divisions,
  notulen,
}: PengurusNotulenPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [divisionId, setDivisionId] = useState<DivisionId>(divisions[0]?.id || 'kebersihan');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-11-19');
  const [time, setTime] = useState('19:30 – 21:00 WIB');
  const [location, setLocation] = useState(siteSettings.locationName || 'Balai Warga');
  const [leader, setLeader] = useState('');
  const [noteTaker, setNoteTaker] = useState(authUser.displayName || 'Sekretaris RT');
  const [attendeesCount, setAttendeesCount] = useState('12');
  const [agendaTopics, setAgendaTopics] = useState('');
  const [decisions, setDecisions] = useState('');

  const [filterDiv, setFilterDiv] = useState<'all' | DivisionId>('all');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const effectiveDivision = divisions.some((d) => d.id === divisionId)
    ? divisionId
    : divisions[0]?.id || '';

  const filteredNotulen =
    filterDiv === 'all' ? notulen : notulen.filter((n) => n.divisionId === filterDiv);

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDate('2026-11-19');
    setTime('19:30 – 21:00 WIB');
    setLocation(siteSettings.locationName || 'Balai Warga');
    setLeader('');
    setNoteTaker(authUser.displayName || 'Sekretaris RT');
    setAttendeesCount('12');
    setAgendaTopics('');
    setDecisions('');
  };

  const startEdit = (item: MeetingNoteItem) => {
    setEditingId(item.id);
    setDivisionId(item.divisionId);
    setTitle(item.title);
    setDate(item.date);
    setTime(item.time);
    setLocation(item.location);
    setLeader(item.leader);
    setNoteTaker(item.noteTaker);
    setAttendeesCount(String(item.attendeesCount));
    setAgendaTopics(item.agendaTopics);
    setDecisions(item.decisions);
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!title.trim() || !date || !decisions.trim()) {
      setFeedback({
        kind: 'err',
        text: 'Judul rapat, tanggal, dan hasil keputusan wajib diisi.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const url = editingId ? `/api/notulen/${editingId}` : '/api/notulen';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          divisionId: effectiveDivision,
          title: title.trim(),
          date,
          time: time.trim(),
          location: location.trim(),
          leader: leader.trim(),
          noteTaker: noteTaker.trim(),
          attendeesCount: Number(attendeesCount) || 0,
          agendaTopics: agendaTopics.trim(),
          decisions: decisions.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan notulen rapat.');
      }

      setFeedback({
        kind: 'ok',
        text: editingId
          ? 'Notulen rapat berhasil diperbarui dan tersinkronisasi.'
          : 'Notulen rapat baru berhasil diterbitkan ke laman warga.',
      });
      resetForm();
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSubmitting(true);
    try {
      const res = await authFetch(`/api/notulen/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus notulen rapat.');
      }
      if (editingId === id) resetForm();
      setConfirmDeleteId(null);
      setFeedback({ kind: 'ok', text: 'Notulen rapat berhasil dihapus.' });
    } catch (err) {
      setFeedback({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Gagal menghapus notulen.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      {feedback && (
        <div
          role="status"
          className={`mb-5 p-3 text-xs font-medium rounded-lg border ${
            feedback.kind === 'ok'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Tambah / Edit Notulen */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <h2 className="font-display text-sm font-bold text-slate-900">
              {editingId ? 'Edit Notulen Rapat' : 'Buat Notulen Rapat Divisi'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Divisi
              </label>
              <select
                value={effectiveDivision}
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
                Tanggal Rapat
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Judul / Topik Rapat
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rapat Koordinasi Persiapan Kerja Bakti"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Jam Rapat
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="19:30 – 21:00 WIB"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Jumlah Hadir
              </label>
              <input
                type="number"
                min={0}
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Lokasi Rapat
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Balai Warga Kelurahan Dinoyo"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pimpinan Rapat
              </label>
              <input
                type="text"
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                placeholder="Koordinator Divisi"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Notulis
              </label>
              <input
                type="text"
                value={noteTaker}
                onChange={(e) => setNoteTaker(e.target.value)}
                placeholder="Nama pencatat notulen"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Pokok Bahasan
            </label>
            <textarea
              rows={2}
              value={agendaTopics}
              onChange={(e) => setAgendaTopics(e.target.value)}
              placeholder="Ringkasan poin-poin yang dibahas dalam rapat..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Hasil Keputusan &amp; Tindak Lanjut
            </label>
            <textarea
              rows={4}
              required
              value={decisions}
              onChange={(e) => setDecisions(e.target.value)}
              placeholder={'1. Keputusan pertama...\n2. Keputusan kedua...'}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>
              {submitting
                ? 'Menyimpan...'
                : editingId
                  ? 'Simpan Perubahan Notulen'
                  : 'Terbitkan Notulen Rapat'}
            </span>
          </button>
        </form>

        {/* Daftar Notulen Tersimpan */}
        <div className="lg:col-span-7 lg:border-l lg:border-slate-100 lg:pl-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="text-xs font-semibold text-slate-800 tabular-nums">
              Arsip Notulen Tersimpan ({filteredNotulen.length})
            </div>

            <select
              aria-label="Filter divisi notulen"
              value={filterDiv}
              onChange={(e) => setFilterDiv(e.target.value as 'all' | DivisionId)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="all">Semua Divisi</option>
              {divisions.map((div) => (
                <option key={div.id} value={div.id}>
                  {div.shortName}
                </option>
              ))}
            </select>
          </div>

          <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto pr-1">
            {filteredNotulen.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">
                Belum ada notulen rapat untuk filter ini.
              </div>
            ) : (
              filteredNotulen.map((item) => (
                <div key={item.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                        <span className="font-mono font-semibold text-emerald-800">
                          {item.referenceCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-700">
                          {getDivisionShortLabel(item.divisionId, divisions)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatDateId(item.date)}
                        </span>
                      </div>
                      <h3 className="mt-0.5 text-sm font-semibold text-slate-900 leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg"
                      >
                        <Pencil className="w-3 h-3" aria-hidden="true" />
                        <span>Edit</span>
                      </button>

                      {confirmDeleteId === item.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={submitting}
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded"
                          >
                            Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          aria-label={`Hapus notulen ${item.title}`}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 whitespace-pre-line">
                    {item.decisions}
                  </p>
                  <div className="text-[11px] text-slate-400 tabular-nums">
                    Notulis: {item.noteTaker} · {item.attendeesCount} hadir · {item.location}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
