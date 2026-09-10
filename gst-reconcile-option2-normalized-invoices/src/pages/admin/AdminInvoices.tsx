import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminSafeGstStore as useGstStore } from '@/store/useAdminSafeGstStore';
import type { InvoiceItem } from '@/types/gst';
import {
  FileText,
  Search,
  Download,
  Filter,
  ArrowRight,
  ExternalLink,
  Eye,
  X,
  Network,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AdminInvoices() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const { invoices, companies } = useGstStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [inspectInvoice, setInspectInvoice] = useState<InvoiceItem | null>(null);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      // Status filter
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNo = inv.invoiceNumber.toLowerCase().includes(q);
        const matchVendor = inv.vendorName.toLowerCase().includes(q);
        const matchGstin = inv.vendorGstin.toLowerCase().includes(q);
        if (!matchNo && !matchVendor && !matchGstin) return false;
      }
      return true;
    });
  }, [invoices, statusFilter, search]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    if (status === 'ALL') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  const exportAllInvoices = () => {
    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Vendor Name',
      'Vendor GSTIN',
      'Status',
      'Books Taxable (₹)',
      'Books Total GST (₹)',
      'GSTR-2B Taxable (₹)',
      'GSTR-2B Total GST (₹)',
      'Tax Variance (₹)',
      'Risk Level',
      'ITC at Risk (₹)',
      'Recommended Action',
    ];

    const rows = filtered.map((inv) => [
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
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Global_Invoices_Registry_${statusFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Global Invoices & Inward Supplies Registry"
        subtitle={`System-wide repository of inward supplies across all client enterprises • Showing ${filtered.length} of ${invoices.length} invoices`}
        icon={<FileText className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={exportAllInvoices}
            >
              <Download className="h-3.5 w-3.5" /> Export Invoices CSV
            </Button>
          </div>
        }
      />

      {/* Filter and Search Ribbon */}
      <GlassCard className="p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Invoice # (e.g. INV-2025-4822), Vendor Name, or GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Company Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
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
          <div className="flex items-center gap-1.5 flex-wrap">
            {['ALL', 'MATCHED', 'MISMATCHED', 'MISSING', 'DUPLICATE', 'HIGH_RISK'].map((st) => (
              <button
                key={st}
                onClick={() => handleStatusFilterChange(st)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-sky-50 border border-sky-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Main Table */}
      <GlassCard className="p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-3 px-4 font-bold">Invoice Details</th>
                <th className="py-3 px-4 font-bold">Supplier & GSTIN</th>
                <th className="py-3 px-4 font-bold">Books Taxable (₹)</th>
                <th className="py-3 px-4 font-bold">GSTR-2B Taxable (₹)</th>
                <th className="py-3 px-4 font-bold">Tax Variance (₹)</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Risk Level</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="font-semibold text-sm text-slate-700">No invoices matched the criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or search query.</p>
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
                      <div className="text-[11px] text-slate-400">{inv.invoiceDate}</div>
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
                        <span className="text-emerald-700">₹0</span>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectInvoice(inv);
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer"
                          title="Quick Inspect"
                        >
                          <Eye className="h-3.5 w-3.5" />
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

      {/* Quick Inspection Slide-over Modal */}
      {inspectInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-sky-50 text-sky-700 font-mono font-bold text-xs">
                  {inspectInvoice.invoiceNumber}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{inspectInvoice.vendorName}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">{inspectInvoice.vendorGstin}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectInvoice(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-sky-100 bg-sky-50/40 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Purchase Ledger</span>
                <p className="font-bold text-slate-900 text-sm">
                  ₹{inspectInvoice.companyRecord.taxableValue.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-600">
                  GST: ₹{inspectInvoice.companyRecord.totalGst.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-sky-100 bg-sky-50/40 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">GSTR-2B Statement</span>
                {inspectInvoice.gstRecord ? (
                  <>
                    <p className="font-bold text-slate-900 text-sm">
                      ₹{inspectInvoice.gstRecord.taxableValue.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      GST: ₹{inspectInvoice.gstRecord.totalGst.toLocaleString('en-IN')}
                    </p>
                  </>
                ) : (
                  <p className="font-bold text-rose-600 text-sm mt-1">Omitted in GSTR-1</p>
                )}
              </div>
            </div>

            {inspectInvoice.mismatchExplanation && (
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-900 space-y-1">
                <span className="font-bold block">Statutory Analysis:</span>
                <p className="leading-relaxed">{inspectInvoice.mismatchExplanation}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-sky-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInspectInvoice(null)}
              >
                Close
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  const id = inspectInvoice.id;
                  setInspectInvoice(null);
                  navigate(`/admin/invoices/${id}`);
                }}
              >
                Full Line-Item Investigation <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
