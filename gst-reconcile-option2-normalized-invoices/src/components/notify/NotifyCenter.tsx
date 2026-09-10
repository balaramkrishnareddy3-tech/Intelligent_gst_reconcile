import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useGstStore } from '@/store/gstStore';
import { useNotifyStore, timeAgo } from '@/store/notifyStore';
import type { AppNotification, NotifyKind } from '@/store/notifyStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

/* =========================================================================
 * NOTIFICATIONS CENTER — global bell + live toasts.
 * Subscribes to the GST store and converts real platform events
 * (batch completions / failures, new mismatches, missing invoices,
 * ITC exposure increases, GSTR-2B refreshes, tenant onboarding)
 * into notifications. Mounted app-wide; no existing page is modified.
 * ======================================================================= */

const KIND_STYLE: Record<NotifyKind, { ring: string; icon: React.ComponentType<{ className?: string }>; iconColor: string; toastBorder: string }> = {
  info: { ring: 'bg-sky-500/15', icon: Info, iconColor: 'text-sky-500', toastBorder: 'border-sky-300' },
  success: { ring: 'bg-emerald-500/15', icon: CheckCircle2, iconColor: 'text-emerald-500', toastBorder: 'border-emerald-300' },
  warning: { ring: 'bg-amber-500/15', icon: AlertTriangle, iconColor: 'text-amber-500', toastBorder: 'border-amber-300' },
  critical: { ring: 'bg-rose-500/15', icon: ShieldAlert, iconColor: 'text-rose-500', toastBorder: 'border-rose-300' },
};

