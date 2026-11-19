import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  formatDateId,
  formatMonthId,
  formatRelativeTime,
  getDivisionShortLabel,
  getMonthKey,
  getProposalStepIndex,
  getStatusMeta,
  PROPOSAL_STEPS,
} from '../lib/format';
import type { RtSnapshotState, UserRole } from '../types';
import { BeritaSection } from './BeritaSection';
import { CivicInfographics } from './CivicInfographics';
import type { NavTab } from './TopBar';

interface OverviewSectionProps {
  state: RtSnapshotState;
  role: UserRole;
  watchedProposalIds: string[];
  onNavigate: (tab: NavTab) => void;
  onOpenBerita: () => void;
  onSelectProposal: (proposalId: string) => void;
  onOpenProposalForm: () => void;
}

const CURRENT_MONTH = '2026-11';
const FALLBACK_HERO_IMAGE = '/src/assets/images/hero_dinoyo_rt01_1794982207800.jpg';

function getInitials(name: string): string {
  const cleaned = name
    .replace(/^(Bpk\.|Ibu|H\.|Hj\.|Sdr\.)\s*/gi, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'RT';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function PortraitAvatar({
  photoUrl,
  name,
  sizeClass,
}: {
  photoUrl?: string;
  name: string;
  sizeClass: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(photoUrl) && failedUrl !== photoUrl;

  if (showImage && photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`Foto ${name}`}
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(photoUrl)}
        className={`${sizeClass} rounded-xl object-cover border border-slate-200 bg-slate-100 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-display font-bold text-sm flex items-center justify-center shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}

export function OverviewSection({
  state,
  role,
  watchedProposalIds,
  onNavigate,
  onOpenBerita,
  onSelectProposal,
  onOpenProposalForm,
}: OverviewSectionProps) {
  const [heroImgFailed, setHeroImgFailed] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const hero = state.hero;
  const activeHeroImage =
    hero.imageUrl && heroImgFailed !== hero.imageUrl
      ? hero.imageUrl
      : FALLBACK_HERO_IMAGE;

  const pengurusSlides = useMemo(() => {
    const inti = state.officials.map((o) => ({
      key: `off-${o.id}`,
      role: o.position,
      name: o.name,
      sub: o.block,
      photoUrl: o.photoUrl,
    }));
    const coordinators = state.divisions.map((d) => ({
      key: `div-${d.id}`,
      role: `Koordinator ${d.shortName}`,
      name: d.coordinator,
      sub: d.name,
      photoUrl: d.photoUrl,
    }));
    return [...inti, ...coordinators];
  }, [state.officials, state.divisions]);

  useEffect(() => {
    if (activeSlide >= pengurusSlides.length && pengurusSlides.length > 0) {
      setActiveSlide(0);
    }
  }, [activeSlide, pengurusSlides.length]);

  const scrollToSlide = (targetIndex: number) => {
    const container = sliderRef.current;
    if (!container || pengurusSlides.length === 0) return;
    const clamped = Math.max(0, Math.min(targetIndex, pengurusSlides.length - 1));
    const card = container.children[clamped] as HTMLElement | undefined;
    if (card) {
      container.scrollTo({ left: card.offsetLeft, behavior: 'smooth' });
      setActiveSlide(clamped);
    }
  };

  const handleStepSlide = (direction: -1 | 1) => {
    const container = sliderRef.current;
    if (!container || pengurusSlides.length === 0) return;
    const stepSize = Math.max(260, container.clientWidth * 0.75);
    const nextLeft = container.scrollLeft + direction * stepSize;
    container.scrollTo({ left: nextLeft, behavior: 'smooth' });
  };

  const handleSliderScroll = () => {
    const container = sliderRef.current;
    if (!container || container.children.length === 0) return;
    const scrollLeft = container.scrollLeft;
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i] as HTMLElement;
      const diff = Math.abs(child.offsetLeft - scrollLeft);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setActiveSlide(closestIdx);
  };

  const activeProposals = state.proposals.filter(
    (p) => p.status !== 'Selesai' && p.status !== 'Ditolak'
  );
  const completedProposals = state.proposals.filter(
    (p) => p.status === 'Selesai'
  );
  const featuredActivity = state.activities[0];

  const monthlyTransactions = state.treasury.filter(
    (t) => getMonthKey(t.date) === CURRENT_MONTH
  );
  const reportedCount = state.divisions.filter((d) =>
    monthlyTransactions.some((t) => t.divisionId === d.id)
  ).length;

  return (
    <div className="space-y-9">
      {/* Compact Civic Hero */}
      <section className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[300px] lg:min-h-[340px] flex items-end">
        <img
          src={activeHeroImage}
          alt={hero.title}
          referrerPolicy="no-referrer"
          onError={() => setHeroImgFailed(hero.imageUrl)}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-slate-950/15"
        />

        <div className="relative z-10 w-full p-6 sm:p-9 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="max-w-xl">
            <p className="text-xs font-medium text-emerald-300">
              {hero.eyebrow}
            </p>
            <h1 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-[1.15] [text-wrap:balance]">
              {hero.title}
            </h1>
            <p className="mt-2 text-sm text-slate-200">
              {hero.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenProposalForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <span>{hero.primaryCtaLabel || 'Ajukan Usulan'}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('kas')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-white/15 hover:bg-white/25 backdrop-blur-xs border border-white/25 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Wallet className="w-4 h-4" aria-hidden="true" />
              <span>{hero.secondaryCtaLabel || 'Kas Divisi'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Jajaran Pengurus RT 01 / RW 05 (Slide / Carousel) */}
      <section aria-labelledby="jajaran-pengurus-heading" className="space-y-4">
        <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h2
              id="jajaran-pengurus-heading"
              className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-900"
            >
              Jajaran Pengurus {state.siteSettings.regionCode}
            </h2>
            <p className="text-xs text-slate-500">
              Geser atau gunakan tombol untuk melihat pengurus inti & koordinator divisi
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-xs font-mono text-slate-500 tabular-nums mr-1">
              {pengurusSlides.length > 0 ? activeSlide + 1 : 0}/{pengurusSlides.length}
            </span>
            <button
              type="button"
              onClick={() => handleStepSlide(-1)}
              aria-label="Geser pengurus ke kiri"
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleStepSlide(1)}
              aria-label="Geser pengurus ke kanan"
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          ref={sliderRef}
          onScroll={handleSliderScroll}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {pengurusSlides.map((person) => (
            <article
              key={person.key}
              className="w-[260px] sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)] shrink-0 snap-start bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3.5"
            >
              <PortraitAvatar
                photoUrl={person.photoUrl}
                name={person.name}
                sizeClass="w-14 h-14"
              />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-emerald-800 truncate">
                  {person.role}
                </div>
                <h3 className="font-display text-sm font-bold text-slate-900 truncate mt-0.5">
                  {person.name}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">{person.sub}</p>
              </div>
            </article>
          ))}
        </div>

        {pengurusSlides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {pengurusSlides.map((person, idx) => (
              <button
                key={person.key}
                type="button"
                onClick={() => scrollToSlide(idx)}
                aria-label={`Lihat ${person.name}`}
                className={`h-1.5 rounded-full transition-all ${
                  activeSlide === idx
                    ? 'w-5 bg-emerald-800'
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4-Column Minimal KPI Strip */}
      <section
        aria-label="Ringkasan angka RT 01"
        className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200"
      >
        <div className="p-4 sm:p-5">
          <div className="text-xs text-slate-500">Kas {formatMonthId(CURRENT_MONTH)}</div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {reportedCount}/{state.divisions.length} Divisi
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-xs text-slate-500">Usulan Diproses</div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {activeProposals.length} Aktif · {completedProposals.length} Selesai
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-xs text-slate-500">Agenda Terdekat</div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">
            {state.agenda[0] ? formatDateId(state.agenda[0].date) : '-'}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-xs text-slate-500">Usulan Dipantau</div>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-emerald-800 tabular-nums">
            {watchedProposalIds.length} Usulan
          </div>
        </div>
      </section>

      {/* Visual Infografis Section */}
      <CivicInfographics
        divisions={state.divisions}
        treasury={state.treasury}
        proposals={state.proposals}
        agenda={state.agenda}
        monthKey={CURRENT_MONTH}
      />

      {/* Compact Proposal Tracker + Next Activity Snapshot */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <h2 className="font-display text-base font-bold text-slate-900">
              Progress Usulan Terbaru
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('usulan')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 whitespace-nowrap"
            >
              Semua Usulan →
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {state.proposals.slice(0, 3).map((proposal) => {
              const meta = getStatusMeta(proposal.status);
              const stepIdx = getProposalStepIndex(proposal.status);
              const isWatched = watchedProposalIds.includes(proposal.id);

              return (
                <button
                  key={proposal.id}
                  type="button"
                  onClick={() => onSelectProposal(proposal.id)}
                  className="w-full text-left py-3.5 hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition-colors block"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono font-semibold text-slate-700">
                          {proposal.code}
                        </span>
                        <span>·</span>
                        <span>{getDivisionShortLabel(proposal.divisionId, state.divisions)}</span>
                        {isWatched && (
                          <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
                            · <Eye className="w-3 h-3" aria-hidden="true" /> Dipantau
                          </span>
                        )}
                      </div>
                      <h3 className="mt-0.5 text-sm font-semibold text-slate-900 truncate">
                        {proposal.title}
                      </h3>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0 ${meta.textClass}`}
                    >
                      {proposal.status === 'Selesai' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      {meta.label}
                    </span>
                  </div>

                  {proposal.status !== 'Ditolak' && (
                    <div className="mt-2.5 grid grid-cols-5 gap-1.5">
                      {PROPOSAL_STEPS.map((step, i) => (
                        <div
                          key={step}
                          title={step}
                          className={`h-1.5 rounded-sm ${
                            i <= stepIdx ? 'bg-emerald-700' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="mt-1.5 text-[11px] text-slate-400">
                    {formatRelativeTime(proposal.updatedAt)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Activity Visual Tile */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          {featuredActivity ? (
            <>
              <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                {featuredActivity.imageUrl && (
                  <img
                    src={featuredActivity.imageUrl}
                    alt={featuredActivity.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="text-[11px] text-emerald-200 font-medium">
                    {formatDateId(featuredActivity.date)} · {featuredActivity.time}
                  </div>
                  <h3 className="mt-0.5 font-display text-sm font-bold leading-snug line-clamp-2">
                    {featuredActivity.title}
                  </h3>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-600 truncate">
                  {featuredActivity.location}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('agenda')}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 whitespace-nowrap shrink-0"
                >
                  Agenda →
                </button>
              </div>
            </>
          ) : (
            <div className="p-6 text-sm text-slate-500">Belum ada kegiatan.</div>
          )}
        </div>
      </section>

      {/* Berita RT Terbaru */}
      <section aria-label={`Berita ${state.siteSettings.regionCode} Terbaru`}>
        <BeritaSection
          news={state.news}
          role={role}
          compact
          regionCode={state.siteSettings.regionCode}
          locationName={state.siteSettings.locationName}
          onViewAll={onOpenBerita}
        />
      </section>
    </div>
  );
}
