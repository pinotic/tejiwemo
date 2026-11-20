import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type Messaging,
} from 'firebase/messaging';

export interface WebPushConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface PushStatusResponse {
  webPushReady: boolean;
  serverPushReady: boolean;
  firebaseConfig: WebPushConfig | null;
  vapidKey: string | null;
}

export type BrowserPushState =
  | 'checking'
  | 'unsupported'
  | 'unconfigured'
  | 'denied'
  | 'prompt'
  | 'subscribed';

const FCM_TOKEN_STORAGE_KEY = 'portal_warga_fcm_token';

function getEnvWebConfig(): { firebaseConfig: WebPushConfig | null; vapidKey: string | null } {
  const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY || '').trim();
  const authDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim();
  const projectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();
  const storageBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim();
  const messagingSenderId = (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim();
  const appId = (import.meta.env.VITE_FIREBASE_APP_ID || '').trim();
  const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY || '').trim();

  if (!apiKey || !projectId || !messagingSenderId || !appId || !vapidKey) {
    return { firebaseConfig: null, vapidKey: null };
  }

  return {
    firebaseConfig: {
      apiKey,
      authDomain: authDomain || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: storageBucket || `${projectId}.firebasestorage.app`,
      messagingSenderId,
      appId,
    },
    vapidKey,
  };
}

let cachedPushConfig: PushStatusResponse | null = null;

export async function fetchPushConfig(): Promise<PushStatusResponse> {
  if (cachedPushConfig) return cachedPushConfig;

  const envConfig = getEnvWebConfig();
  try {
    const res = await fetch('/api/push/config');
    if (res.ok) {
      const serverData = (await res.json()) as PushStatusResponse;
      const merged: PushStatusResponse = {
        webPushReady: Boolean(serverData.webPushReady || envConfig.firebaseConfig),
        serverPushReady: Boolean(serverData.serverPushReady),
        firebaseConfig: serverData.firebaseConfig || envConfig.firebaseConfig,
        vapidKey: serverData.vapidKey || envConfig.vapidKey,
      };
      cachedPushConfig = merged;
      return merged;
    }
  } catch {
    // Fall back to Vite build-time env if offline/unavailable
  }

  const fallback: PushStatusResponse = {
    webPushReady: Boolean(envConfig.firebaseConfig && envConfig.vapidKey),
    serverPushReady: false,
    firebaseConfig: envConfig.firebaseConfig,
    vapidKey: envConfig.vapidKey,
  };
  cachedPushConfig = fallback;
  return fallback;
}

function getOrCreateFirebaseApp(config: WebPushConfig): FirebaseApp {
  const existing = getApps().find((a) => a.name === 'portal-warga-fcm');
  if (existing) return existing;
  return initializeApp(config, 'portal-warga-fcm');
}

async function getMessagingInstance(config: WebPushConfig): Promise<Messaging | null> {
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  const app = getOrCreateFirebaseApp(config);
  return getMessaging(app);
}

export async function detectBrowserPushState(): Promise<{
  state: BrowserPushState;
  serverPushReady: boolean;
  unsupportedReason?: string;
}> {
  const cfg = await fetchPushConfig();
  if (typeof window === 'undefined') {
    return { state: 'unsupported', serverPushReady: cfg.serverPushReady };
  }

  if (!window.isSecureContext) {
    return {
      state: 'unsupported',
      serverPushReady: cfg.serverPushReady,
      unsupportedReason:
        'Halaman harus dibuka lewat alamat HTTPS (bukan HTTP biasa) agar notifikasi push dapat aktif.',
    };
  }

  if (window.self !== window.top) {
    return {
      state: 'unsupported',
      serverPushReady: cfg.serverPushReady,
      unsupportedReason:
        'Portal sedang dibuka di dalam iframe/preview. Buka alamat web langsung di tab Google Chrome.',
    };
  }

  const ua = navigator.userAgent || '';
  const isInAppWebView = /\bwv\b|FBAN|FBAV|Instagram|Line\/|MicroMessenger/i.test(ua);

  if (
    !('Notification' in window) ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return {
      state: 'unsupported',
      serverPushReady: cfg.serverPushReady,
      unsupportedReason: isInAppWebView
        ? 'Anda membuka link dari browser di dalam aplikasi (misal WhatsApp). Ketuk ikon titik tiga (⋮) di pojok kanan atas lalu pilih "Buka di Chrome".'
        : 'Browser ini belum mendukung Web Push. Gunakan Google Chrome terbaru di Android/Desktop (atau di iPhone/iPad: Share → Tambah ke Layar Utama).',
    };
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return {
      state: 'unsupported',
      serverPushReady: cfg.serverPushReady,
      unsupportedReason:
        'Mode penyamaran (Incognito) atau pengaturan browser memblokir Service Worker / penyimpanan push. Gunakan tab Google Chrome biasa.',
    };
  }

  if (!cfg.webPushReady || !cfg.firebaseConfig || !cfg.vapidKey) {
    return { state: 'unconfigured', serverPushReady: cfg.serverPushReady };
  }

  if (Notification.permission === 'denied') {
    return { state: 'denied', serverPushReady: cfg.serverPushReady };
  }

  const savedToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  if (Notification.permission === 'granted' && savedToken) {
    return { state: 'subscribed', serverPushReady: cfg.serverPushReady };
  }

  return { state: 'prompt', serverPushReady: cfg.serverPushReady };
}

