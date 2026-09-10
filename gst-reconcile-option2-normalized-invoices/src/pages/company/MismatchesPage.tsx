import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGstStore } from '@/store/gstStore';
import {
  AlertTriangle,
  Search,
  ShieldAlert,
  FileQuestion,
  Copy,
  ExternalLink,
  Info,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function MismatchesPage() {
  const navigate = useNavigate();
  const { invoices } = useGstStore();

  const [activeTab, setActiveTab] = useState<'ALL_ISSUES' | 'VALUE_MISMATCH' | 'MISSING' | 'DUPLICATE' | 'HIGH_RISK'>('ALL_ISSUES');
  const [search, setSearch] = useState('');

  // Collect all non-MATCHED invoices
  const issues = useMemo(() => {
    return invoices.filter((inv) => inv.status !== 'MATCHED');
  }, [invoices]);

  const filteredIssues = useMemo(() => {
    return issues.filter((inv) => {
      // Tab filter
      if (activeTab === 'VALUE_MISMATCH' && inv.status !== 'MISMATCHED') return false;
      if (activeTab === 'MISSING' && inv.status !== 'MISSING') return false;
      if (activeTab === 'DUPLICATE' && inv.status !== 'DUPLICATE') return false;
      if (activeTab === 'HIGH_RISK' && inv.status !== 'HIGH_RISK') return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.vendorName.toLowerCase().includes(q) ||
          inv.vendorGstin.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [issues, activeTab, search]);

  const valueMismatchCount = issues.filter((i) => i.status === 'MISMATCHED').length;
  const missingCount = issues.filter((i) => i.status === 'MISSING').length;
  const duplicateCount = issues.filter((i) => i.status === 'DUPLICATE').length;
  const highRiskCount = issues.filter((i) => i.status === 'HIGH_RISK').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discrepancies & Mismatch Resolution Center"
        subtitle={`Detected ${issues.length} total discrepancies requiring accounting or counterparty resolution`}
        icon={<AlertTriangle className="h-6 w-6 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/company/itc-risk')}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> View ITC Risk
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/company/reconciliation')}
            >
              Re-run Engine
            </Button>
          </div>
        }
      />

      {/* Info Banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Mismatch Action Policy:</span> Invoices with tax variances
          must either be corrected in books prior to GSTR-3B credit claims or counterparty suppliers
          must be issued automated communication to amend their outward GSTR-1 filings. Click any
          item to initiate invoice investigation.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-sky-100 pb-3">
        <button
          onClick={() => setActiveTab('ALL_ISSUES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ALL_ISSUES'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-sky-50'
          }`}
        >
          All Issues ({issues.length})
        </button>

        <button
          onClick={() => setActiveTab('VALUE_MISMATCH')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'VALUE_MISMATCH'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-amber-50'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" /> Tax/Value Mismatches ({valueMismatchCount})
        </button>

        <button
          onClick={() => setActiveTab('MISSING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'MISSING'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-rose-50'
          }`}
        >
          <FileQuestion className="h-3.5 w-3.5" /> Missing in GSTR-2B ({missingCount})
        </button>

        <button
          onClick={() => setActiveTab('DUPLICATE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'DUPLICATE'
              ? 'bg-purple-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-purple-50'
          }`}
        >
          <Copy className="h-3.5 w-3.5" /> Duplicates ({duplicateCount})
        </button>

        <button
          onClick={() => setActiveTab('HIGH_RISK')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'HIGH_RISK'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-red-50'
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" /> Statutory High Risk ({highRiskCount})
        </button>
      </div>

      {/* Search Input */}
      <GlassCard className="p-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search mismatches by Invoice Number, Vendor Name, or GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none shadow-xs"
          />
        </div>
      </GlassCard>

      {/* List of Mismatches */}
      <div className="grid gap-4">
        {filteredIssues.map((inv) => (
          <GlassCard
            key={inv.id}
            hover
            onClick={() => navigate(`/company/invoice/${inv.id}`)}
            className="p-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Column: Invoice & Vendor Identifiers */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {inv.invoiceNumber}
                  </span>
                  <StatusBadge
                    status={
                      inv.status === 'MISMATCHED'
                        ? 'warning'
                        : inv.status === 'MISSING'
                        ? 'danger'
                        : 'purple'
                    }
                    label={inv.status}
                  />
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      inv.riskLevel === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : inv.riskLevel === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inv.riskLevel} Risk
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900">{inv.vendorName}</div>
                <div className="text-xs text-slate-500 font-mono">
                  GSTIN: {inv.vendorGstin} • Date: {inv.invoiceDate}
                </div>
              </div>

              {/* Middle Column: Field Comparison Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Purchase Ledger
                  </span>
                  <p className="font-bold text-slate-800">
                    ₹{inv.companyRecord.taxableValue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    GST: ₹{inv.companyRecord.totalGst.toLocaleString('en-IN')}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    GSTR-2B Statement
                  </span>
                  {inv.gstRecord ? (
                    <>
                      <p className="font-bold text-slate-800">
                        ₹{inv.gstRecord.taxableValue.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        GST: ₹{inv.gstRecord.totalGst.toLocaleString('en-IN')}
                      </p>
                    </>
                  ) : (
                    <p className="text-rose-600 font-bold">Unfiled by Supplier</p>
                  )}
                </div>

                <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Tax Difference
                  </span>
                  <p className="text-sm font-bold text-rose-600">
                    ₹{inv.taxDifference.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-500">ITC Exposure</p>
                </div>
              </div>

              {/* Right Column: CTA */}
              <div className="flex items-center gap-2 self-end lg:self-center">
                <Button size="sm" variant="secondary" onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/company/invoice/${inv.id}`);
                }}>
                  Investigate <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Explanation Footer */}
            {inv.mismatchExplanation && (
              <div className="mt-3.5 pt-3 border-t border-sky-100 text-xs text-slate-600 flex items-start gap-2">
                <span className="font-semibold text-slate-800 shrink-0">Analysis:</span>
                <span>{inv.mismatchExplanation}</span>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
