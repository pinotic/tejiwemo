import { Clock } from 'lucide-react';
import { formatMonthId, formatRupiah, getMonthKey, getStatusMeta } from '../lib/format';
import type {
  AgendaItem,
  DivisionInfo,
  ProposalItem,
  ProposalStatus,
  TreasuryTransaction,
} from '../types';

interface DivisionCashChartProps {
  divisions: DivisionInfo[];
  treasury: TreasuryTransaction[];
  monthKey: string;
}

export function DivisionCashInfographic({
  divisions,
  treasury,
  monthKey,
}: DivisionCashChartProps) {
  const monthly = treasury.filter((t) => getMonthKey(t.date) === monthKey);

  const rows = divisions.map((div) => {
    const items = monthly.filter((t) => t.divisionId === div.id);
    const income = items
      .filter((t) => t.type === 'pemasukan')
      .reduce((s, t) => s + t.amount, 0);
    const expense = items
      .filter((t) => t.type === 'pengeluaran')
      .reduce((s, t) => s + t.amount, 0);
    return {
      id: div.id,
      shortName: div.shortName,
      hasReported: items.length > 0,
      income,
      expense,
    };
  });

  const maxVal = Math.max(
    1,
    ...rows.flatMap((r) => [r.income, r.expense])
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-display text-base font-bold text-slate-900">
            Infografis Kas Divisi · {formatMonthId(monthKey)}
          </h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-700 inline-block" aria-hidden="true" />
            Pemasukan
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-500 inline-block" aria-hidden="true" />
            Pengeluaran
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-center">
            <div className="sm:col-span-3 text-xs font-semibold text-slate-800 truncate">
              {row.shortName}
            </div>

            {row.hasReported ? (
              <div className="sm:col-span-9 space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-emerald-700 rounded-sm transition-all duration-300"
                      style={{ width: `${Math.max(4, Math.round((row.income / maxVal) * 100))}%` }}
                    />
                  </div>
                  <span className="w-28 text-right font-mono text-[11px] font-medium text-emerald-800 tabular-nums shrink-0">
                    +{formatRupiah(row.income)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-slate-500 rounded-sm transition-all duration-300"
                      style={{ width: `${Math.max(4, Math.round((row.expense / maxVal) * 100))}%` }}
                    />
                  </div>
                  <span className="w-28 text-right font-mono text-[11px] font-medium text-slate-600 tabular-nums shrink-0">
                    -{formatRupiah(row.expense)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="sm:col-span-9 flex items-center justify-between gap-3 py-1.5 px-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/40">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  Belum Lapor
                </span>
                <span className="text-[11px] text-slate-500">
                  {formatMonthId(monthKey)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface CivicInfographicsProps {
  divisions: DivisionInfo[];
  treasury: TreasuryTransaction[];
  proposals: ProposalItem[];
  agenda: AgendaItem[];
  monthKey: string;
}

const STATUS_COLOR_HEX: Record<ProposalStatus, string> = {
  Selesai: '#047857',
  Dikerjakan: '#1D4ED8',
  Disetujui: '#0F766E',
  Ditinjau: '#D97706',
  Diajukan: '#64748B',
  Ditolak: '#DC2626',
};

export function CivicInfographics({
  divisions,
  treasury,
  proposals,
  agenda,
  monthKey,
}: CivicInfographicsProps) {
  // 1. Proposal Status Donut Calculations
  const statusOrder: ProposalStatus[] = [
    'Selesai',
    'Dikerjakan',
    'Disetujui',
    'Ditinjau',
    'Diajukan',
    'Ditolak',
  ];
  const totalProposals = proposals.length;
  const statusCounts = statusOrder
    .map((status) => ({
      status,
      count: proposals.filter((p) => p.status === status).length,
      color: STATUS_COLOR_HEX[status],
      meta: getStatusMeta(status),
    }))
    .filter((s) => s.count > 0);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  // 2. Division Reporting Gauge
  const monthlyTx = treasury.filter((t) => getMonthKey(t.date) === monthKey);
  const reportedCount = divisions.filter((d) =>
    monthlyTx.some((t) => t.divisionId === d.id)
  ).length;
  const reportPct =
    divisions.length > 0 ? Math.round((reportedCount / divisions.length) * 100) : 0;
  const gaugeRadius = 36;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeDash = (reportPct / 100) * gaugeCircumference;

  // 3. Agenda RSVP Bars
  const maxRsvp = Math.max(1, ...agenda.map((a) => a.rsvpCount));

  return (
    <section aria-label="Infografis RT 01" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 cols: Kas Divisi Infographic */}
      <div className="lg:col-span-7">
        <DivisionCashInfographic
          divisions={divisions}
          treasury={treasury}
          monthKey={monthKey}
        />
      </div>

      {/* Right 5 cols: Usulan Donut + Kepatuhan & Partisipasi */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Donut Chart: Status Usulan Warga */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <h3 className="font-display text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Sebaran Status Usulan Warga
          </h3>

          <div className="mt-4 flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="14"
                />
                {totalProposals > 0 &&
                  statusCounts.map((seg) => {
                    const segLen = (seg.count / totalProposals) * circumference;
                    const dashArray = `${segLen} ${circumference - segLen}`;
                    const dashOffset = -cumulativeOffset;
                    cumulativeOffset += segLen;
                    return (
                      <circle
                        key={seg.status}
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="14"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                      />
                    );
                  })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-xl font-bold text-slate-900 tabular-nums leading-none">
                  {totalProposals}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">Usulan</span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 gap-2">
              {statusCounts.map((seg) => (
                <div
                  key={seg.status}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="inline-flex items-center gap-2 text-slate-700">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: seg.color }}
                      aria-hidden="true"
                    />
                    {seg.status}
                  </span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {seg.count} ({Math.round((seg.count / totalProposals) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reporting Rate Gauge + Agenda RSVP Visual */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          {/* Gauge */}
          <div className="sm:col-span-5 flex items-center gap-3">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle
                  cx="48"
                  cy="48"
                  r={gaugeRadius}
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="9"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={gaugeRadius}
                  fill="none"
                  stroke="#047857"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${gaugeDash} ${gaugeCircumference}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-slate-900 tabular-nums">
                {reportPct}%
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">
                Lapor Kas
              </div>
              <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                {reportedCount}/{divisions.length} divisi
              </div>
            </div>
          </div>

          {/* Agenda RSVP Mini Bars */}
          <div className="sm:col-span-7 sm:border-l sm:border-slate-100 sm:pl-5 space-y-2">
            <div className="text-xs font-semibold text-slate-900">
              Partisipasi Agenda
            </div>
            {agenda.slice(0, 3).map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-600 truncate">{item.title}</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                    {item.rsvpCount}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-emerald-700 rounded-sm"
                    style={{ width: `${Math.max(12, Math.round((item.rsvpCount / maxRsvp) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
