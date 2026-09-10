import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  X,
  History,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Trash2,
  LayoutDashboard,
  Database,
  GitCompare,
  AlertTriangle,
  ShieldAlert,
  Users,
  Network,
  ClipboardList,
  BarChart3,
  FileText,
  ShieldCheck,
  MessageSquare,
  LogIn,
  Globe,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

/* =========================================================================
 * HISTORY & GUIDANCE WIDGET
 * -----------------------------------------------------------------------
 * Role-aware guided tour + session history timeline with smart next-step
 * guidance. Mounted globally — no existing page is modified.
 * ======================================================================= */

interface TourStep {
  path: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface HistoryEntry {
  id: string;
  path: string;
  role: string | null;
  time: string;
}

const HISTORY_KEY = 'gstr_history_v1';
const TOUR_KEY = 'gstr_tour_v1';

const COMPANY_STEPS: TourStep[] = [
  { path: '/company/dashboard', title: 'Command Center', desc: 'Your KPI cockpit: total invoices, match rate, ITC at risk and one-click quick actions into every module.', icon: LayoutDashboard },
  { path: '/company/data-sources', title: 'Connect Data Sources', desc: 'Upload your ERP purchase register and GSTR-2B statements (CSV / Excel), or pull GSTR-2B live from the GSTN gateway (green satellite, bottom-left).', icon: Database },
  { path: '/company/reconciliation', title: 'Run the 20-Step Engine', desc: 'Execute statutory matching: normalize GSTINs & invoices, compare taxable, CGST, SGST, IGST and classify every line.', icon: GitCompare },
  { path: '/company/reconciliation/results', title: 'Inspect Results', desc: 'Filter the result matrix by Matched / Mismatched / Missing / Duplicate and open any line-item dossier.', icon: GitCompare },
  { path: '/company/mismatches', title: 'Resolve Discrepancies', desc: 'The mismatch workbench: root-cause analysis, supplier notices and resolution memos logged to audit.', icon: AlertTriangle },
  { path: '/company/itc-risk', title: 'Protect Your ITC', desc: 'Section 16(2)(aa) exposure monitor — see exactly which credit is safe, risky or blocked before filing GSTR-3B.', icon: ShieldAlert },
  { path: '/company/vendor-risk', title: 'Score Your Suppliers', desc: 'Compliance scores, filing trends and risk drivers per supplier, with full vendor dossiers.', icon: Users },
  { path: '/company/transaction-graph', title: 'Trace Risk Paths', desc: 'Interactive knowledge graph: Company → Vendor → Invoice → Records → Mismatch → ITC → Risk → Audit.', icon: Network },
  { path: '/company/audit-trail', title: 'Immutable Audit Trail', desc: 'Every processing step with timestamps, results and SHA-256 integrity signatures.', icon: ClipboardList },
  { path: '/company/reports', title: 'Export Executive Packs', desc: 'Six statutory reports exportable to CSV / Excel and printable to PDF.', icon: BarChart3 },
];

const VENDOR_STEPS: TourStep[] = [
  { path: '/vendor/dashboard', title: 'Supplier Command Center', desc: 'Your compliance snapshot: invoices issued, buyer mismatches, compliance score and open issues.', icon: LayoutDashboard },
  { path: '/vendor/invoices', title: 'Outward Supplies', desc: 'Every invoice you issued, with buyer-side reconciliation status (Matched / Amount Diff / Not Found).', icon: FileText },
  { path: '/vendor/mismatches', title: 'Buyer Mismatches', desc: 'Discrepancies flagged by your buyers — compare declared vs buyer ledger values and resolve.', icon: AlertTriangle },
  { path: '/vendor/compliance', title: 'Compliance Scorecard', desc: 'GSTR-1 / GSTR-3B filing punctuality history and your trust rating trend.', icon: ShieldCheck },
  { path: '/vendor/issues', title: 'Dispute Tickets', desc: 'Track buyer-raised issues from open to resolved with full thread history.', icon: MessageSquare },
  { path: '/vendor/reports', title: 'Download Statements', desc: 'Outward tax summaries, discrepancy ledgers and compliance certificates.', icon: BarChart3 },
];

const GUEST_STEPS: TourStep[] = [
  { path: '/', title: 'Choose Your Portal', desc: 'GST RECONCILE serves three roles: Company (buyers), Vendor / Supplier, and Platform Admin.', icon: Globe },
  { path: '/login/company', title: 'Company Sign-In', desc: 'Demo: company@demo.com / company123 — full reconciliation, ITC risk & graph workspace.', icon: LogIn },
  { path: '/login/vendor', title: 'Vendor Sign-In', desc: 'Demo: vendor@demo.com / vendor123 — invoices, buyer mismatches & compliance scorecard.', icon: LogIn },
];

const PATH_LABELS: Record<string, string> = {
  '/': 'Landing — Role Selection',
  '/login/company': 'Company Login',
  '/login/vendor': 'Vendor Login',
  '/login/admin': 'Admin Login',
  '/company/dashboard': 'Company Dashboard',
  '/company/data-sources': 'Data Sources',
  '/company/reconciliation': 'Reconciliation Engine',
  '/company/reconciliation/results': 'Reconciliation Results',
  '/company/mismatches': 'Mismatch Workbench',
  '/company/itc-risk': 'ITC Risk Monitor',
  '/company/vendor-risk': 'Vendor Risk',
  '/company/transaction-graph': 'Transaction Graph',
  '/company/audit-trail': 'Audit Trail',
  '/company/reports': 'Reports',
  '/company/settings': 'Company Settings',
  '/vendor/dashboard': 'Vendor Dashboard',
  '/vendor/invoices': 'Vendor Invoices',
  '/vendor/mismatches': 'Vendor Mismatches',
  '/vendor/compliance': 'Vendor Compliance',
  '/vendor/issues': 'Vendor Issues',
  '/vendor/reports': 'Vendor Reports',
  '/vendor/settings': 'Vendor Settings',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/companies': 'Companies Registry',
  '/admin/vendors': 'Vendors Registry',
  '/admin/invoices': 'Invoice Registry',
  '/admin/reconciliation': 'Reconciliation Monitoring',
  '/admin/mismatches': 'Mismatch Monitoring',
  '/admin/itc-risk': 'ITC Risk Monitoring',
  '/admin/transaction-graph': 'Knowledge Graph',
  '/admin/audit-trail': 'Audit Trail',
  '/admin/reports': 'Admin Reports',
  '/admin/settings': 'System Settings',
};

const prettyPath = (p: string) =>
  PATH_LABELS[p] ??
  (p.startsWith('/company/invoice/')
    ? `Invoice Dossier ${p.split('/').pop()}`
    : p.startsWith('/admin/companies/')
    ? `Company Dossier ${p.split('/').pop()}`
    : p.startsWith('/admin/vendors/')
    ? `Vendor Dossier ${p.split('/').pop()}`
    : p.startsWith('/admin/invoices/')
    ? `Invoice Dossier ${p.split('/').pop()}`
    : p);

const nowTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

interface TourProgress {
  company: number;
  vendor: number;
  guest: number;
  doneCompany: boolean;
  doneVendor: boolean;
  doneGuest: boolean;
}

const defaultTour: TourProgress = {
  company: 0,
  vendor: 0,
  guest: 0,
  doneCompany: false,
  doneVendor: false,
  doneGuest: false,
};

export default function HistoryGuide() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const role = user?.role ?? null;
  const roleKey: 'company' | 'vendor' | 'guest' =
    role === 'company' ? 'company' : role === 'vendor' ? 'vendor' : 'guest';

