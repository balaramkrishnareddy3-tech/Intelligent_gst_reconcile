import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGstStore, RECON_STEPS } from '@/store/gstStore';
import {
  GitCompare,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Calendar,
  Filter,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';

export default function Reconciliation() {
  const navigate = useNavigate();
  const {
    invoices,
    runReconciliation,
    isReconciling,
    reconciliationProgress,
    currentReconciliationStep,
    lastReconciliationTimestamp,
    getStats,
  } = useGstStore();

  const [activeReturnPeriod, setActiveReturnPeriod] = useState('November 2025');
  const [tolerance, setTolerance] = useState('± ₹10 (Standard Statutory)');
  const [isCompleted, setIsCompleted] = useState(false);
  const stats = getStats();

  const handleStartReconciliation = async () => {
    setIsCompleted(false);
    await runReconciliation();
    setIsCompleted(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automated 20-Step Reconciliation Engine"
        subtitle="Cross-verify purchase ledger vs GSTR-2B • Exact statutory rule matching"
        icon={<GitCompare className="h-6 w-6 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/company/data-sources')}
            >
              Verify Feeds
            </Button>
            <Button
              size="sm"
              disabled={isReconciling}
              loading={isReconciling}
              onClick={handleStartReconciliation}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {isReconciling ? 'Executing 20 Rules...' : 'Run Engine Now'}
            </Button>
          </div>
        }
      />

      {/* Engine Controls & Parameters Card */}
      <GlassCard className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Filter className="h-4 w-4 text-sky-600" /> Reconciliation Ruleset & Tolerance Configuration
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-sky-600" /> Return Filing Period
            </label>
            <select
              value={activeReturnPeriod}
              onChange={(e) => setActiveReturnPeriod(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-sky-500 focus:outline-none"
            >
              <option>November 2025 (Current)</option>
              <option>October 2025</option>
              <option>September 2025</option>
              <option>Q2 FY 2025-26</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-600" /> Statutory Target
            </label>
            <div className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 flex items-center justify-between">
              <span>GSTR-2B Statement (Auto-Drafted)</span>
              <StatusBadge status="success" label="Active" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-sky-600" /> Value Deviation Tolerance
            </label>
            <select
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-xs focus:border-sky-500 focus:outline-none"
            >
              <option>± ₹10 (Standard Statutory)</option>
              <option>± ₹1 (Strict Zero-Error)</option>
              <option>± 0.5% (Relative Percent)</option>
              <option>± ₹100 (High Volume Threshold)</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Progress & Live Step Execution Card */}
      <GlassCard className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-sky-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-sky-600" /> Real-time Execution Pipeline (20 Mandatory Steps)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Operating on {invoices.length} central ledger records • Direct memory normalization
            </p>
          </div>

          {isCompleted && (
            <Button
              size="sm"
              onClick={() => navigate('/company/reconciliation/results')}
              className="animate-bounce"
            >
              View Results Matrix <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Big Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">
              {isReconciling
                ? currentReconciliationStep
                : isCompleted
                ? 'Reconciliation engine finished all 20 verification steps successfully!'
                : `Engine standby • Last executed: ${lastReconciliationTimestamp || 'Today'}`}
            </span>
            <span className="font-mono text-sm font-bold text-sky-700">
              {reconciliationProgress}%
            </span>
          </div>

          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600'
              }`}
              style={{ width: `${reconciliationProgress}%` }}
            />
          </div>
        </div>

        {/* 20 Pipeline Steps Interactive List */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 max-h-[360px] overflow-y-auto pr-1">
          {RECON_STEPS.map((stepText, idx) => {
            const stepNum = idx + 1;
            const isDone = reconciliationProgress >= (stepNum / RECON_STEPS.length) * 100;
            const isCurrent = isReconciling && !isDone && reconciliationProgress >= ((stepNum - 1) / RECON_STEPS.length) * 100;

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-xs transition-all duration-200 flex items-start gap-2.5 ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/60 text-emerald-900 font-medium'
                    : isCurrent
                    ? 'border-sky-400 bg-sky-50 text-sky-900 ring-2 ring-sky-400/20 shadow-xs'
                    : 'border-slate-100 bg-white/70 text-slate-500'
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-sky-500 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-3 w-3" /> : stepNum}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-[11px] truncate">Step {stepNum}</p>
                  <p className="text-[10px] leading-tight line-clamp-2 mt-0.5">{stepText}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final CTA once complete */}
        {isCompleted && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-900">
                  Reconciliation Complete: {stats.matchedCount} Matched, {stats.mismatchCount} Mismatched, {stats.missingCount} Missing
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Audit events and knowledge graph relationships have been synchronized with the latest calculation.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => navigate('/company/reconciliation/results')}
            >
              Explore Reconciliation Results <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
