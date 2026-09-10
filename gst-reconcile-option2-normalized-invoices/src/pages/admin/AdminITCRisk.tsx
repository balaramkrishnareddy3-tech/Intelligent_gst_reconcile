import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminSafeGstStore as useGstStore } from '@/store/useAdminSafeGstStore';
import type { InvoiceItem, RiskLevel } from '@/types/gst';
import {
  ShieldAlert,
  Download,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Network,
  X,
  ShieldCheck,
  Wrench,
  Check,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AdminITCRisk() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRisk = searchParams.get('risk') || searchParams.get('filter') || 'ALL_RISKY';

  const { invoices, companies, updateInvoiceRisk, getStats } = useGstStore();
  const stats = getStats();

  const [activeRiskFilter, setActiveRiskFilter] = useState<string>(initialRisk);
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(searchParams.get('cat') || null);
  const [notice, setNotice] = useState<string | null>(null);

  // Reassess risk modal
  const [editingRiskInvoice, setEditingRiskInvoice] = useState<InvoiceItem | null>(null);
  const [targetRiskLevel, setTargetRiskLevel] = useState<RiskLevel>('MEDIUM');
  const [reassessNote, setReassessNote] = useState('');

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  // Filtered invoices
  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      // Risk filter
      if (activeRiskFilter === 'ALL_RISKY') {
        if (inv.itcRiskAmount === 0 && inv.status === 'MATCHED') return false;
      } else if (activeRiskFilter === 'CRITICAL' && inv.riskLevel !== 'CRITICAL') {
        return false;
      } else if (activeRiskFilter === 'HIGH' && inv.riskLevel !== 'HIGH') {
        return false;
      } else if (activeRiskFilter === 'MEDIUM' && inv.riskLevel !== 'MEDIUM') {
        return false;
      } else if (activeRiskFilter === 'LOW' && inv.riskLevel !== 'LOW') {
        return false;
      }

      // Category filter
      if (categoryFilter === 'OMISSION' && inv.status !== 'MISSING') return false;
      if (categoryFilter === 'SUSPENDED' && inv.status !== 'HIGH_RISK') return false;
      if (categoryFilter === 'RATE' && inv.status !== 'MISMATCHED') return false;
      if (categoryFilter === 'DUPLICATE' && inv.status !== 'DUPLICATE') return false;

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
  }, [invoices, activeRiskFilter, categoryFilter, search]);

  const handleRiskTabChange = (riskTab: string) => {
    setActiveRiskFilter(riskTab);
    setCategoryFilter(null);
    if (riskTab === 'ALL_RISKY') {
      searchParams.delete('risk');
      searchParams.delete('filter');
    } else {
      searchParams.set('risk', riskTab);
    }
    searchParams.delete('cat');
    setSearchParams(searchParams);
  };

  const handleCategoryClick = (cat: string) => {
    if (categoryFilter === cat) {
      setCategoryFilter(null);
      searchParams.delete('cat');
    } else {
      setCategoryFilter(cat);
      searchParams.set('cat', cat);
    }
    setSearchParams(searchParams);
  };

  const handleExecuteReassess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRiskInvoice) return;

    updateInvoiceRisk(editingRiskInvoice.id, targetRiskLevel, reassessNote);
    const invNum = editingRiskInvoice.invoiceNumber;
    setEditingRiskInvoice(null);
    setNotice(`Reassessed risk level for invoice ${invNum} to ${targetRiskLevel}. Audit event logged.`);
    setTimeout(() => setNotice(null), 3500);
  };

  const exportItcRiskCsv = () => {
    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Vendor Name',
      'Vendor GSTIN',
      'Status',
      'Claimed Tax (₹)',
      'ITC at Risk (₹)',
      'Risk Level',
      'Recommended Action',
      'Mismatch Explanation',
    ];

    const rows = filtered.map((inv) => [
      inv.invoiceNumber,
      inv.invoiceDate,
      `"${inv.vendorName}"`,
      inv.vendorGstin,
      inv.status,
      inv.companyRecord.totalGst,
      inv.itcRiskAmount,
      inv.riskLevel,
      `"${inv.recommendedAction}"`,
      `"${inv.mismatchExplanation || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `System_ITC_Risk_Audit_${activeRiskFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotice('Exported ITC risk audit sheet to CSV.');
    setTimeout(() => setNotice(null), 3000);
  };

  // Category counts & amounts
  const omissionTotal = invoices
    .filter((i) => i.status === 'MISSING')
    .reduce((s, i) => s + i.itcRiskAmount, 0);

  const suspendedTotal = invoices
    .filter((i) => i.status === 'HIGH_RISK')
    .reduce((s, i) => s + i.itcRiskAmount, 0);

  const rateMismatchTotal = invoices
    .filter((i) => i.status === 'MISMATCHED')
    .reduce((s, i) => s + i.itcRiskAmount, 0);

  const duplicateTotal = invoices
    .filter((i) => i.status === 'DUPLICATE')
    .reduce((s, i) => s + i.itcRiskAmount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Global ITC Risk & Statutory Exposure Monitoring"
        subtitle={`Surveillance of restricted & disallowed Input Tax Credit claims under Section 16(2)(aa) & Rule 36(4) • Showing ${filtered.length} Invoices`}
        icon={<ShieldAlert className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={exportItcRiskCsv}
            >
              <Download className="h-3.5 w-3.5" /> Export ITC Risk Log
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/admin/transaction-graph')}
            >
              <Network className="h-3.5 w-3.5" /> Trace Risk Topology
            </Button>
          </div>
        }
      />

      {/* Action Notification Banner */}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{notice}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Gross System ITC Base</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(stats.totalItc)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Total across all tenants</p>
        </GlassCard>

        <GlassCard
          className="p-4 cursor-pointer hover:border-emerald-400 transition-colors"
          onClick={() => handleRiskTabChange('LOW')}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase">Statutory Safe ITC</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(stats.safeItc)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {stats.healthRate}% claimable
          </p>
        </GlassCard>

        <GlassCard
          className="p-4 cursor-pointer hover:border-amber-400 transition-colors"
          onClick={() => handleRiskTabChange('MEDIUM')}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase">Potentially Risky ITC</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {formatCurrency(
              invoices
                .filter((i) => i.riskLevel === 'MEDIUM')
                .reduce((s, i) => s + i.itcRiskAmount, 0)
            )}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Value & rate deviations</p>
        </GlassCard>

        <GlassCard
          className="p-4 cursor-pointer hover:border-rose-400 transition-colors"
          onClick={() => handleRiskTabChange('CRITICAL')}
        >
          <p className="text-xs font-semibold text-slate-500 uppercase">High / Critical Risk ITC</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {formatCurrency(
              invoices
                .filter((i) => i.riskLevel === 'HIGH' || i.riskLevel === 'CRITICAL')
                .reduce((s, i) => s + i.itcRiskAmount, 0)
            )}
          </p>
          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
            Section 16 statutory disallowance
          </p>
        </GlassCard>
      </div>

      {/* Interactive Statutory Risk Category Tiles */}
      <GlassCard className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2.5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-sky-600" /> Statutory Risk Category Breakdown
            </h3>
            <p className="text-[11px] text-slate-500">
              Click any statutory category tile below to instantly filter high-risk invoices
            </p>
          </div>
          {categoryFilter && (
            <button
              onClick={() => handleCategoryClick(categoryFilter)}
              className="text-xs text-rose-600 hover:underline font-bold"
            >
              Clear Category Filter
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          {/* Tile 1: Omissions */}
          <div
            onClick={() => handleCategoryClick('OMISSION')}
            className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
              categoryFilter === 'OMISSION'
                ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-400/20 shadow-xs'
                : 'border-rose-100 bg-rose-50/40 hover:bg-rose-50/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-700 uppercase">GSTR-2B Omissions</span>
              <StatusBadge status="danger" label="Sec 16(2)(aa)" />
            </div>
            <p className="text-lg font-bold text-rose-900 mt-1">{formatCurrency(omissionTotal)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Unfiled supplier outward supplies</p>
          </div>

          {/* Tile 2: Suspended GSTINs */}
          <div
            onClick={() => handleCategoryClick('SUSPENDED')}
            className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
              categoryFilter === 'SUSPENDED'
                ? 'border-red-500 bg-red-50 ring-2 ring-red-400/20 shadow-xs'
                : 'border-red-100 bg-red-50/40 hover:bg-red-50/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-red-700 uppercase">Suspended GSTINs</span>
              <StatusBadge status="danger" label="Rule 36(4)" />
            </div>
            <p className="text-lg font-bold text-red-900 mt-1">{formatCurrency(suspendedTotal)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Supplier cancelled by tax authority</p>
          </div>

          {/* Tile 3: Tax Rate Deviations */}
          <div
            onClick={() => handleCategoryClick('RATE')}
            className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
              categoryFilter === 'RATE'
                ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400/20 shadow-xs'
                : 'border-amber-100 bg-amber-50/40 hover:bg-amber-50/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Tax Rate Deviations</span>
              <StatusBadge status="warning" label="Tolerance Breach" />
            </div>
            <p className="text-lg font-bold text-amber-900 mt-1">{formatCurrency(rateMismatchTotal)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Rate or value difference delta</p>
          </div>

          {/* Tile 4: Duplicate Entries */}
          <div
            onClick={() => handleCategoryClick('DUPLICATE')}
            className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
              categoryFilter === 'DUPLICATE'
                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-400/20 shadow-xs'
                : 'border-purple-100 bg-purple-50/40 hover:bg-purple-50/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-700 uppercase">Duplicate Entries</span>
              <StatusBadge status="neutral" label="Ledger Hash" />
            </div>
            <p className="text-lg font-bold text-purple-900 mt-1">{formatCurrency(duplicateTotal)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Double-counted purchase journals</p>
          </div>
        </div>
      </GlassCard>

      {/* Filter and Search Ribbon */}
      <GlassCard className="p-3.5 space-y-3">
        {/* Risk Tab Chips */}
        <div className="flex items-center gap-1.5 flex-wrap border-b border-sky-100 pb-2.5">
          <button
            onClick={() => handleRiskTabChange('ALL_RISKY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRiskFilter === 'ALL_RISKY'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-sky-50 border border-sky-100'
            }`}
          >
            All Risky Claims ({invoices.filter((i) => i.itcRiskAmount > 0 || i.status !== 'MATCHED').length})
          </button>

          <button
            onClick={() => handleRiskTabChange('CRITICAL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeRiskFilter === 'CRITICAL'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-red-50 border border-sky-100'
            }`}
          >
            <ShieldAlert className="h-3 w-3" /> Critical Risk ({invoices.filter((i) => i.riskLevel === 'CRITICAL').length})
          </button>

          <button
            onClick={() => handleRiskTabChange('HIGH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeRiskFilter === 'HIGH'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-rose-50 border border-sky-100'
            }`}
          >
            <AlertTriangle className="h-3 w-3" /> High Risk ({invoices.filter((i) => i.riskLevel === 'HIGH').length})
          </button>

          <button
            onClick={() => handleRiskTabChange('MEDIUM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeRiskFilter === 'MEDIUM'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-amber-50 border border-sky-100'
            }`}
          >
            <AlertTriangle className="h-3 w-3" /> Medium Risk ({invoices.filter((i) => i.riskLevel === 'MEDIUM').length})
          </button>

          <button
            onClick={() => handleRiskTabChange('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRiskFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-sky-100'
            }`}
          >
            Entire Ledger ({invoices.length})
          </button>
        </div>

        {/* Search & Company Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ITC risk by Invoice #, Vendor Name, or GSTIN..."
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

      {/* Main Risky Invoices Table */}
      <GlassCard className="p-0 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-sky-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            Statutory ITC Risk Registry ({filtered.length} Invoices)
          </h3>
          <span className="text-xs text-slate-500">
            Click row for full line-item comparison or use action controls to reassess risk
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-3 px-4 font-bold">Invoice Ref</th>
                <th className="py-3 px-4 font-bold">Counterparty Supplier</th>
                <th className="py-3 px-4 font-bold">Claimed Tax (₹)</th>
                <th className="py-3 px-4 font-bold">Disallowed / At Risk</th>
                <th className="py-3 px-4 font-bold">Risk Level</th>
                <th className="py-3 px-4 font-bold">Statutory Enforcement Plan</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                    <p className="font-semibold text-sm text-slate-800">
                      No invoices in this statutory risk category
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All claims meet statutory eligibility standards.
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
                      ₹{inv.companyRecord.totalGst.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold">
                      {inv.itcRiskAmount > 0 ? (
                        <span className="text-rose-600">
                          ₹{inv.itcRiskAmount.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-700">₹0 (Eligible)</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge
                        status={
                          inv.riskLevel === 'CRITICAL'
                            ? 'danger'
                            : inv.riskLevel === 'HIGH'
                            ? 'warning'
                            : inv.riskLevel === 'MEDIUM'
                            ? 'warning'
                            : 'success'
                        }
                        label={`${inv.riskLevel} RISK`}
                      />
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 max-w-sm text-[11px]">
                      {inv.recommendedAction}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRiskInvoice(inv);
                            setTargetRiskLevel(inv.riskLevel);
                            setReassessNote(inv.recommendedAction);
                          }}
                          className="rounded-lg px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-[10px] transition-colors cursor-pointer flex items-center gap-1 border border-amber-200"
                          title="Reassess Risk Level"
                        >
                          <Wrench className="h-3 w-3" /> Reassess
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/transaction-graph?focus=${inv.invoiceNumber}`);
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Trace Risk Path in Knowledge Graph"
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

      {/* Reassess Risk Modal */}
      {editingRiskInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Reassess Statutory Risk Level
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Invoice: {editingRiskInvoice.invoiceNumber} • {editingRiskInvoice.vendorName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRiskInvoice(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Claimed ITC:</span>
                <span className="font-bold text-slate-900 font-mono">
                  ₹{editingRiskInvoice.companyRecord.totalGst.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Risk Amount:</span>
                <span className="font-bold text-rose-600 font-mono">
                  ₹{editingRiskInvoice.itcRiskAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Risk Rating:</span>
                <StatusBadge status="warning" label={editingRiskInvoice.riskLevel} />
              </div>
            </div>

            <form onSubmit={handleExecuteReassess} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Adjusted Statutory Risk Level
                </label>
                <select
                  value={targetRiskLevel}
                  onChange={(e) => setTargetRiskLevel(e.target.value as RiskLevel)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                >
                  <option value="LOW">LOW Risk (Statutory Safe to Claim)</option>
                  <option value="MEDIUM">MEDIUM Risk (Tax/Value Deviation Pending Review)</option>
                  <option value="HIGH">HIGH Risk (Missing Outward Return)</option>
                  <option value="CRITICAL">CRITICAL Risk (Suspended / Cancelled GSTIN)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Enforcement Justification & Audit Memo
                </label>
                <textarea
                  rows={3}
                  value={reassessNote}
                  onChange={(e) => setReassessNote(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white p-3 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                  placeholder="Explain regulatory reason for updating risk level..."
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-sky-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingRiskInvoice(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                >
                  <Check className="h-3.5 w-3.5" /> Save Reassessment & Update System
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
