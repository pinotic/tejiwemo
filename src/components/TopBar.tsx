export type NavTab =
  | 'ringkasan'
  | 'berita'
  | 'kas'
  | 'notulen'
  | 'usulan'
  | 'agenda';

interface TopBarProps {
  webTitle?: string;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenProposalForm: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'ringkasan', label: 'Home' },
  { id: 'berita', label: 'Berita' },
  { id: 'kas', label: 'Kas Divisi' },
  { id: 'notulen', label: 'Notulen' },
  { id: 'usulan', label: 'Usulan Warga' },
  { id: 'agenda', label: 'Agenda' },
];

export function TopBar({
  webTitle = 'Portal Warga',
  activeTab,
  onSelectTab,
  onOpenProposalForm,
}: TopBarProps) {
  return (
    <header className="md:sticky md:top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Logo + Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('ringkasan')}
          className="inline-flex items-center gap-2.5 font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-sm"
        >
          <img
            src="/assets/aistudio/500309821_1300971965363211_2221899409798109426_n__1__55125c15.png"
            alt={`Logo ${webTitle}`}
            className="h-8 md:h-9 w-auto object-contain shrink-0"
          />
          <span>{webTitle}</span>
        </button>

        {/* Zone 2: 5 single-line text navigation links */}
        <nav
          aria-label="Navigasi utama portal RT"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-sm ${
                  isActive
                    ? 'text-emerald-800'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-700"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenProposalForm}
            className="px-3.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            Ajukan Usulan
          </button>
        </div>
      </div>
    </header>
  );
}

