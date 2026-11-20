import { useCallback, useEffect, useRef, useState } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import type {
  NotificationItem,
  ProposalItem,
  RtRealtimeEvent,
  RtSnapshotState,
} from '../types';

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting';

const EMPTY_STATE: RtSnapshotState = {
  siteSettings: {
    webTitle: 'Portal Warga',
    regionCode: 'RT 01 / RW 05',
    regionIdentity: 'RT 01 / RW 05 · Kelurahan Dinoyo',
    locationName: 'Balai Warga Kelurahan Dinoyo',
  },
  hero: {
    eyebrow: 'RT 01 / RW 05 · Kelurahan Dinoyo',
    title: 'Portal Warga RT 01 Dinoyo',
    subtitle:
      'Info kegiatan, laporan kas divisi bulanan, dan pantau usulan secara real-time.',
    imageUrl: '/src/assets/images/hero_dinoyo_rt01_1794982207800.jpg',
    primaryCtaLabel: 'Ajukan Usulan',
    secondaryCtaLabel: 'Kas Divisi',
  },
  officials: [],
  divisions: [],
  activities: [],
  treasury: [],
  proposals: [],
  agenda: [],
  news: [],
  notulen: [],
  notifications: [],
};

const READ_NOTIFICATIONS_KEY = 'portal_warga_read_notifications';

const ALLOWED_NOTIFICATION_TYPES = new Set<NotificationItem['type']>([
  'agenda_new',
  'proposal_new',
  'proposal_status',
  'treasury_new',
]);

function loadReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((id): id is string => typeof id === 'string'))
      : new Set();
  } catch {
    return new Set();
  }
}

function persistReadNotificationIds(ids: Set<string>): void {
  try {
    const list = Array.from(ids).slice(-200);
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors
  }
}

function applyLocalReadState(
  notifications: NotificationItem[],
  readIds: Set<string>
): NotificationItem[] {
  return notifications
    .filter((n) => ALLOWED_NOTIFICATION_TYPES.has(n.type))
    .map((n) => (readIds.has(n.id) ? { ...n, read: true } : n));
}

function mergeById<T extends { id: string }>(list: T[], incoming: T, prepend = true): T[] {
  const exists = list.some((item) => item.id === incoming.id);
  if (exists) {
    return list.map((item) => (item.id === incoming.id ? incoming : item));
  }
  return prepend ? [incoming, ...list] : [...list, incoming];
}

