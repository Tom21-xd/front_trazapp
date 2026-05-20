import api from '@/lib/api';

/**
 * Cliente de Web Push: orquesta la suscripción entre Service Worker y backend.
 * - getVapidPublicKey: descarga la clave del backend.
 * - subscribe: pide permiso, registra en el SW y envía al backend.
 * - unsubscribe: borra en SW y backend.
 * - getStatus: consulta el estado actual sin pedir nada al usuario.
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  // Crear el buffer explícitamente como ArrayBuffer (no ArrayBufferLike) para
  // que TypeScript lo acepte como BufferSource en pushManager.subscribe()
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return view;
}

function isSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export type PushStatus = 'unsupported' | 'denied' | 'unsubscribed' | 'subscribed';

export const pushService = {
  isSupported,

  async getStatus(): Promise<PushStatus> {
    if (!isSupported()) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return 'unsubscribed';
    const sub = await reg.pushManager.getSubscription();
    return sub ? 'subscribed' : 'unsubscribed';
  },

  async getVapidPublicKey(): Promise<string | null> {
    const res = await api.get<{ publicKey: string | null }>(
      '/push/vapid-public-key',
    );
    return res.publicKey;
  },

  /** Solicita permiso, crea la suscripción en el SW y la envía al backend. */
  async subscribe(): Promise<PushStatus> {
    if (!isSupported()) return 'unsupported';
    const reg = await navigator.serviceWorker.ready;
    const publicKey = await this.getVapidPublicKey();
    if (!publicKey) {
      throw new Error('El servidor no tiene Web Push configurado');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return permission === 'denied' ? 'denied' : 'unsubscribed';
    }

    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
          .buffer as ArrayBuffer,
      }));

    const json = sub.toJSON();
    await api.post('/push/subscription', {
      endpoint: json.endpoint,
      keys: json.keys,
    });

    return 'subscribed';
  },

  async unsubscribe(): Promise<void> {
    if (!isSupported()) return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    try {
      await sub.unsubscribe();
    } catch {
      // si falla local, igual borramos en backend
    }
    await api
      .delete(`/push/subscription?endpoint=${encodeURIComponent(endpoint)}`)
      .catch(() => undefined);
  },
};
