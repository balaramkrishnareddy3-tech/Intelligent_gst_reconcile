import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGstStore } from '@/store/gstStore';
import { useNotifyStore } from '@/store/notifyStore';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Copy,
  ShieldAlert,
  IndianRupee,
  TrendingDown,
  Upload,
  Play,
  Network,
  BarChart3,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
  ExternalLink,
  Activity,
  PauseCircle,
  PlayCircle,
  Radio,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const {
    invoices,
    getStats,
    lastReconciliationTimestamp,
    addLiveTransaction,
    ensureLiveFeedSeed,
  } = useGstStore();
  const pushNotification = useNotifyStore((s) => s.push);
  const [feedPaused, setFeedPaused] = useState(false);
  const [liveToast, setLiveToast] = useState<{ invoice: string; vendor: string } | null>(null);
  const stats = getStats();

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  const formatClock = (iso?: string) =>
    new Date(iso || Date.now()).toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  // Recent issues: filter invoices with non-MATCHED status
  const recentIssues = invoices
    .filter((inv) => inv.status !== 'MATCHED')
    .slice(0, 5);

  const liveTransactions = useMemo(
    () =>
      invoices
        .filter((inv) => inv.source === 'Prototype Live Feed')
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.invoiceDate).getTime() -
            new Date(a.createdAt || a.invoiceDate).getTime()
        ),
    [invoices]
  );

  const liveCounters = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: liveTransactions.length,
      newToday: liveTransactions.filter((t) => (t.createdAt || '').slice(0, 10) === today).length,
      processing: liveTransactions.filter((t) => t.liveStatus === 'Processing').length,
      matched: liveTransactions.filter((t) => t.status === 'MATCHED').length,
      mismatched: liveTransactions.filter((t) => t.status === 'MISMATCHED' || t.status === 'MISSING').length,
      highRisk: liveTransactions.filter((t) => t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL').length,
    };
  }, [liveTransactions]);

  useEffect(() => {
    ensureLiveFeedSeed();
  }, [ensureLiveFeedSeed]);

  useEffect(() => {
    if (feedPaused) return;
    const intervalId = window.setInterval(() => {
      const tx = addLiveTransaction();
      setLiveToast({ invoice: tx.invoiceNumber, vendor: tx.vendorName });
      pushNotification({
        kind: tx.riskLevel === 'HIGH' || tx.riskLevel === 'CRITICAL' ? 'warning' : 'info',
        title: 'New GST transaction received',
        message: `${tx.invoiceNumber} · ${tx.vendorName}`,
        source: 'Prototype Live Feed',
        module: tx.status === 'MATCHED' ? 'reconciliation' : 'mismatches',
      });
      window.setTimeout(() => setLiveToast(null), 3500);
    }, 9000);

    return () => window.clearInterval(intervalId);
  }, [feedPaused, addLiveTransaction, pushNotification]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Page Header */}
      <PageHeader
        title="Company Reconciliation Dashboard"
        subtitle={`Real-time GSTR-2B vs ERP reconciliation health • Last synced: ${lastReconciliationTimestamp || 'Just now'}`}
        icon={<CheckCircle2 className="h-6 w-6 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/company/data-sources')}
            >
              <Upload className="h-3.5 w-3.5" /> Upload Data
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/company/reconciliation')}
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Run Reconciliation
            </Button>
          </div>
        }
      />

      {/* 8 Summary Metric Cards - ALL CLICKABLE & NAVIGATE */}
      <div className="order-2 grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Total Invoices */}
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices.toLocaleString()}
          change="All ledger entries"
          changeType="neutral"
          icon={<FileText className="h-5 w-5" />}
          accentColor="sky"
          onClick={() => navigate('/company/reconciliation/results')}
        />

        {/* 2. Matched */}
        <StatCard
          title="Matched"
          value={stats.matchedCount.toLocaleString()}
          change={`${stats.healthRate}% matched`}
          changeType="positive"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accentColor="emerald"
          onClick={() => navigate('/company/reconciliation/results?status=MATCHED')}
        />

        {/* 3. Mismatched */}
        <StatCard
          title="Mismatched"
          value={stats.mismatchCount.toLocaleString()}
          change="Value differences"
          changeType="negative"
          icon={<AlertTriangle className="h-5 w-5" />}
          accentColor="amber"
          onClick={() => navigate('/company/reconciliation/results?status=MISMATCHED')}
        />

        {/* 4. Missing */}
        <StatCard
          title="Missing in 2B"
          value={stats.missingCount.toLocaleString()}
          change="Absent from portal"
          changeType="negative"
          icon={<FileQuestion className="h-5 w-5" />}
          accentColor="rose"
          onClick={() => navigate('/company/reconciliation/results?status=MISSING')}
        />

        {/* 5. Duplicate */}
        <StatCard
          title="Duplicate"
          value={stats.duplicateCount.toLocaleString()}
          change="Double recorded"
          changeType="negative"
          icon={<Copy className="h-5 w-5" />}
          accentColor="purple"
          onClick={() => navigate('/company/reconciliation/results?status=DUPLICATE')}
        />

        {/* 6. High Risk */}
        <StatCard
          title="High Risk"
          value={stats.highRiskCount.toLocaleString()}
          change="Immediate action"
          changeType="negative"
          icon={<ShieldAlert className="h-5 w-5" />}
          accentColor="rose"
          onClick={() => navigate('/company/itc-risk')}
        />

        {/* 7. Total ITC */}
        <StatCard
          title="Total ITC"
          value={formatCurrency(stats.totalItc)}
          change="Claimable base"
          changeType="neutral"
          icon={<IndianRupee className="h-5 w-5" />}
          accentColor="sky"
          onClick={() => navigate('/company/itc-risk')}
        />

        {/* 8. ITC at Risk */}
        <StatCard
          title="ITC at Risk"
          value={formatCurrency(stats.itcAtRisk)}
          change="Flagged for disallowance"
          changeType="negative"
          icon={<TrendingDown className="h-5 w-5" />}
          accentColor="rose"
          onClick={() => navigate('/company/itc-risk')}
        />
      </div>

      {/* Live GST Transaction Feed - centralized invoices update in real time */}
      <GlassCard className="order-1 relative overflow-hidden border-sky-300/80 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-0 shadow-[0_18px_60px_rgba(14,165,233,0.12)]">
        {/* Non-blocking live transaction toast */}
        {liveToast && (
          <div className="absolute right-4 top-4 z-10 rounded-xl border border-cyan-300/30 bg-white/10 px-4 py-3 text-xs text-white shadow-xl backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
            <p className="font-bold text-cyan-200">New GST transaction received</p>
            <p className="mt-0.5 font-mono text-white">
              {liveToast.invoice} · {liveToast.vendor}
            </p>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative z-[1] p-5">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="flex items-center gap-2 text-base font-bold text-white">
                  <Activity className="h-5 w-5 text-cyan-300" /> Live GST Transaction Feed
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    feedPaused
                      ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                      : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      feedPaused ? 'bg-amber-300' : 'bg-emerald-300 animate-pulse'
                    }`}
                  />
                  {feedPaused ? 'PAUSED' : 'LIVE'}
                </span>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-100">
                  Prototype Live Feed
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                {feedPaused ? 'Feed paused by operator' : 'Receiving transactions'} · Simulated real-time transaction stream
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="!border-white/10 !bg-white/10 !text-white hover:!bg-white/15"
                onClick={() => setFeedPaused((p) => !p)}
              >
                {feedPaused ? (
                  <PlayCircle className="h-3.5 w-3.5 text-emerald-300" />
                ) : (
                  <PauseCircle className="h-3.5 w-3.5 text-amber-300" />
                )}
                {feedPaused ? 'Resume Feed' : 'Pause Feed'}
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/company/reconciliation/results')}
              >
                View All Transactions <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2 py-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Live Transactions', value: liveCounters.total, color: 'text-cyan-200' },
              { label: 'New Today', value: liveCounters.newToday, color: 'text-white' },
              { label: 'Processing', value: liveCounters.processing, color: 'text-amber-200' },
              { label: 'Matched', value: liveCounters.matched, color: 'text-emerald-200' },
              { label: 'Mismatched', value: liveCounters.mismatched, color: 'text-orange-200' },
              { label: 'High Risk', value: liveCounters.highRisk, color: 'text-rose-200' },
            ].map((counter) => (
              <div key={counter.label} className="rounded-xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{counter.label}</p>
                <p className={`mt-1 text-xl font-black ${counter.color}`}>{counter.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-cyan-500/10 text-cyan-100">
                    <th className="px-4 py-3 font-bold">Time</th>
                    <th className="px-4 py-3 font-bold">Invoice Number</th>
                    <th className="px-4 py-3 font-bold">Vendor</th>
                    <th className="px-4 py-3 font-bold">Vendor GSTIN</th>
                    <th className="px-4 py-3 text-right font-bold">Taxable Value</th>
                    <th className="px-4 py-3 text-right font-bold">GST Amount</th>
                    <th className="px-4 py-3 text-right font-bold">ITC</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {liveTransactions.slice(0, 8).map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => navigate(`/company/invoice/${tx.id}`)}
                      className="cursor-pointer transition-colors hover:bg-cyan-400/10 group"
                    >
                      <td className="px-4 py-3 font-mono text-slate-300">{formatClock(tx.createdAt)}</td>
                      <td className="px-4 py-3 font-mono font-bold text-cyan-300 group-hover:underline">
                        {tx.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{tx.vendorName}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{tx.vendorGstin}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-200">
                        ₹{tx.companyRecord.taxableValue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-300">
                        ₹{tx.companyRecord.totalGst.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-sky-300">
                        ₹{(tx.companyRecord.totalGst - tx.itcRiskAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            tx.liveStatus === 'Received'
                              ? 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20'
                              : tx.liveStatus === 'Processing'
                              ? 'bg-amber-400/10 text-amber-200 border border-amber-400/20'
                              : 'bg-rose-400/10 text-rose-200 border border-rose-400/20'
                          }`}
                        >
                          {tx.liveStatus === 'Processing' && <Radio className="h-3 w-3 animate-pulse" />}
                          {tx.liveStatus || tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                            tx.riskLevel === 'LOW'
                              ? 'bg-emerald-400/10 text-emerald-200'
                              : tx.riskLevel === 'MEDIUM'
                              ? 'bg-amber-400/10 text-amber-200'
                              : 'bg-rose-400/10 text-rose-200'
                          }`}
                        >
                          {tx.riskLevel === 'LOW' ? 'Low' : tx.riskLevel === 'MEDIUM' ? 'Medium' : 'High'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Middle Grid: Reconciliation Health & Quick Actions */}
      <div className="order-3 grid gap-6 lg:grid-cols-3">
        {/* Reconciliation Health Section */}
        <GlassCard className="lg:col-span-2 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-sky-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> Reconciliation Health Index
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated statutory eligibility score computed across 20 parameters
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-sky-700">{stats.healthRate}%</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Healthy
              </span>
            </div>
          </div>

          {/* Health bar visualization */}
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-500 transition-all duration-700"
                style={{ width: `${(stats.matchedCount / stats.totalInvoices) * 100}%` }}
                title={`Matched: ${stats.matchedCount}`}
              />
              <div
                className="bg-amber-400 transition-all duration-700"
                style={{ width: `${(stats.mismatchCount / stats.totalInvoices) * 100}%` }}
                title={`Mismatched: ${stats.mismatchCount}`}
              />
              <div
                className="bg-rose-500 transition-all duration-700"
                style={{ width: `${(stats.missingCount / stats.totalInvoices) * 100}%` }}
                title={`Missing: ${stats.missingCount}`}
              />
              <div
                className="bg-purple-500 transition-all duration-700"
                style={{ width: `${(stats.duplicateCount / stats.totalInvoices) * 100}%` }}
                title={`Duplicate: ${stats.duplicateCount}`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
              <button
                onClick={() => navigate('/company/reconciliation/results?status=MATCHED')}
                className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 font-medium"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Matched: {stats.matchedCount}
              </button>
              <button
                onClick={() => navigate('/company/reconciliation/results?status=MISMATCHED')}
                className="flex items-center gap-1.5 text-slate-600 hover:text-amber-700 font-medium"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                Mismatches: {stats.mismatchCount}
              </button>
              <button
                onClick={() => navigate('/company/reconciliation/results?status=MISSING')}
                className="flex items-center gap-1.5 text-slate-600 hover:text-rose-700 font-medium"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Missing: {stats.missingCount}
              </button>
              <button
                onClick={() => navigate('/company/reconciliation/results?status=DUPLICATE')}
                className="flex items-center gap-1.5 text-slate-600 hover:text-purple-700 font-medium"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                Duplicate: {stats.duplicateCount}
              </button>
            </div>
          </div>

          {/* Detailed breakdown metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3.5">
              <p className="text-xs font-semibold text-slate-500">Safe to Claim in GSTR-3B</p>
              <p className="text-lg font-bold text-emerald-700 mt-1">{formatCurrency(stats.safeItc)}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Backed by verified counterparty filings</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3.5">
              <p className="text-xs font-semibold text-slate-500">Disallowed / At Risk ITC</p>
              <p className="text-lg font-bold text-rose-700 mt-1">{formatCurrency(stats.itcAtRisk)}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Requires vendor follow-up before return</p>
            </div>
          </div>
        </GlassCard>

        {/* Quick Actions Panel */}
        <GlassCard className="flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-600" /> Quick Actions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Jump directly to core modules</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => navigate('/company/data-sources')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-sky-200/70 bg-white hover:bg-sky-50/80 hover:border-sky-300 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-100 text-sky-700 group-hover:scale-105 transition-transform">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Upload Data</p>
                  <p className="text-[10px] text-slate-500">CSV/Excel sources</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/company/reconciliation')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-sky-200/70 bg-white hover:bg-sky-50/80 hover:border-sky-300 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 group-hover:scale-105 transition-transform">
                  <Play className="h-4 w-4 fill-current" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Start Reconciliation</p>
                  <p className="text-[10px] text-slate-500">20-step matching engine</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/company/mismatches')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200/70 bg-white hover:bg-amber-50/80 hover:border-amber-300 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">View Mismatches</p>
                  <p className="text-[10px] text-slate-500">{stats.mismatchCount} active differences</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/company/itc-risk')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-rose-200/70 bg-white hover:bg-rose-50/80 hover:border-rose-300 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">ITC Risk Analysis</p>
                  <p className="text-[10px] text-slate-500">Protect input credit</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/company/transaction-graph')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-indigo-200/70 bg-white hover:bg-indigo-50/80 hover:border-indigo-300 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-105 transition-transform">
                  <Network className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Transaction Graph</p>
                  <p className="text-[10px] text-slate-500">Interactive relationship mesh</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => navigate('/company/reports')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-sky-200/70 bg-white hover:bg-sky-50/80 hover:border-sky-300 transition-all text-left group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-100 text-sky-700 group-hover:scale-105 transition-transform">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Reports & Audit</p>
                  <p className="text-[10px] text-slate-500">Download Excel / PDF</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Recent Issues Table - Clickable directly to Invoice Investigation */}
      <GlassCard className="order-4 space-y-4">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" /> Recent Issues & Discrepancies
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any invoice below to launch detailed line-item investigation
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/company/mismatches')}
          >
            View All Issues <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 text-slate-500 bg-sky-50/40">
                <th className="py-2.5 px-3 font-semibold">Invoice No</th>
                <th className="py-2.5 px-3 font-semibold">Vendor Name</th>
                <th className="py-2.5 px-3 font-semibold">Taxable (Books / 2B)</th>
                <th className="py-2.5 px-3 font-semibold">Variance</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Risk Level</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {recentIssues.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/company/invoice/${inv.id}`)}
                  className="hover:bg-sky-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-sky-700 group-hover:underline">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    <div>{inv.vendorName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{inv.vendorGstin}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    <div>₹{inv.companyRecord.taxableValue.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-slate-400">
                      {inv.gstRecord ? `2B: ₹${inv.gstRecord.taxableValue.toLocaleString('en-IN')}` : 'Missing in 2B'}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-rose-600">
                    ₹{inv.taxDifference.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge
                      status={
                        inv.status === 'MATCHED'
                          ? 'success'
                          : inv.status === 'MISMATCHED'
                          ? 'warning'
                          : inv.status === 'MISSING'
                          ? 'danger'
                          : 'purple'
                      }
                      label={inv.status}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        inv.riskLevel === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : inv.riskLevel === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.riskLevel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 group-hover:text-sky-700">
                      Investigate <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
