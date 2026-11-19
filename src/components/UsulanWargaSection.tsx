import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Plus,
  Search,
  ThumbsUp,
  X,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  formatDateTimeId,
  formatRelativeTime,
  formatRupiah,
  getDivisionName,
  getDivisionShortLabel,
  getProposalStepIndex,
  getStatusMeta,
  PROPOSAL_STEPS,
} from '../lib/format';
import type {
  DivisionInfo,
  ProposalItem,
  ProposalStatus,
  UserRole,
} from '../types';

interface UsulanWargaSectionProps {
  proposals: ProposalItem[];
  divisions: DivisionInfo[];
  role: UserRole;
  watchedProposalIds: string[];
  onToggleWatch: (proposalId: string) => void;
  onOpenProposalForm: () => void;
  selectedProposalId: string | null;
  onSelectProposalId: (id: string | null) => void;
}

const ALL_STATUS_FILTERS: ('all' | 'watched' | ProposalStatus)[] = [
  'all',
  'watched',
  'Diajukan',
  'Ditinjau',
  'Disetujui',
  'Dikerjakan',
  'Selesai',
  'Ditolak',
];

export function UsulanWargaSection({
  proposals,
  divisions,
  role,
  watchedProposalIds,
  onToggleWatch,
  onOpenProposalForm,
  selectedProposalId,
  onSelectProposalId,
}: UsulanWargaSectionProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'watched' | ProposalStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [supportedIds, setSupportedIds] = useState<string[]>([]);

  // Pengurus status update states
  const [nextStatus, setNextStatus] = useState<ProposalStatus>('Ditinjau');
  const [statusNote, setStatusNote] = useState('');
  const [updatedBy, setUpdatedBy] = useState('Pengurus RT 04');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const selectedProposal = useMemo(
    () => proposals.find((p) => p.id === selectedProposalId) || null,
    [proposals, selectedProposalId]
  );

  const filteredProposals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return proposals.filter((p) => {
      if (statusFilter === 'watched' && !watchedProposalIds.includes(p.id)) {
        return false;
      }
      if (
        statusFilter !== 'all' &&
        statusFilter !== 'watched' &&
        p.status !== statusFilter
      ) {
        return false;
      }
      if (
        q &&
        !p.title.toLowerCase().includes(q) &&
        !p.code.toLowerCase().includes(q) &&
        !p.residentName.toLowerCase().includes(q) &&
        !p.houseBlock.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [proposals, statusFilter, watchedProposalIds, searchQuery]);

  const handleOpenDetail = (proposal: ProposalItem) => {
    onSelectProposalId(proposal.id);
    setNextStatus(proposal.status);
    setStatusNote('');
    setStatusError(null);
  };

  const handleSupport = async (e: React.MouseEvent, proposalId: string) => {
    e.stopPropagation();
    if (supportedIds.includes(proposalId)) return;
    setSupportedIds((prev) => [...prev, proposalId]);
    try {
      await fetch(`/api/proposals/${proposalId}/support`, { method: 'POST' });
    } catch {
      // Revert if failed
      setSupportedIds((prev) => prev.filter((id) => id !== proposalId));
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;
    setStatusError(null);
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/proposals/${selectedProposal.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          note: statusNote,
          updatedBy,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui status usulan');
      }
      setStatusNote('');
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Usulan Warga & Pemantauan Progress
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Ajukan perbaikan fasilitas atau program lingkungan dan pantau setiap tahap penyelesaiannya secara real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenProposalForm}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Ajukan Usulan Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
          {ALL_STATUS_FILTERS.map((filter) => {
            const label =
              filter === 'all'
                ? 'Semua'
                : filter === 'watched'
                ? `Dipantau (${watchedProposalIds.length})`
                : filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === filter
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode, judul, atau blok..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
      </div>

      {/* Proposals Progress List */}
      {filteredProposals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-sm font-medium text-slate-800">
            Belum ada usulan yang cocok dengan filter ini.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Ubah filter status atau kirim usulan baru untuk lingkungan RT 04.
          </p>
          <button
            type="button"
            onClick={onOpenProposalForm}
            className="mt-4 px-4 py-2 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
          >
            Ajukan Usulan Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => {
            const meta = getStatusMeta(proposal.status);
            const stepIndex = getProposalStepIndex(proposal.status);
            const isWatched = watchedProposalIds.includes(proposal.id);
            const hasSupported = supportedIds.includes(proposal.id);
            const latestHistory = proposal.history[proposal.history.length - 1];

            return (
              <article
                key={proposal.id}
                onClick={() => handleOpenDetail(proposal)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 sm:p-6 cursor-pointer transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    {/* Unboxed typographic metadata */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-800">
                        {proposal.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-700">
                        {getDivisionShortLabel(proposal.divisionId, divisions)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {proposal.residentName} ({proposal.houseBlock})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Urgensi: {proposal.urgency}</span>
                      {proposal.estimatedBudget > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            Est. {formatRupiah(proposal.estimatedBudget)}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="font-display text-base font-semibold text-slate-900 leading-snug">
                      {proposal.title}
                    </h2>
                  </div>

                  {/* Status Label + Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border rounded-md whitespace-nowrap ${meta.surfaceClass} ${meta.textClass}`}
                    >
                      {proposal.status === 'Selesai' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : proposal.status === 'Ditolak' ? (
                        <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      <span>{meta.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatch(proposal.id);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                          isWatched
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {isWatched ? (
                          <>
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Dipantau</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Pantau</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleSupport(e, proposal.id)}
                        disabled={hasSupported}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors tabular-nums whitespace-nowrap ${
                          hasSupported
                            ? 'bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{proposal.supportersCount}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5-Stage Progress Stepper */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  {proposal.status === 'Ditolak' ? (
                    <div className="text-xs text-red-800 font-medium">
                      Usulan tidak dapat dilanjutkan: {latestHistory?.note}
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-2">
                      {PROPOSAL_STEPS.map((step, idx) => {
                        const isDone = idx <= stepIndex;
                        const isCurrent = idx === stepIndex;
                        return (
                          <div key={step} className="space-y-1.5">
                            <div
                              className={`h-1.5 rounded-sm transition-colors ${
                                isDone ? 'bg-emerald-700' : 'bg-slate-200'
                              }`}
                            />
                            <div
                              className={`text-[11px] truncate ${
                                isCurrent
                                  ? 'font-semibold text-emerald-900'
                                  : isDone
                                  ? 'font-medium text-slate-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {latestHistory && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span className="truncate max-w-2xl">
                        Catatan terakhir ({latestHistory.updatedBy}):{' '}
                        <span className="text-slate-700">{latestHistory.note}</span>
                      </span>
                      <span className="font-mono text-[11px] shrink-0">
                        {formatRelativeTime(proposal.updatedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Proposal Detail & Real-Time Status Transition Modal */}
      {selectedProposal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="proposal-detail-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => onSelectProposalId(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs text-slate-500">
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedProposal.code}
                  </span>{' '}
                  · {getDivisionName(selectedProposal.divisionId, divisions)} ·{' '}
                  {selectedProposal.residentName} ({selectedProposal.houseBlock})
                </div>
                <h3
                  id="proposal-detail-title"
                  className="mt-1 font-display text-xl font-bold text-slate-900 leading-snug"
                >
                  {selectedProposal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectProposalId(null)}
                aria-label="Tutup rincian usulan"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description & Budget */}
            <div className="space-y-3">
              <p className="text-sm text-slate-700 leading-relaxed">
                {selectedProposal.description}
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 pt-2">
                <span>
                  Status Saat Ini:{' '}
                  <strong className={getStatusMeta(selectedProposal.status).textClass}>
                    {selectedProposal.status}
                  </strong>
                </span>
                <span>
                  Urgensi: <strong className="text-slate-900">{selectedProposal.urgency}</strong>
                </span>
                {selectedProposal.estimatedBudget > 0 && (
                  <span className="font-mono tabular-nums">
                    Estimasi Biaya:{' '}
                    <strong className="text-slate-900">
                      {formatRupiah(selectedProposal.estimatedBudget)}
                    </strong>
                  </span>
                )}
              </div>
            </div>

            {/* Chronological Audit Timeline */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-4">
                Linimasa Progress Status
              </h4>
              <ol className="space-y-4">
                {selectedProposal.history.map((entry, idx) => {
                  const entryMeta = getStatusMeta(entry.status);
                  const isLast = idx === selectedProposal.history.length - 1;
                  return (
                    <li key={entry.id} className="relative pl-6">
                      {!isLast && (
                        <span
                          aria-hidden="true"
                          className="absolute left-[7px] top-4 bottom-[-16px] w-px bg-slate-200"
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${entryMeta.dotClass}`}
                      />
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className={`text-xs font-semibold ${entryMeta.textClass}`}>
                          {entry.status} · {entry.updatedBy}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {formatDateTimeId(entry.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{entry.note}</p>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Pengurus RT Status Update Form */}
            {role === 'pengurus' ? (
              <form
                onSubmit={handleStatusUpdate}
                className="pt-5 border-t border-slate-200 space-y-4 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Perbarui Status Usulan (Pengurus RT)
                  </h4>
                  <span className="text-[11px] text-emerald-800 font-medium">
                    Mengirim notifikasi real-time ke warga
                  </span>
                </div>

                {statusError && (
                  <div className="p-2.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
                    {statusError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Status Baru
                    </label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value as ProposalStatus)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      <option value="Diajukan">Diajukan</option>
                      <option value="Ditinjau">Ditinjau</option>
                      <option value="Disetujui">Disetujui</option>
                      <option value="Dikerjakan">Dikerjakan</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Ditolak">Ditolak</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Diperbarui Oleh
                    </label>
                    <input
                      type="text"
                      required
                      value={updatedBy}
                      onChange={(e) => setUpdatedBy(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Catatan Progress untuk Warga
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Contoh: Teknisi sedang memasang lampu baru di Blok C pagi ini..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectProposalId(null)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200/60 rounded-lg"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg"
                  >
                    {updatingStatus ? 'Memperbarui...' : 'Simpan & Kirim Notifikasi'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Ingin memperbarui status? Aktifkan <strong className="text-slate-800">Mode Pengurus RT</strong> di bilah atas.
                </span>
                <button
                  type="button"
                  onClick={() => onToggleWatch(selectedProposal.id)}
                  className="font-semibold text-emerald-800 hover:text-emerald-950"
                >
                  {watchedProposalIds.includes(selectedProposal.id)
                    ? 'Hentikan Pemantauan'
                    : 'Pantau Usulan Ini'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