export async function subscribeWebPush(): Promise<string> {
  const cfg = await fetchPushConfig();
  if (!cfg.webPushReady || !cfg.firebaseConfig || !cfg.vapidKey) {
    throw new Error('Konfigurasi Firebase Cloud Messaging (FCM) belum lengkap di server.');
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    throw new Error('Browser ini belum mendukung notifikasi push.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? 'Izin notifikasi ditolak browser. Aktifkan melalui ikon gembok di bilah alamat.'
        : 'Izin notifikasi belum diberikan.'
    );
  }

  const messaging = await getMessagingInstance(cfg.firebaseConfig);
  if (!messaging) {
    throw new Error('Browser atau mode penyamaran ini tidak mendukung Firebase Messaging.');
  }

  const registration = await navigator.serviceWorker.register('/api/push/sw', {
    scope: '/',
  });
  await navigator.serviceWorker.ready;

  const token = await getToken(messaging, {
    vapidKey: cfg.vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error('Gagal mendapatkan token perangkat dari Firebase.');
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform: 'web' }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || 'Gagal mendaftarkan perangkat ke server.');
  }

  localStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
  attachForegroundListener(messaging, registration);
  return token;
}

export async function unsubscribeWebPush(): Promise<void> {
  const savedToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  const cfg = await fetchPushConfig();

  if (foregroundUnsubscribe) {
    foregroundUnsubscribe();
    foregroundUnsubscribe = null;
  }

  if (cfg.firebaseConfig) {
    try {
      const messaging = await getMessagingInstance(cfg.firebaseConfig);
      if (messaging) {
        await deleteToken(messaging).catch(() => undefined);
      }
    } catch {
      // Ignore Firebase client cleanup failures
    }
  }

  if (savedToken) {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: savedToken }),
    }).catch(() => undefined);
  }

  localStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
}

let foregroundUnsubscribe: (() => void) | null = null;
let foregroundCallback: (() => void) | undefined;

function attachForegroundListener(
  messaging: Messaging,
  registration?: ServiceWorkerRegistration
): () => void {
  if (foregroundUnsubscribe) {
    foregroundUnsubscribe();
    foregroundUnsubscribe = null;
  }
  const unsub = onMessage(messaging, async (payload) => {
    foregroundCallback?.();
    const shouldShowOsNotif =
      Notification.permission === 'granted' &&
      (!document.hasFocus() ||
        document.visibilityState !== 'visible' ||
        payload.data?.forceDisplay === '1');
    if (shouldShowOsNotif) {
      const title =
        payload.notification?.title || payload.data?.title || 'Portal Warga RT 01 Dinoyo';
      const body =
        payload.notification?.body || payload.data?.body || 'Ada pembaruan baru di Portal Warga.';
      const icon =
        '/assets/aistudio/500309821_1300971965363211_2221899409798109426_n__1__55125c15.png';
      try {
        const reg = registration || (await navigator.serviceWorker.getRegistration('/'));
        if (reg) {
          await reg.showNotification(title, {
            body,
            icon,
            badge: icon,
            data: payload.data || {},
          });
          return;
        }
      } catch {
        // Fallback to Notification constructor below
      }
      try {
        new Notification(title, { body, icon });
      } catch {
        // Ignore on platforms where Notification constructor is restricted
      }
    }
  });
  foregroundUnsubscribe = unsub;
  return unsub;
}

export async function syncExistingWebPushSubscription(
  onForegroundMessage?: () => void
): Promise<() => void> {
  foregroundCallback = onForegroundMessage;
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return () => {};
  }
  if (Notification.permission !== 'granted') {
    return () => {};
  }

  const savedToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  if (!savedToken) return () => {};

  const cfg = await fetchPushConfig();
  if (!cfg.webPushReady || !cfg.firebaseConfig || !cfg.vapidKey) {
    return () => {};
  }

  const messaging = await getMessagingInstance(cfg.firebaseConfig);
  if (!messaging) return () => {};

  let activeRegistration: ServiceWorkerRegistration | undefined;
  try {
    const registration = await navigator.serviceWorker.register('/api/push/sw', {
      scope: '/',
    });
    await registration.update().catch(() => undefined);
    activeRegistration = registration;
    const freshToken = await getToken(messaging, {
      vapidKey: cfg.vapidKey,
      serviceWorkerRegistration: registration,
    }).catch(() => savedToken);

    if (freshToken && freshToken !== savedToken) {
      localStorage.setItem(FCM_TOKEN_STORAGE_KEY, freshToken);
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: freshToken, platform: 'web' }),
      }).catch(() => undefined);
    }
  } catch {
    // Non-fatal background refresh error
  }

  return attachForegroundListener(messaging, activeRegistration);
}

export async function sendSelfTestPush(): Promise<void> {
  const savedToken = localStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  if (!savedToken) {
    throw new Error('Token perangkat belum tersimpan. Klik Aktifkan terlebih dahulu.');
  }
  const res = await fetch('/api/push/test-self', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: savedToken }),
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || `Gagal mengirim tes push (HTTP ${res.status}).`);
  }
}
