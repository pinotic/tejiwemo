import type { DivisionId, ProposalStatus } from '../types';

export function formatRupiah(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID').format(abs);
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function formatDateId(dateStr: string): string {
  if (!dateStr) return '-';
  const parsed = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function formatMonthId(monthKey: string): string {
  if (!monthKey || monthKey.length < 7) return monthKey;
  const parsed = new Date(`${monthKey}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return monthKey;
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export function formatDateTimeId(isoStr: string): string {
  if (!isoStr) return '-';
  const parsed = new Date(isoStr);
  if (Number.isNaN(parsed.getTime())) return isoStr;
  return (
    new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed) + ' WIB'
  );
}

export function formatRelativeTime(isoStr: string): string {
  const parsed = new Date(isoStr);
  if (Number.isNaN(parsed.getTime())) return isoStr;
  const diffSeconds = Math.floor((Date.now() - parsed.getTime()) / 1000);
  if (diffSeconds < 45) return 'Baru saja';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDateId(isoStr);
}

export const PROPOSAL_STEPS: ProposalStatus[] = [
  'Diajukan',
  'Ditinjau',
  'Disetujui',
  'Dikerjakan',
  'Selesai',
];

export function getProposalStepIndex(status: ProposalStatus): number {
  if (status === 'Ditolak') return -1;
  return PROPOSAL_STEPS.indexOf(status);
}

export function getStatusMeta(status: ProposalStatus): {
  label: string;
  textClass: string;
  dotClass: string;
  surfaceClass: string;
} {
  switch (status) {
    case 'Diajukan':
      return {
        label: 'Diajukan',
        textClass: 'text-slate-700',
        dotClass: 'bg-slate-500',
        surfaceClass: 'bg-slate-100 border-slate-200',
      };
    case 'Ditinjau':
      return {
        label: 'Ditinjau',
        textClass: 'text-amber-800',
        dotClass: 'bg-amber-600',
        surfaceClass: 'bg-amber-50 border-amber-200',
      };
    case 'Disetujui':
      return {
        label: 'Disetujui',
        textClass: 'text-teal-800',
        dotClass: 'bg-teal-600',
        surfaceClass: 'bg-teal-50 border-teal-200',
      };
    case 'Dikerjakan':
      return {
        label: 'Dikerjakan',
        textClass: 'text-blue-800',
        dotClass: 'bg-blue-600',
        surfaceClass: 'bg-blue-50 border-blue-200',
      };
    case 'Selesai':
      return {
        label: 'Selesai',
        textClass: 'text-emerald-800',
        dotClass: 'bg-emerald-600',
        surfaceClass: 'bg-emerald-50 border-emerald-200',
      };
    case 'Ditolak':
      return {
        label: 'Ditolak',
        textClass: 'text-red-800',
        dotClass: 'bg-red-600',
        surfaceClass: 'bg-red-50 border-red-200',
      };
  }
}

export function getDivisionShortLabel(
  divisionId: DivisionId,
  divisions: { id: DivisionId; shortName: string }[]
): string {
  return divisions.find((d) => d.id === divisionId)?.shortName || divisionId;
}

export function getDivisionName(
  divisionId: DivisionId,
  divisions: { id: DivisionId; name: string }[]
): string {
  return divisions.find((d) => d.id === divisionId)?.name || divisionId;
}