  const open = useUiStore((s) => s.guideOpen);
  const setGuideOpen = useUiStore((s) => s.setGuide);
  const [tab, setTab] = useState<'tour' | 'history'>('tour');
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) return JSON.parse(raw) as HistoryEntry[];
    } catch {
      /* ignore */
    }
    return [];
  });
  const [tour, setTour] = useState<TourProgress>(() => {
    try {
      const raw = localStorage.getItem(TOUR_KEY);
      if (raw) return { ...defaultTour, ...(JSON.parse(raw) as TourProgress) };
    } catch {
      /* ignore */
    }
    return defaultTour;
  });

  // persist history + tour
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-120)));
    } catch {
      /* ignore */
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(TOUR_KEY, JSON.stringify(tour));
    } catch {
      /* ignore */
    }
  }, [tour]);

  // record navigation history
  useEffect(() => {
    setHistory((h) => {
      const last = h[h.length - 1];
      if (last && last.path === location.pathname) return h;
      return [
        ...h,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          path: location.pathname,
          role,
          time: nowTime(),
        },
      ];
    });
  }, [location.pathname, role]);

  const steps = roleKey === 'company' ? COMPANY_STEPS : roleKey === 'vendor' ? VENDOR_STEPS : GUEST_STEPS;
  const idx = Math.min(tour[roleKey], steps.length - 1);
  const done = roleKey === 'company' ? tour.doneCompany : roleKey === 'vendor' ? tour.doneVendor : tour.doneGuest;
  const step = steps[idx];

  const visited = useMemo(() => new Set(history.map((h) => h.path)), [history]);

  // smart next-step recommendation: first tour step not yet visited
  const recommendation = useMemo(() => steps.find((s) => !visited.has(s.path)) ?? null, [steps, visited]);

  const setIdx = (n: number) =>
    setTour((t) => ({ ...t, [roleKey]: Math.max(0, Math.min(steps.length - 1, n)) }));

  const finish = () =>
    setTour((t) => ({ ...t, [(`done${roleKey.charAt(0).toUpperCase()}${roleKey.slice(1)}` as keyof TourProgress)]: true } as TourProgress));

  const restart = () =>
    setTour((t) => ({ ...t, [roleKey]: 0, [(`done${roleKey.charAt(0).toUpperCase()}${roleKey.slice(1)}` as keyof TourProgress)]: false } as TourProgress));

  const openStep = (path: string) => {
    navigate(path);
    setGuideOpen(false);
  };

  const roleLabel = roleKey === 'company' ? 'Company' : roleKey === 'vendor' ? 'Vendor' : 'Guest';

  return (
    <>
      {/* Drawer (opened from the in-dashboard dock) */}
      {open && (
        <div className="fixed inset-y-0 right-0 z-[85] flex w-[420px] max-w-full flex-col border-l border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/30 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">History & Guidance</p>
              <p className="text-[10px] font-medium text-amber-100">
                {roleLabel} session • {history.length} tracked events • tour {done ? 'completed ✓' : `step ${idx + 1}/${steps.length}`}
              </p>
            </div>
            <button
              onClick={() => setGuideOpen(false)}
              className="rounded-lg p-1.5 text-amber-100 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              onClick={() => setTab('tour')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors',
                tab === 'tour' ? 'border-b-2 border-amber-500 bg-white text-amber-700' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <MapIcon className="h-3.5 w-3.5" /> Guided Tour
            </button>
            <button
              onClick={() => setTab('history')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-colors',
                tab === 'history' ? 'border-b-2 border-amber-500 bg-white text-amber-700' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <History className="h-3.5 w-3.5" /> History & Tips
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {tab === 'tour' ? (
              done ? (
                <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                  <p className="text-sm font-bold text-emerald-800">{roleLabel} tour completed!</p>
                  <p className="text-xs text-emerald-700">
                    You've walked through every {roleLabel.toLowerCase()} module. Revisit any step from the
                    checklist below or restart the tour anytime.
                  </p>
                  <button
                    onClick={restart}
                    className="mx-auto flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restart Tour
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* progress */}
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>
                        STEP {idx + 1} OF {steps.length}
                      </span>
                      <span>{Math.round(((idx + (visited.has(step.path) ? 1 : 0)) / steps.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-300"
                        style={{ width: `${((idx + 1) / steps.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* current step card */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-md shadow-amber-500/30">
                        <step.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{step.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">{step.desc}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => openStep(step.path)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/30 transition-all hover:scale-[1.01]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open Module
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => setIdx(idx - 1)}
                        disabled={idx === 0}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Back
                      </button>
                      {idx < steps.length - 1 ? (
                        <button
                          onClick={() => setIdx(idx + 1)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
                        >
                          Next <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={finish}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Finish Tour
                        </button>
                      )}
                    </div>
                  </div>

                  {/* step checklist */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {roleLabel} Checklist
                    </p>
                    {steps.map((s, i) => (
                      <button
                        key={s.path + i}
                        onClick={() => setIdx(i)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition-colors',
                          i === idx ? 'bg-amber-50 text-amber-800 font-bold' : 'text-slate-600 hover:bg-slate-100'
                        )}
                      >
                        {visited.has(s.path) ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        ) : (
                          <span
                            className={cn(
                              'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[8px] font-bold',
                              i === idx ? 'border-amber-500 text-amber-600' : 'border-slate-300 text-slate-400'
                            )}
                          >
                            {i + 1}
                          </span>
                        )}
                        <span className="truncate">{s.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {/* smart recommendation */}
                {recommendation && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      <Sparkles className="h-3.5 w-3.5" /> Recommended Next
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-800">{recommendation.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{recommendation.desc}</p>
                    <button
                      onClick={() => openStep(recommendation.path)}
                      className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-amber-600"
                    >
                      <ExternalLink className="h-3 w-3" /> Go There Now
                    </button>
                  </div>
                )}

                {/* timeline */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Session History ({history.length})
                    </p>
                    <button
                      onClick={() => setHistory([])}
                      className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[10px] font-bold text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Clear history"
                    >
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </div>

                  <div className="space-y-0">
                    {[...history].reverse().map((h, i, arr) => (
                      <div key={h.id} className="relative flex gap-3 pb-3">
                        {/* rail */}
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              'mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white shadow',
                              i === 0 ? 'bg-amber-500' : 'bg-slate-300'
                            )}
                          />
                          {i < arr.length - 1 && <span className="w-px flex-1 bg-slate-200" />}
                        </div>
                        <button
                          onClick={() => openStep(h.path)}
                          className="flex-1 rounded-lg px-2 py-1 text-left transition-colors hover:bg-slate-100"
                        >
                          <p className="text-[11px] font-bold text-slate-800">{prettyPath(h.path)}</p>
                          <p className="text-[9px] text-slate-400">
                            {h.time} • {h.role ? h.role.toUpperCase() : 'GUEST'} session
                          </p>
                        </button>
                      </div>
                    ))}
                    {history.length === 0 && (
                      <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-[11px] text-slate-500">
                        No navigation recorded yet — start exploring!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-center text-[9px] text-slate-400">
            Guidance adapts to your role: {roleLabel} • history stored locally on this device
          </div>
        </div>
      )}
    </>
  );
}