export function useRtRealtime() {
  const [state, setState] = useState<RtSnapshotState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const [watchedProposalIds, setWatchedProposalIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rt04_watched_proposals');
      return saved ? (JSON.parse(saved) as string[]) : ['prop-1', 'prop-3'];
    } catch {
      return ['prop-1', 'prop-3'];
    }
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const readIdsRef = useRef<Set<string>>(loadReadNotificationIds());

  const pushToast = useCallback((notification: NotificationItem) => {
    if (!ALLOWED_NOTIFICATION_TYPES.has(notification.type)) return;
    setToasts((prev) => {
      if (prev.some((t) => t.id === notification.id)) return prev;
      return [notification, ...prev].slice(0, 3);
    });
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== notification.id));
    }, 6500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleWatchProposal = useCallback((proposalId: string) => {
    setWatchedProposalIds((prev) => {
      const next = prev.includes(proposalId)
        ? prev.filter((id) => id !== proposalId)
        : [...prev, proposalId];
      try {
        localStorage.setItem('rt04_watched_proposals', JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, []);

  const fetchInitialState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error || `Gagal memuat data portal RT (HTTP ${res.status})`);
      }
      const data = (await res.json()) as RtSnapshotState;
      if (mountedRef.current) {
        setState({
          ...data,
          notulen: Array.isArray(data.notulen) ? data.notulen : [],
          notifications: applyLocalReadState(
            Array.isArray(data.notifications) ? data.notifications : [],
            readIdsRef.current
          ),
        });
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan jaringan');
        setLoading(false);
      }
    }
  }, []);

  const applyEvent = useCallback(
    (event: RtRealtimeEvent) => {
      switch (event.type) {
        case 'state:sync':
          setState({
            ...EMPTY_STATE,
            ...event.payload,
            siteSettings: event.payload.siteSettings || EMPTY_STATE.siteSettings,
            hero: event.payload.hero || EMPTY_STATE.hero,
            news: Array.isArray(event.payload.news) ? event.payload.news : [],
            notulen: Array.isArray(event.payload.notulen) ? event.payload.notulen : [],
            notifications: applyLocalReadState(
              Array.isArray(event.payload.notifications) ? event.payload.notifications : [],
              readIdsRef.current
            ),
          });
          setLoading(false);
          setError(null);
          break;
        case 'site:updated':
          setState((prev) => ({
            ...prev,
            siteSettings: event.payload.siteSettings,
            hero: event.payload.hero || prev.hero,
          }));
          break;
        case 'hero:updated':
          setState((prev) => ({
            ...prev,
            hero: event.payload.hero,
          }));
          break;
        case 'official:created':
          setState((prev) => ({
            ...prev,
            officials: mergeById(prev.officials, event.payload.official, false),
          }));
          break;
        case 'official:updated':
          setState((prev) => ({
            ...prev,
            officials: mergeById(prev.officials, event.payload.official, false),
          }));
          break;
        case 'official:deleted':
          setState((prev) => ({
            ...prev,
            officials: prev.officials.filter((o) => o.id !== event.payload.officialId),
          }));
          break;
        case 'proposal:created':
          setState((prev) => ({
            ...prev,
            proposals: mergeById(prev.proposals, event.payload.proposal, true),
            notifications: mergeById(prev.notifications, event.payload.notification, true),
          }));
          pushToast(event.payload.notification);
          break;
        case 'proposal:updated':
          setState((prev) => ({
            ...prev,
            proposals: mergeById<ProposalItem>(prev.proposals, event.payload.proposal, true),
            notifications: event.payload.notification
              ? mergeById(prev.notifications, event.payload.notification, true)
              : prev.notifications,
          }));
          if (event.payload.notification) {
            pushToast(event.payload.notification);
          }
          break;
        case 'proposal:deleted':
          setState((prev) => ({
            ...prev,
            proposals: prev.proposals.filter((p) => p.id !== event.payload.proposalId),
          }));
          break;
        case 'treasury:created':
          setState((prev) => ({
            ...prev,
            treasury: mergeById(prev.treasury, event.payload.transaction, true),
            notifications: mergeById(prev.notifications, event.payload.notification, true),
          }));
          pushToast(event.payload.notification);
          break;
        case 'treasury:updated':
          setState((prev) => ({
            ...prev,
            treasury: mergeById(prev.treasury, event.payload.transaction, false),
          }));
          break;
        case 'treasury:deleted':
          setState((prev) => ({
            ...prev,
            treasury: prev.treasury.filter((t) => t.id !== event.payload.transactionId),
          }));
          break;
        case 'division:created':
          setState((prev) => ({
            ...prev,
            divisions: mergeById(prev.divisions, event.payload.division, false),
          }));
          break;
        case 'division:updated':
          setState((prev) => ({
            ...prev,
            divisions: mergeById(prev.divisions, event.payload.division, false),
          }));
          break;
        case 'division:deleted':
          setState((prev) => ({
            ...prev,
            divisions: prev.divisions.filter((d) => d.id !== event.payload.divisionId),
            treasury: prev.treasury.filter((t) => t.divisionId !== event.payload.divisionId),
          }));
          break;
        case 'activity:created':
          setState((prev) => ({
            ...prev,
            activities: mergeById(prev.activities, event.payload.activity, true),
          }));
          break;
        case 'agenda:created':
          setState((prev) => ({
            ...prev,
            agenda: mergeById(prev.agenda, event.payload.agenda, false).sort((a, b) =>
              a.date.localeCompare(b.date)
            ),
            notifications: mergeById(prev.notifications, event.payload.notification, true),
          }));
          pushToast(event.payload.notification);
          break;
        case 'agenda:updated':
          setState((prev) => ({
            ...prev,
            agenda: mergeById(prev.agenda, event.payload.agenda, false).sort((a, b) =>
              a.date.localeCompare(b.date)
            ),
          }));
          break;
        case 'agenda:deleted':
          setState((prev) => ({
            ...prev,
            agenda: prev.agenda.filter((a) => a.id !== event.payload.agendaId),
          }));
          break;
        case 'news:created':
          setState((prev) => ({
            ...prev,
            news: mergeById(prev.news, event.payload.news, true),
          }));
          break;
        case 'news:updated':
          setState((prev) => ({
            ...prev,
            news: mergeById(prev.news, event.payload.news, false),
          }));
          break;
        case 'news:deleted':
          setState((prev) => ({
            ...prev,
            news: prev.news.filter((n) => n.id !== event.payload.newsId),
          }));
          break;
        case 'notulen:created':
          setState((prev) => ({
            ...prev,
            notulen: mergeById(prev.notulen, event.payload.notulen, true).sort((a, b) =>
              b.date.localeCompare(a.date)
            ),
          }));
          break;
        case 'notulen:updated':
          setState((prev) => ({
            ...prev,
            notulen: mergeById(prev.notulen, event.payload.notulen, false).sort((a, b) =>
              b.date.localeCompare(a.date)
            ),
          }));
          break;
        case 'notulen:deleted':
          setState((prev) => ({
            ...prev,
            notulen: prev.notulen.filter((n) => n.id !== event.payload.notulenId),
          }));
          break;
        case 'notifications:read':
          setState((prev) => ({
            ...prev,
            notifications: prev.notifications.map((n) => {
              if (event.payload.all) return { ...n, read: true };
              if (event.payload.id && n.id === event.payload.id) {
                return { ...n, read: true };
              }
              return n;
            }),
          }));
          break;
      }
    },
    [pushToast]
  );

  const latestNotifIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    latestNotifIdsRef.current = new Set(state.notifications.map((n) => n.id));
  }, [state.notifications]);

  useEffect(() => {
    mountedRef.current = true;
    fetchInitialState();

    // Mode 1: Vercel + Supabase Realtime (postgres_changes on rt_app_state)
    if (supabaseClient) {
      const channel = supabaseClient
        .channel('rt_app_state_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rt_app_state',
            filter: 'id=eq.main',
          },
          (payload) => {
            if (!mountedRef.current) return;
            const nextRow = payload.new as { data?: RtSnapshotState } | undefined;
            if (!nextRow?.data) return;
            const incoming: RtSnapshotState = {
              ...EMPTY_STATE,
              ...nextRow.data,
              siteSettings: nextRow.data.siteSettings || EMPTY_STATE.siteSettings,
              hero: nextRow.data.hero || EMPTY_STATE.hero,
              news: Array.isArray(nextRow.data.news) ? nextRow.data.news : [],
              notulen: Array.isArray(nextRow.data.notulen) ? nextRow.data.notulen : [],
              notifications: applyLocalReadState(
                Array.isArray(nextRow.data.notifications) ? nextRow.data.notifications : [],
                readIdsRef.current
              ),
            };
            const prevIds = latestNotifIdsRef.current;
            const newNotif = (incoming.notifications || []).find(
              (n) => !n.read && !prevIds.has(n.id)
            );
            setState(incoming);
            setLoading(false);
            setError(null);
            if (newNotif) {
              pushToast(newNotif);
            }
          }
        )
        .subscribe((status) => {
          if (!mountedRef.current) return;
          if (status === 'SUBSCRIBED') {
            setConnectionState('connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionState('reconnecting');
          }
        });

      return () => {
        mountedRef.current = false;
        supabaseClient?.removeChannel(channel);
      };
    }

    // Mode 2: Polling fallback on serverless hosting (e.g. Vercel without VITE_SUPABASE_ANON_KEY)
    const isVercelProd =
      window.location.hostname.endsWith('.vercel.app') ||
      (import.meta.env.PROD && window.location.protocol === 'https:');
    if (isVercelProd && !window.location.hostname.includes('run.app')) {
      setConnectionState('connected');
      const pollTimer = window.setInterval(() => {
        if (mountedRef.current) fetchInitialState();
      }, 15000);
      return () => {
        mountedRef.current = false;
        window.clearInterval(pollTimer);
      };
    }

    // Mode 3: Local Node/Express WebSocket (/ws)
    let retryDelay = 1200;

    function connectWebSocket() {
      if (!mountedRef.current) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mountedRef.current) return;
          setConnectionState('connected');
          retryDelay = 1200;
        };

        ws.onmessage = (msg) => {
          if (!mountedRef.current) return;
          try {
            const event = JSON.parse(msg.data as string) as RtRealtimeEvent;
            applyEvent(event);
          } catch {
            // Ignore malformed socket frames
          }
        };

        ws.onclose = () => {
          if (!mountedRef.current) return;
          setConnectionState('reconnecting');
          reconnectTimerRef.current = window.setTimeout(() => {
            retryDelay = Math.min(retryDelay * 1.5, 8000);
            connectWebSocket();
          }, retryDelay);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        setConnectionState('reconnecting');
      }
    }

    connectWebSocket();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, [applyEvent, fetchInitialState, pushToast]);

  const markNotificationRead = useCallback((id: string) => {
    const nextRead = new Set(readIdsRef.current);
    nextRead.add(id);
    readIdsRef.current = nextRead;
    persistReadNotificationIds(nextRead);

    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => {
      const nextRead = new Set(readIdsRef.current);
      prev.notifications.forEach((n) => nextRead.add(n.id));
      readIdsRef.current = nextRead;
      persistReadNotificationIds(nextRead);

      return {
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, read: true })),
      };
    });
  }, []);

  return {
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
    refreshState: fetchInitialState,
  };
}
