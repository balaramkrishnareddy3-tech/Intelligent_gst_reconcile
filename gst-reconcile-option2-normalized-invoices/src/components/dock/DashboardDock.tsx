import type { ReactNode } from 'react';
import { Bell, Compass, Satellite } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useNotifyStore } from '@/store/notifyStore';
import { cn } from '@/utils/cn';

/* =========================================================================
 * DASHBOARD DOCK — in-page quick access strip rendered inside the
 * Company / Vendor / Admin dashboards. Opens the global Notification
 * Center, History & Guidance coach and Live GSTR-2B Gateway panels.
 * ======================================================================= */

export default function DashboardDock({
  children,
  showGateway = true,
}: {
  children: ReactNode;
  showGateway?: boolean;
}) {
  const {
    notifyOpen,
    guideOpen,
    gatewayOpen,
    toggleNotify,
    toggleGuide,
    toggleGateway,
  } = useUiStore();
  const unread = useNotifyStore((s) => s.notifications.filter((n) => !n.read).length);

  return (
    <div>
      {/* In-dashboard quick access dock */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-sky-200/70 bg-white/80 p-2.5 shadow-sm backdrop-blur-xl">
        <span className="hidden pl-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:block">
          Quick Access
        </span>

        {/* Notifications */}
        <button
          onClick={toggleNotify}
          className={cn(
            'relative flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all',
            notifyOpen
              ? 'border-sky-400 bg-sky-50 text-sky-700 ring-2 ring-sky-400/30'
              : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700'
          )}
        >
          <Bell className="h-4 w-4 text-sky-600" />
          Notifications
          {unread > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* History & Guidance */}
        <button
          onClick={toggleGuide}
          className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all',
            guideOpen
              ? 'border-amber-400 bg-amber-50 text-amber-700 ring-2 ring-amber-400/30'
              : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:text-amber-700'
          )}
        >
          <Compass className="h-4 w-4 text-amber-500" />
          History & Guidance
        </button>

        {/* Live GSTR-2B API Generation */}
        {showGateway && (
          <button
            onClick={toggleGateway}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-md transition-all',
              gatewayOpen
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 ring-2 ring-emerald-400/40'
                : 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 shadow-emerald-500/30 hover:scale-[1.02]'
            )}
          >
            <Satellite className="h-4 w-4" />
            Live GSTR-2B API Generation
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
          </button>
        )}
      </div>

      {/* Dashboard page content */}
      {children}
    </div>
  );
}
