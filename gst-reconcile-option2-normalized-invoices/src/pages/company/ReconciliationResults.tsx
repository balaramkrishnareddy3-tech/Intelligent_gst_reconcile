import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGstStore } from '@/store/gstStore';
import type { ReconciliationStatus } from '@/types/gst';
import {
  GitCompare,
  Search,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileQuestion,
  Copy,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function ReconciliationResults() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') as ReconciliationStatus | null;

  const { invoices, getStats } = useGstStore();
  const stats = getStats();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus || 'ALL');
  const [sortBy, setSortBy] = useState<'diff' | 'date' | 'amount'>('diff');

  // Filter invoices based on status & search
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Status filter
        if (selectedStatus !== 'ALL' && inv.status !== selectedStatus) {
          return false;
        }
        // Search filter
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchNo = inv.invoiceNumber.toLowerCase().includes(q);
          const matchVendor = inv.vendorName.toLowerCase().includes(q);
          const matchGstin = inv.vendorGstin.toLowerCase().includes(q);
          return matchNo || matchVendor || matchGstin;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'diff') return b.taxDifference - a.taxDifference;
        if (sortBy === 'amount') return b.companyRecord.totalValue - a.companyRecord.totalValue;
        return b.invoiceDate.localeCompare(a.invoiceDate);
      });
  }, [invoices, selectedStatus, searchQuery, sortBy]);

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    if (status === 'ALL') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  const exportToCsv = () => {
    const headers = [
      'Invoice No',
      'Invoice Date',
      'Vendor Name',
      'Vendor GSTIN',
      'Status',
      'Books Taxable',
      'Books Total GST',
      'GSTR-2B Taxable',
      'GSTR-2B Total GST',
      'Tax Variance',
      'Risk Level',
      'ITC at Risk',
      'Recommended Action',
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.invoiceDate,
      `"${inv.vendorName}"`,
      inv.vendorGstin,
      inv.status,
      inv.companyRecord.taxableValue,
      inv.companyRecord.totalGst,
      inv.gstRecord ? inv.gstRecord.taxableValue : 0,
      inv.gstRecord ? inv.gstRecord.totalGst : 0,
      inv.taxDifference,
      inv.riskLevel,
      inv.itcRiskAmount,
      `"${inv.recommendedAction}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GST_Reconciliation_Matrix_${selectedStatus}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reconciliation Results & Mismatches"
        subtitle={`Verified comparison matrix • Showing ${filteredInvoices.length} of ${invoices.length} records`}
        icon={<GitCompare className="h-6 w-6 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/company/reconciliation')}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Re-run Engine
            </Button>
            <Button size="sm" onClick={exportToCsv}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        }
      />

      {/* Filter Tabs / Quick Counts */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <button
          onClick={() => handleStatusFilter('ALL')}
          className={`rounded-xl p-3 border text-left transition-all ${
            selectedStatus === 'ALL'
              ? 'border-sky-500 bg-white ring-2 ring-sky-500/20 shadow-sm'
              : 'border-sky-200/60 bg-white/70 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">All Records</span>
            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
              {stats.totalInvoices}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total imported</p>
        </button>

        <button
          onClick={() => handleStatusFilter('MATCHED')}
          className={`rounded-xl p-3 border text-left transition-all ${
            selectedStatus === 'MATCHED'
              ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-sm'
              : 'border-emerald-200/60 bg-white/70 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Matched
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {stats.matchedCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Zero variance</p>
        </button>

        <button
          onClick={() => handleStatusFilter('MISMATCHED')}
          className={`rounded-xl p-3 border text-left transition-all ${
            selectedStatus === 'MISMATCHED'
              ? 'border-amber-500 bg-white ring-2 ring-amber-500/20 shadow-sm'
              : 'border-amber-200/60 bg-white/70 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Mismatches
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              {stats.mismatchCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Value diffs</p>
        </button>

        <button
          onClick={() => handleStatusFilter('MISSING')}
          className={`rounded-xl p-3 border text-left transition-all ${
            selectedStatus === 'MISSING'
              ? 'border-rose-500 bg-white ring-2 ring-rose-500/20 shadow-sm'
              : 'border-rose-200/60 bg-white/70 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
              <FileQuestion className="h-3.5 w-3.5 text-rose-600" /> Missing
            </span>
            <span className="text-xs font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              {stats.missingCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Absent in 2B</p>
        </button>

        <button
          onClick={() => handleStatusFilter('DUPLICATE')}
          className={`rounded-xl p-3 border text-left transition-all ${
            selectedStatus === 'DUPLICATE'
              ? 'border-purple-500 bg-white ring-2 ring-purple-500/20 shadow-sm'
              : 'border-purple-200/60 bg-white/70 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 flex items-center gap-1">
              <Copy className="h-3.5 w-3.5 text-purple-600" /> Duplicate
            </span>
            <span className="text-xs font-bold text-purple-800 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
              {stats.duplicateCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Multi entries</p>
        </button>

        <button
          onClick={() => handleStatusFilter('HIGH_RISK')}
          className={`rounded-xl p-3 border text-left transition-all ${
            selectedStatus === 'HIGH_RISK'
              ? 'border-red-600 bg-white ring-2 ring-red-600/20 shadow-sm'
              : 'border-red-200/60 bg-white/70 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> High Risk
            </span>
            <span className="text-xs font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              {stats.highRiskCount}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Statutory flag</p>
        </button>
      </div>

      {/* Search & Sort Bar */}
      <GlassCard className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice # (e.g. INV-2025-4822), Vendor Name, or GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none shadow-xs"
            >
              <option value="diff">Highest Tax Variance</option>
              <option value="amount">Invoice Total Value</option>
              <option value="date">Invoice Date</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Main Results Table */}
      <GlassCard className="p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/60 text-slate-600">
                <th className="py-3 px-4 font-bold">Invoice Details</th>
                <th className="py-3 px-4 font-bold">Vendor & GSTIN</th>
                <th className="py-3 px-4 font-bold">Company Books (₹)</th>
                <th className="py-3 px-4 font-bold">GSTR-2B Record (₹)</th>
                <th className="py-3 px-4 font-bold">Difference</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Risk Level</th>
                <th className="py-3 px-4 font-bold text-right">Investigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                    <p className="font-semibold text-sm">No records match the active filters</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try clearing search query or switching status tabs.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/company/invoice/${inv.id}`)}
                    className="hover:bg-sky-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-sky-700 group-hover:underline">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">{inv.invoiceDate}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{inv.vendorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.vendorGstin}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">
                        Taxable: ₹{inv.companyRecord.taxableValue.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        GST: ₹{inv.companyRecord.totalGst.toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {inv.gstRecord ? (
                        <>
                          <div className="text-slate-800 font-medium">
                            Taxable: ₹{inv.gstRecord.taxableValue.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            GST: ₹{inv.gstRecord.totalGst.toLocaleString('en-IN')}
                          </div>
                        </>
                      ) : (
                        <div className="text-rose-600 font-semibold bg-rose-50 px-2 py-1 rounded inline-block text-[11px]">
                          Not present in 2B
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {inv.taxDifference > 0 ? (
                        <div className="font-bold text-rose-600">
                          ₹{inv.taxDifference.toLocaleString('en-IN')}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Taxable diff: ₹{inv.taxableDifference.toLocaleString('en-IN')}
                          </div>
                        </div>
                      ) : (
                        <span className="font-semibold text-emerald-600">₹0 (Matched)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
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

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          inv.riskLevel === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : inv.riskLevel === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : inv.riskLevel === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {inv.riskLevel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:text-sky-700">
                        View Details <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
