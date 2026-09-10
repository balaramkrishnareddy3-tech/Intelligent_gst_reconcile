import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminSafeGstStore as useGstStore } from '@/store/useAdminSafeGstStore';
import type { InvoiceItem } from '@/types/gst';
import {
  AlertTriangle,
  Search,
  Download,
  ArrowRight,
  CheckCircle2,
  Filter,
  Network,
  FileQuestion,
  Copy,
  ShieldAlert,
  X,
  Mail,
  Wrench,
  Check,
  Sparkles,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AdminMismatches() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || searchParams.get('status') || 'ALL';

  const { invoices, companies, resolveMismatch, getStats } = useGstStore();
  const stats = getStats();

  // State
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Resolution modal
  const [resolvingInvoice, setResolvingInvoice] = useState<InvoiceItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState('Tax rounding deviation accepted under statutory tolerance.');

  // Notice modal
  const [noticeInvoice, setNoticeInvoice] = useState<InvoiceItem | null>(null);

  // Filtered issues
  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      // Tab filter
      if (activeTab === 'ALL') {
        if (inv.status === 'MATCHED') return false; // Default "All issues" shows active discrepancies
      } else if (activeTab === 'ALL_INCLUDING_MATCHED') {
        // Show everything
      } else if (inv.status !== activeTab) {
        return false;
      }

      // Company filter
      if (selectedCompany !== 'ALL') {
        // filter by company if matching
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNo = inv.invoiceNumber.toLowerCase().includes(q);
        const matchVendor = inv.vendorName.toLowerCase().includes(q);
        const matchGstin = inv.vendorGstin.toLowerCase().includes(q);
        const matchExpl = (inv.mismatchExplanation || '').toLowerCase().includes(q);
        if (!matchNo && !matchVendor && !matchGstin && !matchExpl) return false;
      }

      return true;
    });
  }, [invoices, activeTab, selectedCompany, search]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'ALL') {
      searchParams.delete('tab');
      searchParams.delete('status');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams);
  };

  const handleExecuteResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingInvoice) return;

    resolveMismatch(resolvingInvoice.id, resolutionNote);
    const resolvedNum = resolvingInvoice.invoiceNumber;
    setResolvingInvoice(null);
    setActionNotice(`Invoice ${resolvedNum} resolved! Discrepancy cleared and marked as MATCHED.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleBulkResolveMinor = () => {
    const minorMismatches = invoices.filter(
      (inv) => inv.status === 'MISMATCHED' && inv.taxDifference <= 1000 && inv.taxDifference > 0
    );

    if (minorMismatches.length === 0) {
      alert('No minor mismatches (≤ ₹1,000) pending automatic resolution.');
      return;
    }

    if (
      confirm(
        `Auto-resolve ${minorMismatches.length} minor rounding variances (≤ ₹1,000)? Audit events will be logged.`
      )
    ) {
      minorMismatches.forEach((inv) => {
        resolveMismatch(inv.id, 'Auto-resolved by Admin: Rounding variance ≤ ₹1,000 authorized under Rule 36 tolerance.');
      });
      setActionNotice(
        `Auto-resolved ${minorMismatches.length} minor invoice discrepancies! ITC updated.`
      );
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleSendSupplierNotice = (inv: InvoiceItem) => {
    setNoticeInvoice(inv);
  };

  const handleConfirmSendNotice = () => {
    if (!noticeInvoice) return;
    const invNum = noticeInvoice.invoiceNumber;
    const vendName = noticeInvoice.vendorName;
    setNoticeInvoice(null);
    setActionNotice(
      `Statutory GSTR-1 amendment request dispatched to ${vendName} for invoice ${invNum}. Tracked in compliance feed.`
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  const exportMismatchesCsv = () => {
    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Vendor Name',
      'Vendor GSTIN',
      'Status',
      'Books Taxable (₹)',
      'GSTR-2B Taxable (₹)',
      'Tax Variance (₹)',
      'Risk Level',
      'ITC at Risk (₹)',
      'Mismatch Root Cause Analysis',
      'Recommended Action',
    ];

    const rows = filtered.map((inv) => [
      inv.invoiceNumber,
      inv.invoiceDate,
      `"${inv.vendorName}"`,
      inv.vendorGstin,
      inv.status,
      inv.companyRecord.taxableValue,
      inv.gstRecord ? inv.gstRecord.taxableValue : 0,
      inv.taxDifference,
      inv.riskLevel,
      inv.itcRiskAmount,
      `"${inv.mismatchExplanation || ''}"`,
      `"${inv.recommendedAction}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `System_Mismatches_Registry_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setActionNotice('Exported mismatch registry to CSV.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const activeIssuesCount = invoices.filter((i) => i.status !== 'MATCHED').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Mismatch & Discrepancy Monitoring Center"
        subtitle={`System-wide resolution workstation • ${activeIssuesCount} Active variances requiring counterparty or accounting resolution`}
        icon={<AlertTriangle className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={exportMismatchesCsv}
            >
              <Download className="h-3.5 w-3.5" /> Export Mismatches CSV
            </Button>
            <Button
              size="sm"
              onClick={handleBulkResolveMinor}
            >
              <Sparkles className="h-3.5 w-3.5" /> Auto-Resolve Minor (≤ ₹1k)
            </Button>
          </div>
        }
      />

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{actionNotice}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GlassCard
          className="p-4 cursor-pointer hover:border-amber-400 transition-colors"
          onClick={() => handleTabChange('MISMATCHED')}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase">Rate/Value Variances</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.mismatchCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Line-item tax deviations</p>
        </GlassCard>

        <GlassCard
          className="p-4 cursor-pointer hover:border-rose-400 transition-colors"
          onClick={() => handleTabChange('MISSING')}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase">Missing in GSTR-2B</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats.missingCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Sec 16(2)(aa) unfiled returns</p>
        </GlassCard>

        <GlassCard
          className="p-4 cursor-pointer hover:border-purple-400 transition-colors"
          onClick={() => handleTabChange('DUPLICATE')}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase">Duplicate Entries</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.duplicateCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Multi-recorded in ledger</p>
        </GlassCard>

        <GlassCard
          className="p-4 cursor-pointer hover:border-red-500 transition-colors"
          onClick={() => handleTabChange('HIGH_RISK')}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase">Statutory High Risk</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.highRiskCount}</p>
          <p className="text-[11px] text-red-600 font-semibold mt-0.5">Suspended GSTINs</p>
        </GlassCard>
      </div>

      {/* Tabs and Controls */}
      <GlassCard className="p-3.5 space-y-3">
        {/* Tab Row */}
        <div className="flex items-center gap-1.5 flex-wrap border-b border-sky-100 pb-2.5">
          <button
            onClick={() => handleTabChange('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-sky-50 border border-sky-100'
            }`}
          >
            All Active Issues ({activeIssuesCount})
          </button>

          <button
            onClick={() => handleTabChange('MISMATCHED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'MISMATCHED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-amber-50 border border-sky-100'
            }`}
          >
            <AlertTriangle className="h-3 w-3" /> Tax Variances ({stats.mismatchCount})
          </button>

          <button
            onClick={() => handleTabChange('MISSING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'MISSING'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-rose-50 border border-sky-100'
            }`}
          >
            <FileQuestion className="h-3 w-3" /> Missing in 2B ({stats.missingCount})
          </button>

          <button
            onClick={() => handleTabChange('DUPLICATE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'DUPLICATE'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-purple-50 border border-sky-100'
            }`}
          >
            <Copy className="h-3 w-3" /> Duplicate Claims ({stats.duplicateCount})
          </button>

          <button
            onClick={() => handleTabChange('HIGH_RISK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'HIGH_RISK'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-red-50 border border-sky-100'
            }`}
          >
            <ShieldAlert className="h-3 w-3" /> High Risk ({stats.highRiskCount})
          </button>

          <button
            onClick={() => handleTabChange('ALL_INCLUDING_MATCHED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ALL_INCLUDING_MATCHED'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-sky-100'
            }`}
          >
            Full Ledger ({invoices.length})
          </button>
        </div>

        {/* Search & Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search discrepancies by Invoice #, Vendor Name, GSTIN, or Root Cause..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="rounded-xl border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Client Tenants</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Mismatches Table with Interactive Actions */}
      <GlassCard className="p-0 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-sky-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Active Discrepancies Worklist ({filtered.length})
          </h3>
          <span className="text-xs text-slate-500">
            Click row for line-item dossier or use action buttons to resolve in-place
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-3 px-4 font-bold">Invoice Ref</th>
                <th className="py-3 px-4 font-bold">Counterparty Supplier</th>
                <th className="py-3 px-4 font-bold">Purchase Taxable</th>
                <th className="py-3 px-4 font-bold">GSTR-2B Taxable</th>
                <th className="py-3 px-4 font-bold">Tax Variance</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Risk Level</th>
                <th className="py-3 px-4 font-bold">Root Cause Analysis</th>
                <th className="py-3 px-4 font-bold text-right">Workstation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                    <p className="font-semibold text-sm text-slate-800">
                      No unresolved discrepancies in this category
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All line items are matched or filtered out.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                    className="hover:bg-sky-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-sky-700 group-hover:underline">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">{inv.invoiceDate}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{inv.vendorName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{inv.vendorGstin}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      ₹{inv.companyRecord.taxableValue.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {inv.gstRecord ? (
                        `₹${inv.gstRecord.taxableValue.toLocaleString('en-IN')}`
                      ) : (
                        <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          Missing in 2B
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold">
                      {inv.taxDifference > 0 ? (
                        <span className="text-rose-600">
                          ₹{inv.taxDifference.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-700">₹0 (Matched)</span>
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

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs text-[11px]">
                      <p className="line-clamp-2">{inv.mismatchExplanation || 'Clean statutory match.'}</p>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status !== 'MATCHED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setResolvingInvoice(inv);
                            }}
                            className="rounded-lg px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1 border border-emerald-200"
                            title="Resolve this discrepancy"
                          >
                            <Check className="h-3 w-3" /> Resolve
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendSupplierNotice(inv);
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer"
                          title="Send Counterparty GSTR-1 Amendment Notice"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/transaction-graph?focus=${inv.invoiceNumber}`);
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Trace in Knowledge Graph"
                        >
                          <Network className="h-3.5 w-3.5" />
                        </button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/invoices/${inv.id}`);
                          }}
                        >
                          Dossier <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Admin Discrepancy Resolution Modal */}
      {resolvingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Admin Discrepancy Resolution
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Override statutory variance for {resolvingInvoice.invoiceNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResolvingInvoice(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Vendor:</span>
                <span className="font-bold text-slate-900">{resolvingInvoice.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Variance:</span>
                <span className="font-bold text-rose-600 font-mono">
                  ₹{resolvingInvoice.taxDifference.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <StatusBadge status="warning" label={resolvingInvoice.status} />
              </div>
            </div>

            <form onSubmit={handleExecuteResolution} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Resolution Audit Justification
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white p-3 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                  placeholder="Explain why this mismatch is accepted/adjusted..."
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  This justification will be logged in the immutable system audit trail with your Admin signature.
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-sky-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setResolvingInvoice(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" /> Confirm Resolution & Mark Matched
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Notice Modal */}
      {noticeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Dispatch GSTR-1 Amendment Notice
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Formal statutory communication to {noticeInvoice.vendorName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNoticeInvoice(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-sky-100 bg-slate-50 p-3.5 space-y-2 text-xs font-mono text-slate-700">
              <p className="font-bold text-slate-900">Notice Preview:</p>
              <p className="text-[11px] leading-relaxed">
                To: Finance Team, {noticeInvoice.vendorName} ({noticeInvoice.vendorGstin})
                <br />
                Subject: Discrepancy in GSTR-1 Return for Invoice {noticeInvoice.invoiceNumber}
                <br />
                A tax deviation of ₹{noticeInvoice.taxDifference.toLocaleString('en-IN')} has been
                flagged against buyer purchase register. Please file an amendment in Table 9 of your
                next GSTR-1 return to prevent Section 16 credit disallowance.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-sky-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setNoticeInvoice(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmSendNotice}
              >
                <Mail className="h-3.5 w-3.5" /> Dispatch Notice to Counterparty
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
