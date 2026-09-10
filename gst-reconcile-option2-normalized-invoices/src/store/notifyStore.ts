import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/* =========================================================================
 * Global Notifications Store
 * -----------------------------------------------------------------------
 * Central notification bus for the whole platform. Events are pushed by the
 * NotifyCenter watcher (which subscribes to the GST store) and persisted so
 * the bell keeps its state across reloads.
 * ======================================================================= */

export type NotifyKind = 'info' | 'success' | 'warning' | 'critical';

export interface AppNotification {
  id: string;
  kind: NotifyKind;
  title: string;
  message: string;
  /** module key resolved to a route per-role at click time */
  module?: string;
  source: string;
  time: string; // ISO
  read: boolean;
}

interface NotifyState {
  notifications: AppNotification[];
  seeded: boolean;
  push: (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => AppNotification;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
  seedIfEmpty: (items: (Omit<AppNotification, 'id' | 'read' | 'time'> & { minutesAgo: number })[]) => void;
}

const uid = () => `ntf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export const useNotifyStore = create<NotifyState>()(
  persist(
    (set, get) => ({
      notifications: [],
      seeded: false,

      push: (n) => {
        const item: AppNotification = {
          ...n,
          id: uid(),
          time: new Date().toISOString(),
          read: false,
        };
        set((s) => ({ notifications: [item, ...s.notifications].slice(0, 80) }));
        return item;
      },

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      remove: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

      clearAll: () => set({ notifications: [] }),

      seedIfEmpty: (items) => {
        if (get().seeded) return;
        const seeded: AppNotification[] = items.map((it) => ({
          id: uid(),
          time: new Date(Date.now() - it.minutesAgo * 60000).toISOString(),
          read: false,
          kind: it.kind,
          title: it.title,
          message: it.message,
          source: it.source,
          module: it.module,
        }));
        set({ notifications: seeded, seeded: true });
      },
    }),
    {
      name: 'gstr_notify_v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};
