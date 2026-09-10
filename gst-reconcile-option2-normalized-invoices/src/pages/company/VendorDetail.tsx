import { useParams, useNavigate } from 'react-router-dom';
import { useGstStore } from '@/store/gstStore';
import {
  Users,
  ArrowLeft,
  Building,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Calendar,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getVendorById, invoices } = useGstStore();

  const vendor = id ? getVendorById(id) : undefined;

  // Filter invoices for this vendor
  const vendorInvoices = invoices.filter(
    (inv) =>
      inv.vendorId === id ||
      inv.vendorGstin === vendor?.gstin ||
      inv.vendorName.toLowerCase().includes((id || '').toLowerCase())
  );

  if (!vendor) {
    return (
      <div className="py-16 text-center space-y-4">
        <Users className="mx-auto h-12 w-12 text-slate-400" />
        <h2 className="text-xl font-bold text-slate-900">Vendor Profile Not Found</h2>
        <p className="text-sm text-slate-500">
          No counterparty record matching <code className="text-sky-600 font-mono">{id}</code> was
          found.
        </p>
        <Button onClick={() => navigate('/company/vendor-risk')}>Back to Vendor Risk</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Vendor Profile: ${vendor.name}`}
        subtitle={`GSTIN: ${vendor.gstin} • Complete counterparty compliance history & invoice record`}
        icon={<Building className="h-6 w-6 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/company/vendor-risk')}>
              <ArrowLeft className="h-3.5 w-3.5" /> All Vendors
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/company/transaction-graph?focus=${vendor.name}`)}
            >
              Trace in Graph
            </Button>
          </div>
        }
      />

      {/* Top Profile Card */}
      <GlassCard className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl shadow-md">
              {vendor.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{vendor.name}</h2>
              <p className="text-xs font-mono text-slate-500">
                GSTIN: <span className="font-bold text-sky-700">{vendor.gstin}</span> • State Code: {vendor.gstin.substring(0, 2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Compliance Score
              </span>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-2xl font-black text-slate-900">{vendor.complianceScore}</span>
                <span className="text-xs text-slate-400">/ 100</span>
                {vendor.trend === 'improving' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                ) : vendor.trend === 'deteriorating' ? (
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                ) : null}
              </div>
            </div>
            <StatusBadge
              status={
                vendor.riskLevel === 'LOW'
                  ? 'success'
                  : vendor.riskLevel === 'MEDIUM'
                  ? 'warning'
                  : 'danger'
              }
              label={`${vendor.riskLevel} Risk`}
            />
          </div>
        </div>

        {/* 4 Metrics Strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold">Total Invoices</span>
            <p className="text-base font-bold text-slate-900 mt-0.5">{vendor.invoiceCount}</p>
          </div>
          <div>
            <span className="text-slate-400 font-semibold">Statutory Match Rate</span>
            <p className="text-base font-bold text-emerald-700 mt-0.5">{vendor.matchRate}%</p>
          </div>
          <div>
            <span className="text-slate-400 font-semibold">Discrepancy Count</span>
            <p className="text-base font-bold text-amber-600 mt-0.5">
              {vendor.mismatchCount + vendor.missingCount}
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-semibold">ITC at Risk Exposure</span>
            <p className="text-base font-bold text-rose-600 mt-0.5">
              ₹{vendor.itcAtRisk.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Risk Drivers & Filing History */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk Drivers */}
        <GlassCard className="space-y-3.5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-600" /> Assessed Risk Drivers & Factors
          </h3>

          <div className="space-y-2">
            {vendor.riskReasons.map((reason, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 text-xs text-rose-900 flex items-start gap-2.5"
              >
                <span className="h-2 w-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span className="font-semibold">{reason}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 pt-2">
            Dynamic assessment computed by cross-referencing invoice value discrepancies, filing
            regularity, and GSTIN registration status.
          </p>
        </GlassCard>

        {/* Filing History */}
        <GlassCard className="space-y-3.5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-600" /> Monthly Return Filing History
          </h3>

          <div className="space-y-2 text-xs">
            {vendor.filingHistory.map((fh) => (
              <div
                key={fh.period}
                className="flex items-center justify-between p-2.5 rounded-xl border border-sky-100 bg-sky-50/30"
              >
                <span className="font-bold text-slate-800">{fh.period}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400">GSTR-1:</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {fh.gstr1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400">GSTR-3B:</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {fh.gstr3b}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Invoices associated with this vendor */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-600" /> Inward Supplies from {vendor.name} ({vendorInvoices.length})
          </h3>
          <span className="text-xs text-slate-400">Click invoice to investigate</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-2.5 px-3 font-semibold">Invoice No</th>
                <th className="py-2.5 px-3 font-semibold">Date</th>
                <th className="py-2.5 px-3 font-semibold">Books Taxable</th>
                <th className="py-2.5 px-3 font-semibold">2B Taxable</th>
                <th className="py-2.5 px-3 font-semibold">Tax Difference</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {vendorInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/company/invoice/${inv.id}`)}
                  className="hover:bg-sky-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-sky-700 group-hover:underline">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{inv.invoiceDate}</td>
                  <td className="py-3 px-3 text-slate-800 font-mono">
                    ₹{inv.companyRecord.taxableValue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-slate-800 font-mono">
                    {inv.gstRecord ? `₹${inv.gstRecord.taxableValue.toLocaleString('en-IN')}` : 'Missing in 2B'}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-rose-600">
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
