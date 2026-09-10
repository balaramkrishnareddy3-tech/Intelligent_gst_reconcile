import { useNavigate } from 'react-router-dom';
import { useAdminSafeGstStore as useGstStore } from '@/store/useAdminSafeGstStore';
import { useState } from 'react';
import {
  Building2,
  Users,
  FileText,
  GitCompare,
  Network,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  IndianRupee,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Layers,
  Crown,
  Play,
  Plus,
  ExternalLink,
  Settings,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    invoices,
    getStats,
    getVendorsSummary,
    getAuditTrail,
    companies,
    isReconciling,
    getReconciliationStats,
    triggerReconciliationJob,
    reconciliationProgress,
    currentReconciliationStep,
    adminSettings,
  } = useGstStore();
  const stats = getStats();
  const vendors = getVendorsSummary();
  const auditEvents = getAuditTrail();
  const reconStats = getReconciliationStats();

  const [companyActionNotice, setCompanyActionNotice] = useState<string | null>(null);
  const [selectedReconCompany, setSelectedReconCompany] = useState('ALL');

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  const handleRunReconForCompany = async (e: React.MouseEvent, compName: string, compId?: string) => {
    e.stopPropagation();
    const batch = await triggerReconciliationJob(compId);
    setCompanyActionNotice(`Batch ${batch.id} executed successfully for ${compName}!`);
    setTimeout(() => setCompanyActionNotice(null), 3500);
  };

  const handleTriggerReconFromDashboard = async () => {
    const targetCompId = selectedReconCompany !== 'ALL' ? selectedReconCompany : undefined;
    const batch = await triggerReconciliationJob(targetCompId);
    setCompanyActionNotice(`Batch ${batch.id} completed for ${batch.companyName} (${batch.matchRate}% matched)!`);
    setTimeout(() => setCompanyActionNotice(null), 3500);
  };

  // ITC categories calculation
  const mediumRiskTotal = invoices
    .filter((i) => i.riskLevel === 'MEDIUM')
    .reduce((sum, i) => sum + i.itcRiskAmount, 0);

  const highRiskTotal = invoices
    .filter((i) => i.riskLevel === 'HIGH' || i.riskLevel === 'CRITICAL')
    .reduce((sum, i) => sum + i.itcRiskAmount, 0);

  // Top Risky Vendors (computed from central store)
  const riskyVendors = vendors
    .sort((a, b) => b.itcAtRisk - a.itcAtRisk)
    .slice(0, 4);

  // Recent system activity feed
  const recentActivities = [
    {
      id: 'act-1',
      activity: 'Acme Corp uploaded purchase register (Q3 FY26)',
      entity: 'Acme Corp India',
      timestamp: 'Today at 09:42 AM',
      status: 'Completed',
      type: 'success' as const,
    },
    {
      id: 'act-2',
      activity: 'Batch reconciliation #REC-847 completed (20 steps)',
      entity: 'Reconciliation Engine',
      timestamp: 'Today at 10:25 AM',
      status: 'Verified',
      type: 'success' as const,
    },
    {
      id: 'act-3',
      activity: 'High-risk statutory disallowance detected on Maheshwari Traders',
      entity: 'Maheshwari Traders',
      timestamp: 'Today at 10:26 AM',
      status: 'Critical Alert',
      type: 'danger' as const,
    },
    {
      id: 'act-4',
      activity: 'Vendor compliance score recalculated (Singh Electronics: 64%)',
      entity: 'Singh Electronics',
      timestamp: 'Yesterday at 04:15 PM',
      status: 'Score Changed',
      type: 'warning' as const,
    },
    {
      id: 'act-5',
      activity: 'Tax variance discrepancy flagged on INV-2025-4822 (₹900)',
      entity: 'Mahindra Parts',
      timestamp: 'Yesterday at 03:00 PM',
      status: 'Mismatch Logged',
      type: 'warning' as const,
    },
    {
      id: 'act-6',
      activity: 'Executive statutory audit trail exported to CSV',
      entity: 'System Administrator',
      timestamp: 'Yesterday at 01:20 PM',
      status: 'Export Ready',
      type: 'info' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <PageHeader
        title="Admin Portal — Global System Overview"
        subtitle="Platform-wide multi-tenant GST reconciliation monitoring, ITC exposure control, and vendor risk telemetry"
        icon={<Crown className="h-6 w-6 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/admin/reconciliation')}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Monitor Jobs
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/admin/reports')}
            >
              <FileText className="h-3.5 w-3.5" /> System Reports
            </Button>
          </div>
        }
      />

      {/* 1. Summary Cards (8 metrics) */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Companies */}
        <StatCard
          title="Total Companies"
          value={companies.length}
          change={`${companies.filter((c) => c.status === 'active').length} active enterprises`}
          changeType="positive"
          icon={<Building2 className="h-5 w-5" />}
          accentColor="sky"
          onClick={() => navigate('/admin/companies')}
        />

        {/* Total Vendors */}
        <StatCard
          title="Total Vendors"
          value={vendors.length}
          change={`${vendors.filter((v) => v.complianceScore >= 80).length} compliant`}
          changeType="positive"
          icon={<Users className="h-5 w-5" />}
          accentColor="purple"
          onClick={() => navigate('/admin/vendors')}
        />

        {/* Total Invoices */}
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices.toLocaleString()}
          change="Centralized ledger entries"
          changeType="neutral"
          icon={<FileText className="h-5 w-5" />}
          accentColor="sky"
          onClick={() => navigate('/admin/invoices')}
        />

        {/* Total Reconciliations */}
        <StatCard
          title="Total Reconciliations"
          value={reconStats.total}
          change={`${reconStats.completed} completed (${reconStats.successRate}%)`}
          changeType="positive"
          icon={<GitCompare className="h-5 w-5" />}
          accentColor="emerald"
          onClick={() => navigate('/admin/reconciliation')}
        />

        {/* Total Matched */}
        <StatCard
          title="Total Matched"
          value={stats.matchedCount}
          change={`${stats.healthRate}% statutory match`}
          changeType="positive"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accentColor="emerald"
          onClick={() => navigate('/admin/mismatches?tab=MATCHED')}
        />

        {/* Total Mismatched */}
        <StatCard
          title="Total Mismatched"
          value={stats.mismatchCount}
          change="Tax deviations flagged"
          changeType="negative"
          icon={<AlertTriangle className="h-5 w-5" />}
          accentColor="amber"
          onClick={() => navigate('/admin/mismatches')}
        />

        {/* High Risk Invoices */}
        <StatCard
          title="High Risk Invoices"
          value={stats.highRiskCount}
          change="Section 16 statutory breach"
          changeType="negative"
          icon={<ShieldAlert className="h-5 w-5" />}
          accentColor="rose"
          onClick={() => navigate('/admin/itc-risk')}
        />

        {/* Total ITC at Risk */}
        <StatCard
          title="Total ITC at Risk"
          value={formatCurrency(stats.itcAtRisk)}
          change="System-wide disallowed credit"
          changeType="negative"
          icon={<IndianRupee className="h-5 w-5" />}
          accentColor="rose"
          onClick={() => navigate('/admin/itc-risk')}
        />
      </div>

      {/* 2. Three Analytic Monitoring Blocks (Reconciliation, Mismatches, ITC Risk) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* RECONCILIATION OVERVIEW */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <GitCompare className="h-4 w-4 text-sky-600" /> Reconciliation Monitoring
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Automated batch execution health</p>
            </div>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {reconStats.total} Batches
            </span>
          </div>

          {/* Metric Counts - ALL CLICKABLE AND FILTER RECON PAGE */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <button
              onClick={() => navigate('/admin/reconciliation?status=Completed')}
              className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 hover:bg-emerald-100/60 transition-colors cursor-pointer group"
              title="Filter by Completed Batches"
            >
              <span className="text-[10px] font-semibold text-slate-500 uppercase group-hover:text-emerald-800">
                Completed
              </span>
              <p className="text-lg font-bold text-emerald-700 mt-0.5">{reconStats.completed}</p>
            </button>
            <button
              onClick={() => navigate('/admin/reconciliation?status=In Progress')}
              className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5 hover:bg-amber-100/60 transition-colors cursor-pointer group"
              title="Filter by In Progress Batches"
            >
              <span className="text-[10px] font-semibold text-slate-500 uppercase group-hover:text-amber-800">
                In Progress
              </span>
              <p className="text-lg font-bold text-amber-700 mt-0.5">{reconStats.inProgress}</p>
            </button>
            <button
              onClick={() => navigate('/admin/reconciliation?status=Failed')}
              className="rounded-xl border border-rose-100 bg-rose-50/50 p-2.5 hover:bg-rose-100/60 transition-colors cursor-pointer group"
              title="Filter by Failed / Retriable Batches"
            >
              <span className="text-[10px] font-semibold text-slate-500 uppercase group-hover:text-rose-800">
                Failed
              </span>
              <p className="text-lg font-bold text-rose-700 mt-0.5">{reconStats.failed}</p>
            </button>
          </div>

          {/* Live Execution Ticker during reconciliation */}
          {isReconciling ? (
            <div className="rounded-xl border border-sky-300 bg-sky-50/90 p-3 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-bold text-sky-900">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                  Live Reconciliation Pipeline Executing...
                </span>
                <span className="font-mono">{reconciliationProgress}%</span>
              </div>
              <p className="text-[11px] text-sky-800 font-medium truncate">
                {currentReconciliationStep}
              </p>
              <div className="h-1.5 w-full bg-sky-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-600 transition-all duration-150"
                  style={{ width: `${reconciliationProgress}%` }}
                />
              </div>
            </div>
          ) : (
            /* Visual Distribution Chart */
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Execution Success Ratio</span>
                <span className="text-emerald-700 font-bold">{reconStats.successRate}% Success</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(reconStats.completed / (reconStats.total || 1)) * 100}%` }}
                  title={`Completed: ${reconStats.completed}`}
                />
                <div
                  className="bg-amber-400 transition-all duration-500"
                  style={{ width: `${(reconStats.inProgress / (reconStats.total || 1)) * 100}%` }}
                  title={`In Progress: ${reconStats.inProgress}`}
                />
                <div
                  className="bg-rose-500 transition-all duration-500"
                  style={{ width: `${(reconStats.failed / (reconStats.total || 1)) * 100}%` }}
                  title={`Failed: ${reconStats.failed}`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Completed ({reconStats.completed})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Active ({reconStats.inProgress})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Failed ({reconStats.failed})
                </span>
              </div>
            </div>
          )}

          {/* Quick Trigger on Dashboard Card */}
          <div className="pt-2 border-t border-sky-100 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <select
                value={selectedReconCompany}
                onChange={(e) => setSelectedReconCompany(e.target.value)}
                className="flex-1 rounded-xl border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none"
              >
                <option value="ALL">All Enterprise Tenants</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                className="text-xs shrink-0"
                disabled={isReconciling}
                loading={isReconciling}
                onClick={handleTriggerReconFromDashboard}
              >
                <Play className="h-3 w-3 fill-current" /> Trigger Run
              </Button>
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="w-full text-xs"
              onClick={() => navigate('/admin/reconciliation')}
            >
              Open Pipeline Control Center <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </GlassCard>

        {/* MISMATCH OVERVIEW - FULLY WORKABLE */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> Mismatch Monitoring
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Click any category to filter & resolve</p>
            </div>
            <button
              onClick={() => navigate('/admin/mismatches?tab=ALL')}
              className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 cursor-pointer"
            >
              {stats.mismatchCount + stats.missingCount + stats.duplicateCount + stats.highRiskCount} Issues
            </button>
          </div>

          {/* Interactive Breakdown bars - All Clickable to filter mismatches */}
          <div className="space-y-2 text-xs">
            {[
              { label: 'Matched (Verified)', tab: 'MATCHED', count: stats.matchedCount, color: 'bg-emerald-500', total: stats.totalInvoices },
              { label: 'Tax Value Discrepancies', tab: 'MISMATCHED', count: stats.mismatchCount, color: 'bg-amber-500', total: stats.totalInvoices },
              { label: 'Missing in GSTR-2B Statement', tab: 'MISSING', count: stats.missingCount, color: 'bg-rose-500', total: stats.totalInvoices },
              { label: 'Duplicate Ledger Entries', tab: 'DUPLICATE', count: stats.duplicateCount, color: 'bg-purple-500', total: stats.totalInvoices },
              { label: 'Statutory Suspended Flags', tab: 'HIGH_RISK', count: stats.highRiskCount, color: 'bg-red-600', total: stats.totalInvoices },
            ].map((cat) => (
              <div
                key={cat.label}
                onClick={() => navigate(`/admin/mismatches?tab=${cat.tab}`)}
                className="p-1.5 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer group space-y-1"
                title={`Filter mismatches by ${cat.label}`}
              >
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-slate-700 group-hover:text-sky-700 flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${cat.color}`} />
                    {cat.label}
                  </span>
                  <span className="font-mono font-bold text-slate-900 group-hover:text-sky-700">
                    {cat.count} ({Math.round((cat.count / (cat.total || 1)) * 100)}%)
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${cat.color} transition-all duration-500`}
                    style={{ width: `${(cat.count / (cat.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-sky-100 flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="w-full text-xs"
              onClick={() => navigate('/admin/mismatches')}
            >
              Open Mismatch Workstation <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </GlassCard>

        {/* ITC RISK OVERVIEW - FULLY WORKABLE */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-600" /> ITC Risk Monitoring
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Click any metric to drill down</p>
            </div>
            <button
              onClick={() => navigate('/admin/itc-risk?risk=CRITICAL')}
              className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 hover:bg-rose-100 cursor-pointer"
            >
              {formatCurrency(stats.itcAtRisk)} Exposed
            </button>
          </div>

          {/* Interactive Metric Rows */}
          <div className="space-y-1.5 text-xs">
            <div
              onClick={() => navigate('/admin/itc-risk?risk=ALL')}
              className="flex justify-between py-1.5 px-2 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer border-b border-sky-100/60"
            >
              <span className="text-slate-600 font-medium">Total ITC Base</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatCurrency(stats.totalItc)}
              </span>
            </div>
            <div
              onClick={() => navigate('/admin/itc-risk?risk=LOW')}
              className="flex justify-between py-1.5 px-2 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer border-b border-sky-100/60"
            >
              <span className="text-slate-600 font-medium">Matched & Safe ITC</span>
              <span className="font-bold text-emerald-700 font-mono">
                {formatCurrency(stats.safeItc)}
              </span>
            </div>
            <div
              onClick={() => navigate('/admin/itc-risk?risk=MEDIUM')}
              className="flex justify-between py-1.5 px-2 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer border-b border-sky-100/60"
            >
              <span className="text-slate-600 font-medium">Potentially Risky ITC</span>
              <span className="font-bold text-amber-700 font-mono">
                {formatCurrency(mediumRiskTotal)}
              </span>
            </div>
            <div
              onClick={() => navigate('/admin/itc-risk?risk=CRITICAL')}
              className="flex justify-between py-1.5 px-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <span className="text-slate-600 font-medium">High / Critical Risk ITC</span>
              <span className="font-bold text-rose-700 font-mono">
                {formatCurrency(highRiskTotal)}
              </span>
            </div>
          </div>

          {/* Risk distribution stacked bar - Clickable */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600">
              <span>Risk Allocation Distribution</span>
              <span className="font-mono text-emerald-700 font-bold">
                {Math.round((stats.safeItc / (stats.totalItc || 1)) * 100)}% Safe
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner cursor-pointer">
              <div
                onClick={() => navigate('/admin/itc-risk?risk=LOW')}
                className="bg-emerald-500 hover:opacity-90 transition-all"
                style={{ width: `${(stats.safeItc / (stats.totalItc || 1)) * 100}%` }}
                title={`Safe ITC: ${formatCurrency(stats.safeItc)}`}
              />
              <div
                onClick={() => navigate('/admin/itc-risk?risk=MEDIUM')}
                className="bg-amber-400 hover:opacity-90 transition-all"
                style={{ width: `${(mediumRiskTotal / (stats.totalItc || 1)) * 100}%` }}
                title={`Potentially Risky: ${formatCurrency(mediumRiskTotal)}`}
              />
              <div
                onClick={() => navigate('/admin/itc-risk?risk=CRITICAL')}
                className="bg-rose-500 hover:opacity-90 transition-all"
                style={{ width: `${(highRiskTotal / (stats.totalItc || 1)) * 100}%` }}
                title={`High Risk: ${formatCurrency(highRiskTotal)}`}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-sky-100 flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="w-full text-xs"
              onClick={() => navigate('/admin/itc-risk')}
            >
              Monitor ITC Risk Matrix <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* 3. Top Risky Companies & Top Risky Vendors (from centralized store) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Risky Companies */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-sky-600" /> Enterprise Tenants & Companies ({companies.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Client organizations with real-time statutory verification & reconciliation telemetry
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => navigate('/admin/companies')}
              >
                <Plus className="h-3 w-3" /> Onboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/companies')}
              >
                All <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {companyActionNotice && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="font-bold">{companyActionNotice}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                  <th className="py-2 px-3 font-semibold">Company Name</th>
                  <th className="py-2 px-3 font-semibold">GSTIN</th>
                  <th className="py-2 px-3 font-semibold text-center">Invoices</th>
                  <th className="py-2 px-3 font-semibold">Risk Level</th>
                  <th className="py-2 px-3 font-semibold text-right">Score</th>
                  <th className="py-2 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/60">
                {companies.map((comp) => (
                  <tr
                    key={comp.id}
                    onClick={() => navigate(`/admin/companies/${comp.id}`)}
                    className="hover:bg-sky-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 group-hover:text-sky-700">
                        {comp.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                        {comp.adminEmail}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-600">
                      <span className="font-bold text-sky-800">{comp.gstin}</span>
                    </td>

                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                      {comp.invoiceCount}
                    </td>

                    <td className="py-2.5 px-3">
                      <StatusBadge
                        status={
                          comp.riskLevel === 'LOW'
                            ? 'success'
                            : comp.riskLevel === 'MEDIUM'
                            ? 'warning'
                            : 'danger'
                        }
                        label={comp.riskLevel}
                      />
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {comp.complianceScore}%
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => handleRunReconForCompany(e, comp.name)}
                          disabled={isReconciling}
                          className="rounded-lg p-1 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="Run 20-Step Reconciliation"
                        >
                          <Play className="h-3 w-3 fill-current" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/companies/${comp.id}`);
                          }}
                          className="rounded-lg px-2 py-0.5 text-[11px] font-bold text-sky-600 hover:bg-sky-50 hover:text-sky-800 transition-colors cursor-pointer flex items-center gap-0.5"
                          title="View Company Dossier"
                        >
                          Dossier <ExternalLink className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Top Risky Vendors */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" /> Top Risky Vendors (Counterparties)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Suppliers flagged for GSTR-1 non-filings and suspended GSTINs
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/vendors')}
            >
              All Vendors <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                  <th className="py-2 px-3 font-semibold">Vendor Name</th>
                  <th className="py-2 px-3 font-semibold">GSTIN</th>
                  <th className="py-2 px-3 font-semibold text-center">Invoices</th>
                  <th className="py-2 px-3 font-semibold text-center">Mismatches</th>
                  <th className="py-2 px-3 font-semibold">Risk Level</th>
                  <th className="py-2 px-3 font-semibold text-right">Score</th>
                  <th className="py-2 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/60">
                {riskyVendors.map((vend) => (
                  <tr
                    key={vend.gstin}
                    onClick={() => navigate(`/admin/vendors/${vend.id}`)}
                    className="hover:bg-sky-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-bold text-slate-800 group-hover:text-indigo-700">
                      {vend.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">{vend.gstin}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                      {vend.invoiceCount}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        {vend.mismatchCount + vend.missingCount}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge
                        status={
                          vend.riskLevel === 'LOW'
                            ? 'success'
                            : vend.riskLevel === 'MEDIUM'
                            ? 'warning'
                            : 'danger'
                        }
                        label={vend.riskLevel}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {vend.complianceScore}%
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/vendors/${vend.id}`);
                        }}
                        className="rounded-lg px-2 py-0.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors cursor-pointer inline-flex items-center gap-0.5"
                        title="View Vendor Dossier"
                      >
                        Profile <ArrowRight className="h-2.5 w-2.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* 4. Recent System Activity & Audit Stream */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-600" /> Recent System-Wide Activity & Audit Stream
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live chronological stream of ingestions, reconciliations, and risk alerts • Click row to verify
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/audit-trail')}
          >
            Complete Audit Trail ({auditEvents.length} Events) <ArrowRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-2.5 px-3 font-semibold">Activity Description</th>
                <th className="py-2.5 px-3 font-semibold">Entity / Actor</th>
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold text-right">Processing Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {recentActivities.map((act) => (
                <tr
                  key={act.id}
                  onClick={() => navigate('/admin/audit-trail')}
                  className="hover:bg-sky-50/70 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3 font-semibold text-slate-800 group-hover:text-sky-800">
                    {act.activity}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-[11px] text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {act.entity}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {act.timestamp}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <StatusBadge status={act.type} label={act.status} />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-[11px] font-bold text-sky-600 group-hover:text-sky-800 inline-flex items-center gap-1">
                      Inspect <ArrowRight className="h-3 w-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Interactive Transaction Graph & Knowledge Topology Spotlight */}
      <GlassCard className="p-5 bg-gradient-to-r from-sky-50/80 via-white to-blue-50/80 border-sky-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-md">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Global Transaction Knowledge Graph Active
                </h3>
                <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full border border-cyan-200">
                  D3.js Force Simulation
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Relational multi-tenant network linking Company, Vendor, Invoice, Purchase Record, GST Record,
                Mismatch, ITC, Risk, and Audit nodes in real-time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/admin/transaction-graph?focus=Maheshwari')}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> Trace Critical Risk Path
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/admin/transaction-graph')}
            >
              <Network className="h-3.5 w-3.5" /> Launch Knowledge Graph <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* 5. Admin Quick Actions (All 7 buttons navigate to appropriate Admin page) */}
      <GlassCard className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-600" /> Admin Navigation & Quick Actions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct routing to all dedicated system administration modules
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <Button
            variant="secondary"
            size="sm"
            className="flex-col py-3 h-auto text-xs font-bold gap-1.5"
            onClick={() => navigate('/admin/companies')}
          >
            <Building2 className="h-4 w-4 text-sky-600" />
            <span>Companies</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-col py-3 h-auto text-xs font-bold gap-1.5"
            onClick={() => navigate('/admin/vendors')}
          >
            <Users className="h-4 w-4 text-indigo-600" />
            <span>Vendors</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-col py-3 h-auto text-xs font-bold gap-1.5"
            onClick={() => navigate('/admin/reconciliation')}
          >
            <GitCompare className="h-4 w-4 text-emerald-600" />
            <span>Reconcile</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-col py-3 h-auto text-xs font-bold gap-1.5"
            onClick={() => navigate('/admin/mismatches')}
          >
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Mismatches</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-col py-3 h-auto text-xs font-bold gap-1.5"
            onClick={() => navigate('/admin/itc-risk')}
          >
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span>ITC Risk</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-col py-3 h-auto text-xs font-bold gap-1.5"
            onClick={() => navigate('/admin/transaction-graph')}
          >
            <Layers className="h-4 w-4 text-cyan-600" />
            <span>Trans Graph</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-col py-3 h-auto text-xs font-bold gap-1.5"
            onClick={() => navigate('/admin/reports')}
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Reports</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-col py-3 h-auto text-xs font-bold gap-1.5"
            onClick={() => navigate('/admin/settings')}
          >
            <Settings className="h-4 w-4 text-slate-700" />
            <span>Settings</span>
          </Button>
        </div>

        {/* Active Platform Configuration Telemetry Ribbon */}
        <div className="pt-3 border-t border-sky-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-sky-50/50 p-3 rounded-xl">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5 text-sky-600" /> Active Platform Engine Rules:
            </span>
            <span className="bg-white px-2 py-0.5 rounded border border-sky-200 font-mono text-sky-800 font-semibold">
              Tolerance: ±₹{adminSettings.tolerance}
            </span>
            <span className="bg-white px-2 py-0.5 rounded border border-sky-200 text-slate-700 font-semibold">
              Strategy: {adminSettings.matchingStrategy.replace('_', ' ').toUpperCase()}
            </span>
            <span className="bg-white px-2 py-0.5 rounded border border-sky-200 text-slate-700 font-semibold">
              Scheduler: {adminSettings.autoReconInterval.toUpperCase()}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-xs font-bold text-sky-700 hover:text-sky-900 px-2"
            onClick={() => navigate('/admin/settings')}
          >
            Configure Engine Settings <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
