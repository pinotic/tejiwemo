import { useCallback, useEffect, useState } from 'react';
import { AgendaSection } from './components/AgendaSection';
import { BeritaSection } from './components/BeritaSection';
import { KasDivisiSection } from './components/KasDivisiSection';
import { LiveToastStack } from './components/LiveToastStack';
import { MobileBottomNav } from './components/MobileBottomNav';
import { NotificationDrawer } from './components/NotificationDrawer';
import { OverviewSection } from './components/OverviewSection';
import { PengurusLoginPage } from './components/PengurusLoginPage';
import { PengurusPortalPage } from './components/PengurusPortalPage';
import { ProposalFormModal } from './components/ProposalFormModal';
import { type NavTab, TopBar } from './components/TopBar';
import { UsulanWargaSection } from './components/UsulanWargaSection';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { useRtRealtime } from './hooks/useRtRealtime';
import { fetchCurrentUser, logoutSession } from './lib/auth';
import type { AuthUser } from './types';

type PortalRoute = 'warga' | 'pengurus' | 'superadmin';

function resolveRouteFromLocation(): PortalRoute {
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/superadmin')) return 'superadmin';
  if (path.startsWith('/pengurus')) return 'pengurus';
  return 'warga';
}

export default function App() {
  const {
    state,
    loading,
    error,
    connectionState,
    toasts,
    dismissToast,
    watchedProposalIds,
    toggleWatchProposal,
    markNotificationRead,
    markAllNotificationsRead,
    refreshState,
  } = useRtRealtime();

  const [portalRoute, setPortalRoute] = useState<PortalRoute>(resolveRouteFromLocation);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState<NavTab>('ringkasan');
  const [proposalFormOpen, setProposalFormOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((user) => {
        if (active) {
          setAuthUser(user);
          setAuthChecking(false);
        }
      })
      .catch(() => {
        if (active) setAuthChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setPortalRoute(resolveRouteFromLocation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const fullTitle = `${state.siteSettings.webTitle} · ${state.siteSettings.regionIdentity}`;
    document.title = fullTitle;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', fullTitle);
    }
  }, [state.siteSettings]);

  const navigatePortal = useCallback((target: PortalRoute) => {
    const targetPath =
      target === 'superadmin'
        ? '/superadmin'
        : target === 'pengurus'
          ? '/pengurus'
          : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setPortalRoute(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const handleInspectProposal = (proposalId: string) => {
    navigatePortal('warga');
    setActiveTab('usulan');
    setSelectedProposalId(proposalId);
  };

  const handleProposalSubmitted = (createdId: string) => {
    setProposalFormOpen(false);
    if (!watchedProposalIds.includes(createdId)) {
      toggleWatchProposal(createdId);
    }
    setActiveTab('usulan');
    setSelectedProposalId(createdId);
  };

  const handleLogout = async () => {
    await logoutSession();
    setAuthUser(null);
    navigatePortal('pengurus');
  };

  // Dedicated Separated Portal: Laman Pengurus & Superadmin (/pengurus or /superadmin)
  if (portalRoute === 'pengurus' || portalRoute === 'superadmin') {
    return (
      <>
        {authChecking ? (
          <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
            <div className="bg-white border border-slate-200 rounded-xl px-6 py-5 text-sm text-slate-600">
              Memeriksa sesi akun pengurus...
            </div>
          </div>
        ) : !authUser ? (
          <PengurusLoginPage
            webTitle={state.siteSettings.webTitle}
            regionIdentity={state.siteSettings.regionIdentity}
            onLoginSuccess={(user) => {
              setAuthUser(user);
              navigatePortal(user.role === 'superadmin' ? 'superadmin' : 'pengurus');
            }}
            onBackToWarga={() => navigatePortal('warga')}
          />
        ) : (
          <PengurusPortalPage
            authUser={authUser}
            state={state}
            connectionState={connectionState}
            unreadCount={unreadCount}
            initialTool={
              portalRoute === 'superadmin' && authUser.role === 'superadmin'
                ? 'akun_pengurus'
                : 'input_kas'
            }
            onOpenNotifications={() => setNotificationsOpen((prev) => !prev)}
            onBackToWarga={() => {
              setNotificationsOpen(false);
              navigatePortal('warga');
            }}
            onLogout={handleLogout}
          />
        )}

        <NotificationDrawer
          open={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          notifications={state.notifications}
          watchedProposalIds={watchedProposalIds}
          connectionState={connectionState}
          onMarkRead={markNotificationRead}
          onMarkAllRead={markAllNotificationsRead}
          onInspectProposal={handleInspectProposal}
          topOffsetClass="top-16"
        />

        <LiveToastStack
          toasts={toasts}
          onDismiss={dismissToast}
          onInspectProposal={handleInspectProposal}
        />
      </>
    );
  }

  // Public Citizen Portal: Laman Warga (/)
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900">
      <TopBar
        webTitle={state.siteSettings.webTitle}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setNotificationsOpen(false);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenProposalForm={() => {
          setNotificationsOpen(false);
          setProposalFormOpen(true);
        }}
      />

      <WorkspaceToolbar
        regionIdentity={state.siteSettings.regionIdentity}
        authUser={authUser}
        onOpenPengurusPortal={() => {
          setNotificationsOpen(false);
          navigatePortal(authUser?.role === 'superadmin' ? 'superadmin' : 'pengurus');
        }}
        unreadCount={unreadCount}
        onOpenNotifications={() => setNotificationsOpen((prev) => !prev)}
        connectionState={connectionState}
      />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {loading ? (
          <div className="space-y-6" aria-busy="true" aria-label="Memuat data portal RT">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
              <div className="lg:col-span-5 h-72 bg-white border border-slate-200 rounded-xl animate-pulse" />
            </div>
            <div className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse" />
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-xl p-8 text-center max-w-lg mx-auto">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Gagal Memuat Data Portal RT
            </h2>
            <p className="mt-2 text-sm text-slate-600">{error}</p>
            <button
              type="button"
              onClick={refreshState}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg"
            >
              Muat Ulang Data
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'ringkasan' && (
              <OverviewSection
                state={state}
                role="warga"
                watchedProposalIds={watchedProposalIds}
                onNavigate={setActiveTab}
                onOpenBerita={() => {
                  setActiveTab('berita');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSelectProposal={handleInspectProposal}
                onOpenProposalForm={() => setProposalFormOpen(true)}
              />
            )}

            {activeTab === 'berita' && (
              <BeritaSection
                news={state.news}
                role="warga"
                regionCode={state.siteSettings.regionCode}
                locationName={state.siteSettings.locationName}
              />
            )}

            {activeTab === 'kas' && (
              <KasDivisiSection
                divisions={state.divisions}
                treasury={state.treasury}
                role="warga"
              />
            )}

            {activeTab === 'usulan' && (
              <UsulanWargaSection
                proposals={state.proposals}
                divisions={state.divisions}
                role="warga"
                watchedProposalIds={watchedProposalIds}
                onToggleWatch={toggleWatchProposal}
                onOpenProposalForm={() => setProposalFormOpen(true)}
                selectedProposalId={selectedProposalId}
                onSelectProposalId={setSelectedProposalId}
              />
            )}

            {activeTab === 'agenda' && (
              <AgendaSection
                agenda={state.agenda}
                divisions={state.divisions}
                role="warga"
                regionCode={state.siteSettings.regionCode}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12 pb-24 md:pb-0">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/500309821_1300971965363211_2221899409798109426_n__1__55125c15.png"
              alt={`Logo ${state.siteSettings.webTitle}`}
              className="h-7 w-auto object-contain shrink-0"
            />
            <div>
              <span className="font-semibold text-slate-800">
                {state.siteSettings.webTitle} · {state.siteSettings.regionIdentity}
              </span>{' '}
              · {state.siteSettings.locationName}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('kas')}
              className="hover:text-slate-900 transition-colors"
            >
              Transparansi Kas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('usulan')}
              className="hover:text-slate-900 transition-colors"
            >
              Progress Usulan
            </button>
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="hover:text-slate-900 transition-colors"
            >
              Pusat Notifikasi
            </button>
            <button
              type="button"
              onClick={() =>
                navigatePortal(
                  authUser?.role === 'superadmin' ? 'superadmin' : 'pengurus'
                )
              }
              className="font-medium text-emerald-800 hover:text-emerald-950 transition-colors"
            >
              Laman Pengurus
            </button>
          </div>
        </div>
      </footer>

      <MobileBottomNav
        regionCode={state.siteSettings.regionCode}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setNotificationsOpen(false);
          setActiveTab(tab);
        }}
        onOpenProposalForm={() => {
          setNotificationsOpen(false);
          setProposalFormOpen(true);
        }}
        onOpenNotifications={() => setNotificationsOpen((prev) => !prev)}
        notificationsOpen={notificationsOpen}
        unreadCount={unreadCount}
        authUser={authUser}
        onOpenPengurusPortal={() => {
          setNotificationsOpen(false);
          navigatePortal(authUser?.role === 'superadmin' ? 'superadmin' : 'pengurus');
        }}
      />

      <ProposalFormModal
        open={proposalFormOpen}
        divisions={state.divisions}
        onClose={() => setProposalFormOpen(false)}
        onSuccess={handleProposalSubmitted}
      />

      <NotificationDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={state.notifications}
        watchedProposalIds={watchedProposalIds}
        connectionState={connectionState}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
        onInspectProposal={handleInspectProposal}
      />

      <LiveToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        onInspectProposal={handleInspectProposal}
      />
    </div>
  );
}
