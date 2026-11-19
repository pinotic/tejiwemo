import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  formatDateId,
  formatMonthId,
  formatRupiah,
  getDivisionName,
  getDivisionShortLabel,
  getMonthKey,
} from '../lib/format';
import type {
  DivisionId,
  DivisionInfo,
  TreasuryTransaction,
  UserRole,
} from '../types';
import { DivisionCashInfographic } from './CivicInfographics';

interface KasDivisiSectionProps {
  divisions: DivisionInfo[];
  treasury: TreasuryTransaction[];
  role: UserRole;
}

const DEFAULT_MONTH = '2026-11';

export function KasDivisiSection({
  divisions,
  treasury,
  role,
}: KasDivisiSectionProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(DEFAULT_MONTH);
  const [activeDivision, setActiveDivision] = useState<'all' | DivisionId>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add transaction form
  const [txDivision, setTxDivision] = useState<DivisionId>('sosial');
  const [txType, setTxType] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(`${DEFAULT_MONTH}-17`);
  const [txDesc, setTxDesc] = useState('');
  const [txRecorder, setTxRecorder] = useState('Bendahara Divisi');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState<string | null>(null);

  const handleDeleteTransaction = async (txId: string) => {
    try {
      const res = await fetch(`/api/treasury/${txId}`, { method: 'DELETE' });
      if (res.ok) {
        setConfirmDeleteTxId(null);
      }
    } catch {
      // ignore
    }
  };

  const availableMonths = useMemo(() => {
    const set = new Set<string>([DEFAULT_MONTH, '2026-10']);
    treasury.forEach((t) => {
      const m = getMonthKey(t.date);
      if (m) set.add(m);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [treasury]);

  const monthTransactions = useMemo(() => {
    return treasury.filter((t) => getMonthKey(t.date) === selectedMonth);
  }, [treasury, selectedMonth]);

  const divisionMonthlySummaries = useMemo(() => {
    return divisions.map((div) => {
      const items = monthTransactions.filter((t) => t.divisionId === div.id);
      const hasReported = items.length > 0;
      const income = items
        .filter((t) => t.type === 'pemasukan')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = items
        .filter((t) => t.type === 'pengeluaran')
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        ...div,
        hasReported,
        income,
        expense,
        balance: income - expense,
        txCount: items.length,
      };
    });
  }, [divisions, monthTransactions]);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return monthTransactions.filter((trx) => {
      if (activeDivision !== 'all' && trx.divisionId !== activeDivision) return false;
      if (typeFilter !== 'all' && trx.type !== typeFilter) return false;
      if (
        q &&
        !trx.description.toLowerCase().includes(q) &&
        !trx.referenceCode.toLowerCase().includes(q) &&
        !trx.recordedBy.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [monthTransactions, activeDivision, typeFilter, searchQuery]);

  const selectedDivisionStatus = useMemo(() => {
    if (activeDivision === 'all') return null;
    return divisionMonthlySummaries.find((d) => d.id === activeDivision) || null;
  }, [activeDivision, divisionMonthlySummaries]);

  const openModalForDivision = (divId?: DivisionId) => {
    if (divId) setTxDivision(divId);
    setTxDate(`${selectedMonth}-17`);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amountNum = Number(txAmount.replace(/[^0-9]/g, ''));
    if (!amountNum || amountNum <= 0) {
      setFormError('Nominal transaksi harus lebih dari Rp 0.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/treasury', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          divisionId: txDivision,
          type: txType,
          amount: amountNum,
          date: txDate,
          description: txDesc,
          recordedBy: txRecorder,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mencatat transaksi kas');
      }
      setSelectedMonth(getMonthKey(txDate));
      setShowAddModal(false);
      setTxAmount('');
      setTxDesc('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header + Month Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Kas Per Divisi
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Laporan bulanan tiap divisi ({formatMonthId(selectedMonth)}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
            <Calendar className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <label htmlFor="kas-month-select" className="text-xs font-medium text-slate-600">
              Bulan:
            </label>
            <select
              id="kas-month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            >
              {availableMonths.map((monthKey) => (
                <option key={monthKey} value={monthKey}>
                  {formatMonthId(monthKey)}
                </option>
              ))}
            </select>
          </div>

          {role === 'pengurus' && (
            <button
              type="button"
              onClick={() => openModalForDivision(activeDivision === 'all' ? undefined : activeDivision)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Catat Laporan Kas</span>
            </button>
          )}
        </div>
      </div>

      {/* Per-Division Monthly Status Cards (No Consolidated Total) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {divisionMonthlySummaries.map((div) => {
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
                  <span className="text-xs font-semibold text-slate-900">
                    {div.shortName}
                  </span>
                  {div.hasReported ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                      Lapor
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      Belum Lapor
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {div.coordinator}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                {div.hasReported ? (
                  <>
                    <div className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(div.balance)}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                      <span className="text-emerald-800">+{formatRupiah(div.income)}</span>
                      <span>-{formatRupiah(div.expense)}</span>
                    </div>
                  </>
                ) : (
                  <div className="py-1">
                    <div className="text-sm font-semibold text-amber-800">
                      Belum Lapor
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Periode {formatMonthId(selectedMonth)}
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Visual Infographic for Selected Month */}
      <DivisionCashInfographic
        divisions={divisions}
        treasury={treasury}
        monthKey={selectedMonth}
      />

      {/* Ledger Controls & High-Density Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Type & Division Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
              {(['all', 'pemasukan', 'pengeluaran'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    typeFilter === type
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type === 'all'
                    ? 'Semua Mutasi'
                    : type === 'pemasukan'
                    ? 'Pemasukan'
                    : 'Pengeluaran'}
                </button>
              ))}
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

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari keterangan atau kode ref..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-4 whitespace-nowrap">Tanggal</th>
                <th className="py-3 px-4 whitespace-nowrap">Kode Ref</th>
                <th className="py-3 px-4 whitespace-nowrap">Divisi</th>
                <th className="py-3 px-4">Keterangan Transaksi</th>
                <th className="py-3 px-4 whitespace-nowrap">Pencatat</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Nominal</th>
                {role === 'pengurus' && (
                  <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={role === 'pengurus' ? 7 : 6} className="py-12 px-4 text-center">
                    {selectedDivisionStatus && !selectedDivisionStatus.hasReported ? (
                      <div className="space-y-2 max-w-md mx-auto">
                        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800">
                          <Clock className="w-4 h-4" aria-hidden="true" />
                          <span>Belum Lapor</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {getDivisionName(selectedDivisionStatus.id, divisions)} belum melaporkan transaksi kas untuk periode{' '}
                          <span className="font-semibold text-slate-800">
                            {formatMonthId(selectedMonth)}
                          </span>
                          .
                        </p>
                        {role === 'pengurus' && (
                          <button
                            type="button"
                            onClick={() => openModalForDivision(selectedDivisionStatus.id)}
                            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Catat Laporan {selectedDivisionStatus.shortName}</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Tidak ada mutasi kas yang tercatat untuk periode {formatMonthId(selectedMonth)} dengan filter ini.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap font-mono tabular-nums">
                      {formatDateId(trx.date)}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {trx.referenceCode}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-800 whitespace-nowrap">
                      {getDivisionShortLabel(trx.divisionId, divisions)}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-800 min-w-[240px]">
                      {trx.description}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {trx.recordedBy}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-sm font-semibold tabular-nums">
                      <span
                        className={`inline-flex items-center justify-end gap-1 ${
                          trx.type === 'pemasukan'
                            ? 'text-emerald-800'
                            : 'text-slate-800'
                        }`}
                      >
                        {trx.type === 'pemasukan' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                        )}
                        {trx.type === 'pemasukan' ? '+' : '-'}
                        {formatRupiah(trx.amount)}
                      </span>
                    </td>
                    {role === 'pengurus' && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {confirmDeleteTxId === trx.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteTransaction(trx.id)}
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded"
                            >
                              Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTxId(null)}
                              className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 rounded"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteTxId(trx.id)}
                            aria-label={`Hapus transaksi ${trx.description}`}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal (Pengurus RT) */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-tx-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 id="add-tx-title" className="font-display text-lg font-bold text-slate-900">
                Catat Laporan Kas Divisi
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Tutup form kas"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Divisi
                  </label>
                  <select
                    value={txDivision}
                    onChange={(e) => setTxDivision(e.target.value as DivisionId)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
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
                    Jenis Mutasi
                  </label>
                  <select
                    value={txType}
                    onChange={(e) =>
                      setTxType(e.target.value as 'pemasukan' | 'pengeluaran')
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="pemasukan">Pemasukan (+)</option>
                    <option value="pengeluaran">Pengeluaran (-)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="250000"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  required
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="Contoh: Laporan kas kegiatan Posyandu November"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Dicatat Oleh
                </label>
                <input
                  type="text"
                  required
                  value={txRecorder}
                  onChange={(e) => setTxRecorder(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
