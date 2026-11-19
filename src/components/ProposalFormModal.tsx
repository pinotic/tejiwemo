import { X } from 'lucide-react';
import { useState } from 'react';
import type { DivisionId, DivisionInfo, ProposalUrgency } from '../types';

interface ProposalFormModalProps {
  open: boolean;
  divisions: DivisionInfo[];
  onClose: () => void;
  onSuccess: (createdProposalId: string) => void;
}

export function ProposalFormModal({
  open,
  divisions,
  onClose,
  onSuccess,
}: ProposalFormModalProps) {
  const [title, setTitle] = useState('');
  const [divisionId, setDivisionId] = useState<DivisionId>('infrastruktur');
  const [residentName, setResidentName] = useState('');
  const [houseBlock, setHouseBlock] = useState('');
  const [urgency, setUrgency] = useState<ProposalUrgency>('Normal');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const parsedBudget = estimatedBudget
        ? Number(estimatedBudget.replace(/[^0-9]/g, ''))
        : 0;
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          divisionId,
          residentName,
          houseBlock,
          urgency,
          estimatedBudget: Number.isFinite(parsedBudget) ? parsedBudget : 0,
          description,
        }),
      });
      const data = (await res.json()) as {
        proposal?: { id: string };
        error?: string;
      };
      if (!res.ok || !data.proposal) {
        throw new Error(data.error || 'Gagal mengirim usulan warga');
      }

      setTitle('');
      setResidentName('');
      setHouseBlock('');
      setEstimatedBudget('');
      setDescription('');
      setUrgency('Normal');
      onSuccess(data.proposal.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2
              id="proposal-form-title"
              className="font-display text-lg font-bold text-slate-900"
            >
              Formulir Usulan Warga RT 04
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Usulan yang dikirim langsung dipantau progress-nya melalui notifikasi real-time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir usulan"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Judul Usulan
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Perbaikan Saluran Air Depan Blok D-04"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Warga Pengusul
              </label>
              <input
                type="text"
                required
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
                placeholder="Contoh: Ibu Sari Dewi"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Blok / Nomor Rumah
              </label>
              <input
                type="text"
                required
                value={houseBlock}
                onChange={(e) => setHouseBlock(e.target.value)}
                placeholder="Contoh: Blok D-04"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Divisi Terkait
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
                Tingkat Urgensi
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as ProposalUrgency)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="Normal">Normal</option>
                <option value="Prioritas">Prioritas</option>
                <option value="Mendesak">Mendesak</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Estimasi Biaya (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={estimatedBudget}
                onChange={(e) => setEstimatedBudget(e.target.value)}
                placeholder="Opsional"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Deskripsi & Lokasi Detail
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kondisi lapangan, titik lokasi, dan manfaat bagi warga..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-lg"
            >
              {submitting ? 'Mengirim...' : 'Kirim Usulan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
