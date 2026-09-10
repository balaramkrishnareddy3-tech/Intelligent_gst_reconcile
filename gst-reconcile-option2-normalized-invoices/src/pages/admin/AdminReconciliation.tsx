import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { RECON_STEPS } from '@/store/gstStore';
import { useAdminSafeGstStore as useGstStore } from '@/store/useAdminSafeGstStore';
import type { ReconciliationBatch } from '@/types/gst';
import {
  GitCompare,
  Clock,
  Play,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Download,
  Eye,
  X,
  ShieldCheck,
  Building2,
  Layers,
  Sparkles,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AdminReconciliation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';
  const navigate = useNavigate();

  const {
    batches,
    companies,
    isReconciling,
    reconciliationProgress,
    currentReconciliationStep,
    triggerReconciliationJob,
    retryFailedBatch,
    deleteBatchJob,
    getReconciliationStats,
  } = useGstStore();

  const stats = getReconciliationStats();

  // Component state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');
  const [selectedBatch, setSelectedBatch] = useState<ReconciliationBatch | null>(null);
  const [selectedTriggerCompany, setSelectedTriggerCompany] = useState<string>('ALL');
  const [alertNotice, setAlertNotice] = useState<string | null>(null);
  const [isRetryingId, setIsRetryingId] = useState<string | null>(null);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      // Status filter
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      // Company filter
      if (companyFilter !== 'ALL' && b.companyId !== companyFilter && b.companyName !== companyFilter)
        return false;
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          b.id.toLowerCase().includes(q) ||
          b.companyName.toLowerCase().includes(q) ||
          b.period.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [batches, statusFilter, companyFilter, search]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    if (status === 'ALL') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  const handleTriggerRun = async () => {
    const targetCompId = selectedTriggerCompany !== 'ALL' ? selectedTriggerCompany : undefined;
    const batch = await triggerReconciliationJob(targetCompId);
    setAlertNotice(
      `Reconciliation batch ${batch.id} executed successfully for ${batch.companyName}! Verified ${batch.totalRecords} records (${batch.matchRate}% match).`
    );
    setTimeout(() => setAlertNotice(null), 4000);
  };

  const handleRetry = async (e: React.MouseEvent, batchId: string) => {
    e.stopPropagation();
    setIsRetryingId(batchId);
    await retryFailedBatch(batchId);
    setIsRetryingId(null);
    setAlertNotice(`Batch ${batchId} was repaired and successfully executed!`);
    setTimeout(() => setAlertNotice(null), 3500);

    // Refresh modal if active
    if (selectedBatch?.id === batchId) {
      const updated = batches.find((b) => b.id === batchId);
      if (updated) setSelectedBatch(updated);
    }
  };

  const handleDelete = (e: React.MouseEvent, batchId: string) => {
    e.stopPropagation();
    if (confirm(`Archive and remove reconciliation run ${batchId}?`)) {
      deleteBatchJob(batchId);
      if (selectedBatch?.id === batchId) setSelectedBatch(null);
      setAlertNotice(`Removed reconciliation batch ${batchId}.`);
      setTimeout(() => setAlertNotice(null), 3000);
    }
  };

  const exportTelemetryCsv = () => {
    const headers = [
      'Batch ID',
      'Client Organization',
      'Filing Period',
      'Total Invoices',
      'Statutory Matched',
      'Mismatches Flagged',
      'Missing Invoices',
      'Duplicate Invoices',
      'Match Rate (%)',
      'Status',
      'Execution Duration (s)',
      'Rules Applied',
      'Variance Amount (₹)',
      'Timestamp',
    ];

    const rows = filteredBatches.map((b) => [
      b.id,
      `"${b.companyName}"`,
      b.period,
      b.totalRecords,
      b.matchedCount,
      b.mismatchCount,
      b.missingCount,
      b.duplicateCount,
      b.matchRate,
      b.status,
      b.durationSeconds,
      b.rulesApplied,
      b.varianceAmount,
      `"${b.timestamp}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reconciliation_Pipeline_Monitoring_${statusFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setAlertNotice('Exported reconciliation telemetry to CSV.');
    setTimeout(() => setAlertNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Reconciliation Engine Pipeline Monitoring"
        subtitle="Global surveillance and orchestration of multi-tenant automated 20-step reconciliation jobs"
        icon={<GitCompare className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={exportTelemetryCsv}
            >
              <Download className="h-3.5 w-3.5" /> Export Telemetry CSV
            </Button>
            <Button
              size="sm"
              disabled={isReconciling}
              loading={isReconciling}
              onClick={handleTriggerRun}
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Trigger Pipeline Run
            </Button>
          </div>
        }
      />

      {/* Action Notification Banner */}
      {alertNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{alertNotice}</span>
        </div>
      )}

      {/* Summary Pipeline Telemetry KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Executed Batches</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across all client enterprises</p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Pipeline Success Rate</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.successRate}%</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {stats.completed} Completed Jobs
          </p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Active / In Progress</p>
          <p className="text-2xl font-bold text-amber-700 mt-1 flex items-center gap-2">
            {stats.inProgress}
            {stats.inProgress > 0 && (
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </p>
          <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Live execution queue</p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Failed / Retriable</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats.failed}</p>
          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">Schema or payload errors</p>
        </GlassCard>
      </div>

      {/* Real-time Execution Pipeline Live Monitor (Visible when reconciling) */}
      {isReconciling && (
        <GlassCard className="p-5 border-sky-300 bg-sky-50/80 space-y-3 shadow-md animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-sky-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500 text-white animate-spin">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-sky-950 flex items-center gap-2">
                  Live Reconciliation Pipeline Executing
                  <span className="text-[10px] font-bold bg-sky-200 text-sky-900 px-2 py-0.5 rounded-full">
                    Active Run
                  </span>
                </h3>
                <p className="text-xs text-sky-800 font-medium mt-0.5">
                  Current Step: <span className="font-bold">{currentReconciliationStep}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-xl font-black text-sky-900">
                {reconciliationProgress}%
              </span>
              <p className="text-[10px] text-sky-700 font-semibold">20 Statutory Rules</p>
            </div>
          </div>

          <div className="h-3 w-full bg-sky-200/60 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 transition-all duration-150"
              style={{ width: `${reconciliationProgress}%` }}
            />
          </div>
        </GlassCard>
      )}

      {/* Orchestration & Trigger Bar */}
      <GlassCard className="p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-sky-600" /> Pipeline Orchestration Controller
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Trigger 20-step verification run on-demand for specific client organization or global platform
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTriggerCompany}
              onChange={(e) => setSelectedTriggerCompany(e.target.value)}
              className="rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Registered Tenants (Global Pass)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.gstin})
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={isReconciling}
              loading={isReconciling}
              onClick={handleTriggerRun}
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Execute Run Now
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search batches by ID (e.g. REC-847), Company Name, or Period..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Company Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="rounded-xl border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Client Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Tab Chips */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleStatusFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-sky-50 border border-sky-100'
              }`}
            >
              All ({batches.length})
            </button>
            <button
              onClick={() => handleStatusFilterChange('Completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'Completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-emerald-50 border border-sky-100'
              }`}
            >
              Completed ({stats.completed})
            </button>
            <button
              onClick={() => handleStatusFilterChange('In Progress')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'In Progress'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-amber-50 border border-sky-100'
              }`}
            >
              In Progress ({stats.inProgress})
            </button>
            <button
              onClick={() => handleStatusFilterChange('Failed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'Failed'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-rose-50 border border-sky-100'
              }`}
            >
              Failed ({stats.failed})
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Main Reconciliation Batches Telemetry Table */}
      <GlassCard className="p-0 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Live Reconciliation Pipeline Batch Registry ({filteredBatches.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click row to view full 20-rule logs and diagnostic telemetry
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-3 px-4 font-bold">Batch ID</th>
                <th className="py-3 px-4 font-bold">Client Organization</th>
                <th className="py-3 px-4 font-bold">Filing Period</th>
                <th className="py-3 px-4 font-bold text-center">Invoices</th>
                <th className="py-3 px-4 font-bold text-center">Match Rate</th>
                <th className="py-3 px-4 font-bold text-center">Mismatches</th>
                <th className="py-3 px-4 font-bold">Variance (₹)</th>
                <th className="py-3 px-4 font-bold text-center">Duration</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Execution Timestamp</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <GitCompare className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="font-semibold text-sm text-slate-700">No reconciliation runs found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try switching filter tabs or triggering a new reconciliation batch.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => (
                  <tr
                    key={batch.id}
                    onClick={() => setSelectedBatch(batch)}
                    className="hover:bg-sky-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700 group-hover:underline">
                      {batch.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{batch.companyName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Tenant ID: {batch.companyId}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {batch.period}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {batch.totalRecords}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-bold ${
                          batch.status === 'Failed'
                            ? 'text-slate-400'
                            : batch.matchRate >= 90
                            ? 'text-emerald-700'
                            : batch.matchRate >= 70
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {batch.status === 'Failed' ? '—' : `${batch.matchRate}%`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold">
                      {batch.mismatchCount > 0 ? (
                        <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          {batch.mismatchCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {batch.varianceAmount > 0 ? (
                        <span className="text-rose-600">
                          ₹{batch.varianceAmount.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-700">₹0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-500">
                      {batch.durationSeconds}s
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge
                        status={
                          batch.status === 'Completed'
                            ? 'success'
                            : batch.status === 'In Progress'
                            ? 'warning'
                            : 'danger'
                        }
                        label={batch.status}
                      />
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {batch.timestamp}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBatch(batch);
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer"
                          title="Inspect Telemetry & Logs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        {(batch.status === 'Failed' || batch.status === 'In Progress') && (
                          <button
                            onClick={(e) => handleRetry(e, batch.id)}
                            disabled={isRetryingId === batch.id || isReconciling}
                            className="rounded-lg p-1 text-amber-600 hover:bg-amber-50 hover:text-amber-800 transition-colors cursor-pointer"
                            title="Retry Batch Pipeline"
                          >
                            <RotateCcw
                              className={`h-3.5 w-3.5 ${
                                isRetryingId === batch.id ? 'animate-spin' : ''
                              }`}
                            />
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDelete(e, batch.id)}
                          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Archive / Remove Batch"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Batch Telemetry & Verification Drawer Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-sky-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-sky-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-700 font-bold text-xs font-mono">
                  {selectedBatch.id}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Batch Telemetry Dossier: {selectedBatch.companyName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Filing Period: {selectedBatch.period} • Executed: {selectedBatch.timestamp}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedBatch(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Failure Diagnostic Alert if Failed */}
              {selectedBatch.status === 'Failed' && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 space-y-2 text-rose-900">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span className="font-bold text-sm">Execution Failure Diagnostic</span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">
                    {selectedBatch.failureReason ||
                      'Statutory payload validation interrupted due to schema mismatch.'}
                  </p>
                  <div className="pt-2">
                    <Button
                      size="sm"
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                      onClick={(e) => handleRetry(e, selectedBatch.id)}
                      loading={isRetryingId === selectedBatch.id}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Repair Schema & Retry Batch Now
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Stat Tiles */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">
                    Status
                  </span>
                  <div className="mt-1">
                    <StatusBadge
                      status={
                        selectedBatch.status === 'Completed'
                          ? 'success'
                          : selectedBatch.status === 'In Progress'
                          ? 'warning'
                          : 'danger'
                      }
                      label={selectedBatch.status}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">
                    Match Rate
                  </span>
                  <p className="text-base font-bold text-emerald-700 mt-1">
                    {selectedBatch.status === 'Failed' ? '—' : `${selectedBatch.matchRate}%`}
                  </p>
                </div>

                <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">
                    Total Records
                  </span>
                  <p className="text-base font-bold text-slate-900 mt-1">
                    {selectedBatch.totalRecords}
                  </p>
                </div>

                <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">
                    Execution Time
                  </span>
                  <p className="text-base font-bold text-sky-700 mt-1">
                    {selectedBatch.durationSeconds}s
                  </p>
                </div>
              </div>

              {/* 20-Step Statutory Ruleset Checklist */}
              <div className="rounded-xl border border-sky-100 bg-white p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-sky-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    20-Step Statutory Normalization & Matching Ruleset
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    {selectedBatch.rulesApplied} of 20 Rules Passed
                  </span>
                </div>

                <div className="grid gap-1.5 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1">
                  {RECON_STEPS.map((step, idx) => {
                    const isPassed = idx < selectedBatch.rulesApplied;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-[11px] ${
                          isPassed
                            ? 'border-emerald-100 bg-emerald-50/40 text-emerald-900'
                            : 'border-slate-100 bg-slate-50/40 text-slate-400'
                        }`}
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isPassed ? 'text-emerald-600' : 'text-slate-300'
                          }`}
                        />
                        <span className="truncate">{step}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execution Logs Stream */}
              <div className="rounded-xl border border-sky-100 bg-slate-900 text-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" /> Pipeline Execution Event Log
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Stream Ready</span>
                </div>

                <div className="font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto pr-1">
                  {selectedBatch.logs && selectedBatch.logs.length > 0 ? (
                    selectedBatch.logs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 text-slate-300">
                        <span className="text-cyan-400 select-none">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500">No raw logs recorded.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-3 border-t border-sky-100 flex flex-wrap items-center justify-between gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedBatch(null);
                  navigate(`/admin/companies/${selectedBatch.companyId}`);
                }}
              >
                <Building2 className="h-3.5 w-3.5" /> View Company Dossier
              </Button>

              <div className="flex items-center gap-2">
                {selectedBatch.status === 'Failed' && (
                  <Button
                    size="sm"
                    className="bg-rose-600 hover:bg-rose-700"
                    onClick={(e) => handleRetry(e, selectedBatch.id)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Retry Run
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedBatch(null)}
                >
                  Close Dossier
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