const inr = (n: number) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)} Cr`
    : n >= 100000
    ? `₹${(n / 100000).toFixed(2)} L`
    : `₹${n.toLocaleString('en-IN')}`;

export default function NotifyCenter() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role ?? null;

  const { notifications, push, markRead, markAllRead, clearAll, remove, seedIfEmpty, seeded } =
    useNotifyStore();

  const { invoices, batches, companies, dataSources, getStats } = useGstStore();
  const stats = getStats();

  const open = useUiStore((s) => s.notifyOpen);
  const setNotifyOpen = useUiStore((s) => s.setNotify);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [toasts, setToasts] = useState<AppNotification[]>([]);

  const seenRef = useRef<Set<string> | null>(null);

  /* ---------- seed once from live platform state ---------- */
  useEffect(() => {
    if (seeded) return;
    const failed = batches.find((b) => b.status === 'Failed');
    const seeds: { kind: NotifyKind; title: string; message: string; source: string; module?: string; minutesAgo: number }[] = [];

    if (failed) {
      seeds.push({
        kind: 'critical',
        title: `Batch ${failed.id} failed`,
        message: failed.failureReason || 'Fatal schema error during statutory validation. Retry from Reconciliation Monitoring.',
        source: 'Reconciliation Engine',
        module: 'reconciliation',
        minutesAgo: 42,
      });
    }
    if (stats.missingCount > 0) {
      seeds.push({
        kind: 'critical',
        title: `${stats.missingCount} invoices missing in GSTR-2B`,
        message: `Supplier GSTR-1 not filed for ${stats.missingCount} inward invoice(s). ITC blocked under Sec 16(2)(aa).`,
        source: 'GSTN Gateway',
        module: 'mismatches',
        minutesAgo: 96,
      });
    }
    if (stats.highRiskCount > 0) {
      seeds.push({
        kind: 'warning',
        title: `${stats.highRiskCount} high-risk invoice flag(s)`,
        message: `Suspended / cancelled supplier GSTINs detected. ${inr(stats.itcAtRisk)} ITC exposure under review.`,
        source: 'Risk Engine',
        module: 'itc',
        minutesAgo: 130,
      });
    }
    const done = batches.find((b) => b.status === 'Completed');
    if (done) {
      seeds.push({
        kind: 'success',
        title: `Batch ${done.id} completed`,
        message: `${done.totalRecords} records verified • ${done.matchRate}% statutory match in ${done.durationSeconds}s.`,
        source: 'Reconciliation Engine',
        module: 'reconciliation',
        minutesAgo: 180,
      });
    }
    seeds.push({
      kind: 'info',
      title: 'GSTR-2B statement refreshed',
      message: `Auto-drafted statement synced from GSTN gateway for ${companies.length} tenant(s).`,
      source: 'GSTN Gateway',
      module: 'gateway',
      minutesAgo: 240,
    });

    seedIfEmpty(seeds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeded]);

  /* ---------- live watcher: convert store deltas into notifications ---------- */
  const prevRef = useRef<null | {
    lastBatch: string;
    mismatch: number;
    missing: number;
    high: number;
    itc: number;
    sync: string;
    tenants: number;
  }>(null);

  useEffect(() => {
    const cur = {
      lastBatch: batches[0] ? `${batches[0].id}:${batches[0].status}` : '',
      mismatch: stats.mismatchCount,
      missing: stats.missingCount,
      high: stats.highRiskCount,
      itc: stats.itcAtRisk,
      sync: dataSources.find((d) => d.key === 'gstr2b')?.lastSync ?? '',
      tenants: companies.length,
    };
    const prev = prevRef.current;
    prevRef.current = cur;
    if (!prev) return; // first snapshot — no toasts

    if (cur.lastBatch !== prev.lastBatch && batches[0]) {
      const b = batches[0];
      if (b.status === 'Failed') {
        push({
          kind: 'critical',
          title: `Batch ${b.id} failed`,
          message: b.failureReason || 'Fatal schema error during statutory validation.',
          source: 'Reconciliation Engine',
          module: 'reconciliation',
        });
      } else if (b.status === 'Completed') {
        push({
          kind: 'success',
          title: `Batch ${b.id} completed`,
          message: `${b.totalRecords} records verified • ${b.matchRate}% statutory match in ${b.durationSeconds}s.`,
          source: 'Reconciliation Engine',
          module: 'reconciliation',
        });
      }
    }
    if (cur.missing > prev.missing) {
      push({
        kind: 'critical',
        title: 'New missing invoice detected',
        message: `Books invoice absent from GSTR-2B after latest sync. ITC blocked under Sec 16(2)(aa).`,
        source: 'GSTN Gateway',
        module: 'mismatches',
      });
    }
    if (cur.mismatch > prev.mismatch) {
      push({
        kind: 'warning',
        title: 'New tax variance detected',
        message: `+${cur.mismatch - prev.mismatch} value mismatch(es) since last check. Open the mismatch workbench to resolve.`,
        source: 'Reconciliation Engine',
        module: 'mismatches',
      });
    }
    if (cur.mismatch < prev.mismatch || cur.missing < prev.missing) {
      push({
        kind: 'success',
        title: 'Discrepancies resolved',
        message: 'Ledger discrepancies cleared — reconciliation health improved.',
        source: 'Reconciliation Engine',
        module: 'mismatches',
      });
    }
    if (cur.high > prev.high) {
      push({
        kind: 'critical',
        title: 'High-risk flag raised',
        message: 'A supplier GSTIN moved to suspended / cancelled state. Review ITC exposure immediately.',
        source: 'Risk Engine',
        module: 'itc',
      });
    }
    if (cur.itc > prev.itc) {
      push({
        kind: 'warning',
        title: 'ITC exposure increased',
        message: `At-risk credit rose by ${inr(cur.itc - prev.itc)} after latest sync.`,
        source: 'Risk Engine',
        module: 'itc',
      });
    }
    if (cur.sync !== prev.sync) {
      push({
        kind: 'info',
        title: 'GSTR-2B statement refreshed',
        message: `Statement re-synced from GSTN gateway (${cur.sync}).`,
        source: 'GSTN Gateway',
        module: 'gateway',
      });
    }
    if (cur.tenants > prev.tenants) {
      push({
        kind: 'info',
        title: 'New tenant onboarded',
        message: 'A new enterprise organization was registered on the platform.',
        source: 'Platform Admin',
        module: 'tenants',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batches, invoices, dataSources, companies]);

  /* ---------- toast stream for newly pushed notifications ---------- */
  useEffect(() => {
    if (!seenRef.current) {
      seenRef.current = new Set(notifications.map((n) => n.id));
      return;
    }
    const fresh = notifications.filter((n) => !seenRef.current!.has(n.id));
    if (fresh.length === 0) return;
    fresh.forEach((n) => seenRef.current!.add(n.id));
    setToasts((t) => [...fresh.slice(0, 3), ...t].slice(0, 3));
    fresh.forEach((n) => {
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== n.id));
      }, 5000);
    });
  }, [notifications]);

  /* ---------- role-aware module routing ---------- */
  const modulePath = (m?: string): string | null => {
    if (!m) return null;
    if (role === 'admin') {
      const map: Record<string, string> = {
        reconciliation: '/admin/reconciliation',
        mismatches: '/admin/mismatches',
        itc: '/admin/itc-risk',
        vendors: '/admin/vendors',
        gateway: '/admin/reconciliation',
        tenants: '/admin/companies',
        audit: '/admin/audit-trail',
      };
      return map[m] ?? null;
    }
    if (role === 'vendor') {
      const map: Record<string, string> = {
        reconciliation: '/vendor/dashboard',
        mismatches: '/vendor/mismatches',
        itc: '/vendor/compliance',
        vendors: '/vendor/dashboard',
        gateway: '/vendor/invoices',
        tenants: '/vendor/dashboard',
        audit: '/vendor/compliance',
      };
      return map[m] ?? null;
    }
    const map: Record<string, string> = {
      reconciliation: '/company/reconciliation',
      mismatches: '/company/mismatches',
      itc: '/company/itc-risk',
      vendors: '/company/vendor-risk',
      gateway: '/company/data-sources',
      tenants: '/company/dashboard',
      audit: '/company/audit-trail',
    };
    return map[m] ?? null;
  };

  const unread = notifications.filter((n) => !n.read).length;

  const visible = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    if (filter === 'critical') return notifications.filter((n) => n.kind === 'critical' || n.kind === 'warning');
    return notifications;
  }, [notifications, filter]);

  const openNotification = (n: AppNotification) => {
    markRead(n.id);
    const to = modulePath(n.module);
    if (to) {
      navigate(to);
      setNotifyOpen(false);
    }
  };

  return (
    <>
      {/* Toast stream (top-right) */}
      <div className="pointer-events-none fixed right-4 top-4 z-[95] flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => {
          const st = KIND_STYLE[t.kind];
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-white/95 p-3 shadow-xl shadow-slate-900/20 backdrop-blur-xl animate-in slide-in-from-right duration-300',
                st.toastBorder
              )}
            >
              <span className={cn('mt-0.5 shrink-0', st.iconColor)}>
                <st.icon className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-900">{t.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{t.message}</p>
                <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                  {t.source} • {timeAgo(t.time)}
                </p>
              </div>
              <button
                onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Notification center panel (opened from the in-dashboard dock) */}
      {open && (
        <div className="fixed bottom-40 left-4 z-[85] flex max-h-[62vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/30 backdrop-blur-xl sm:left-6">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-4 py-3">
            <Bell className="h-4 w-4 text-white" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Notifications</p>
              <p className="text-[10px] font-medium text-sky-100">
                {unread} unread • live platform events
              </p>
            </div>
            <button
              onClick={markAllRead}
              title="Mark all read"
              className="rounded-lg p-1.5 text-sky-100 transition-colors hover:bg-white/10 hover:text-white"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
            <button
              onClick={clearAll}
              title="Clear all"
              className="rounded-lg p-1.5 text-sky-100 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setNotifyOpen(false)}
              className="rounded-lg p-1.5 text-sky-100 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2">
            {(['all', 'unread', 'critical'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-[10px] font-bold capitalize transition-colors',
                  filter === f
                    ? 'bg-sky-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-500 hover:text-slate-700'
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {visible.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Radio className="h-6 w-6 text-slate-300" />
                <p className="text-xs font-semibold text-slate-500">You're all caught up</p>
                <p className="text-[10px] text-slate-400">
                  New platform events will appear here in real time.
                </p>
              </div>
            )}
            {visible.map((n) => {
              const st = KIND_STYLE[n.kind];
              return (
                <div
                  key={n.id}
                  className={cn(
                    'group flex cursor-pointer items-start gap-2.5 border-b border-slate-100 px-3.5 py-3 transition-colors hover:bg-slate-50',
                    !n.read && 'bg-sky-50/60'
                  )}
                  onClick={() => openNotification(n)}
                >
                  <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', st.ring, st.iconColor)}>
                    <st.icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900">{n.title}</p>
                      {!n.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{n.message}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        {n.source}
                      </span>
                      <span className="text-[9px] text-slate-400">{timeAgo(n.time)}</span>
                      {n.module && (
                        <span className="text-[9px] font-bold text-sky-600 opacity-0 transition-opacity group-hover:opacity-100">
                          Open module →
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(n.id);
                    }}
                    className="shrink-0 rounded p-1 text-slate-300 opacity-0 transition-all hover:text-rose-500 group-hover:opacity-100"
                    title="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-center text-[9px] text-slate-400">
            Live event bus • reconciliation batches • GSTN syncs • risk flags • tenant activity
          </div>
        </div>
      )}
    </>
  );
}
