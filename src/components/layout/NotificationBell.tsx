'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notificationsService } from '@/services';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/types';

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(async () => {
    try {
      const { count } = await notificationsService.unreadCount();
      setUnread(count);
    } catch {
      /* silencioso */
    }
  }, []);

  useEffect(() => {
    loadCount();
    const t = setInterval(loadCount, 60000);
    return () => clearInterval(t);
  }, [loadCount]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openPanel = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await notificationsService.getPage({ limit: 10 });
        setItems(res.data);
      } catch {
        /* silencioso */
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClick = async (n: AppNotification) => {
    try {
      if (!n.isRead) {
        await notificationsService.markRead(n.id);
        setUnread((c) => Math.max(0, c - 1));
        setItems((prev) =>
          prev.map((i) => (i.id === n.id ? { ...i, isRead: true } : i)),
        );
      }
    } catch {
      /* silencioso */
    }
    setOpen(false);
    if (n.metadata?.activityId) {
      router.push(`/activities/${n.metadata.activityId}`);
    }
  };

  const markAll = async () => {
    try {
      await notificationsService.markAllRead();
      setUnread(0);
      setItems((prev) => prev.map((i) => ({ ...i, isRead: true })));
    } catch {
      /* silencioso */
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={openPanel}
        aria-label={`Notificaciones${unread > 0 ? `, ${unread} sin leer` : ''}`}
        className="relative p-2 rounded-lg text-accent-600 hover:text-accent-900 hover:bg-accent-100 transition-colors"
      >
        <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 flex items-center justify-center text-[10px] font-bold text-white bg-secondary-500 rounded-full">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-accent-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-accent-200">
            <h3 className="font-semibold text-sm text-accent-900">Notificaciones</h3>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                Marcar todas leídas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-accent-500">
                No tienes notificaciones
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-accent-100 hover:bg-accent-50 transition-colors flex gap-3',
                    !n.isRead && 'bg-primary-50/60',
                  )}
                >
                  <span
                    className={cn(
                      'mt-1.5 w-2 h-2 rounded-full shrink-0',
                      n.isRead ? 'bg-transparent' : 'bg-primary-500',
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-accent-900 truncate">
                      {n.title}
                    </span>
                    <span className="block text-xs text-accent-500 line-clamp-2">
                      {n.message}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
