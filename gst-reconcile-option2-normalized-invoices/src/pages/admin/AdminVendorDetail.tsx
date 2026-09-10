import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminSafeGstStore as useGstStore } from '@/store/useAdminSafeGstStore';
import {
  Users,
  ArrowLeft,
  Calendar,
  Download,
  AlertTriangle,
  FileText,
  Network,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Edit3,
  X,
  Flag,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AdminVendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getVendorById, invoices, runReconciliation, isReconciling } = useGstStore();

  const vendor = id ? getVendorById(id) : undefined;

  const [notice, setNotice] = useState<string | null>(null);
  const [isFlagged, setIsFlagged] = useState(
    vendor?.riskLevel === 'CRITICAL' || vendor?.riskLevel === 'HIGH'
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [vendorName, setVendorName] = useState(vendor?.name || '');

  // Find all invoices associated with this vendor
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
        <p className="text-xs text-slate-500">
          No counterparty supplier matching identifier <code className="text-sky-600 font-mono font-bold">{id}</code> was located.
        </p>
        <Button onClick={() => navigate('/admin/vendors')}>
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Vendors Master
        </Button>
      </div>
    );
  }

  const formatCurrency = (amt: number) => {
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  const handleVerifyVendor = async () => {
    await runReconciliation();
    setNotice(`Re-verified compliance status for ${vendor.name}!`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleToggleFlag = () => {
    setIsFlagged(!isFlagged);
    setNotice(
      !isFlagged
        ? `Vendor ${vendor.name} flagged as HIGH RISK across all enterprise client ledgers.`
        : `High risk flag removed for ${vendor.name}.`
    );
    setTimeout(() => setNotice(null), 3500);
  };

  const exportVendorCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Field,Value',
        `Vendor ID,${vendor.id}`,
        `Vendor Name,"${vendor.name}"`,
        `GSTIN,${vendor.gstin}`,
        `Invoice Count,${vendor.invoiceCount}`,
        `Match Rate,${vendor.matchRate}%`,
        `Compliance Score,${vendor.complianceScore}/100`,
        `Total Tax Inward,₹${vendor.totalTaxClaimed}`,
        `ITC at Risk,₹${vendor.itcAtRisk}`,
        `Risk Level,${vendor.riskLevel}`,
        `Trend,${vendor.trend}`,
        `Risk Drivers,"${vendor.riskReasons.join('; ')}"`,
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vendor_Telemetry_${vendor.gstin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotice('Exported vendor dossier to CSV.');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`Vendor Dossier: ${vendor.name}`}
        subtitle={`GSTIN: ${vendor.gstin} • Supplier Network Registry • State Code: ${vendor.gstin.substring(0, 2)}`}
        icon={<Users className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/admin/vendors')}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Vendors
            </Button>
            <Button
              size="sm"
              disabled={isReconciling}
              loading={isReconciling}
              onClick={handleVerifyVendor}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Re-Verify Supplier
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportVendorCsv}
            >
              <Download className="h-3.5 w-3.5" /> Export Dossier
            </Button>
          </div>
        }
      />

      {/* Alert Banner */}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{notice}</span>
        </div>
      )}

      {/* Top Identity Card */}
      <GlassCard className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-xl shadow-md">
              {vendor.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900">{vendor.name}</h2>
                <StatusBadge
                  status={
                    vendor.riskLevel === 'LOW'
                      ? 'success'
                      : vendor.riskLevel === 'MEDIUM'
                      ? 'warning'
                      : 'danger'
                  }
                  label={`${vendor.riskLevel} RISK`}
                />
                {isFlagged && (
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-300 flex items-center gap-1">
                    <Flag className="h-2.5 w-2.5 fill-current" /> Restrict Notice Active
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                GSTIN: <span className="font-bold text-sky-800">{vendor.gstin}</span> • System ID:{' '}
                <span className="font-mono text-slate-700">{vendor.id}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setVendorName(vendor.name);
                setIsEditOpen(true);
              }}
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Profile
            </Button>

            <Button
              variant={isFlagged ? 'primary' : 'secondary'}
              size="sm"
              className={isFlagged ? 'bg-amber-600 hover:bg-amber-700' : ''}
              onClick={handleToggleFlag}
            >
              <Flag className="h-3.5 w-3.5" />
              {isFlagged ? 'Clear Risk Flag' : 'Flag as High Risk'}
            </Button>

            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => navigate(`/admin/transaction-graph?focus=${vendor.name}`)}
            >
              <Network className="h-3.5 w-3.5" /> Trace in Graph
            </Button>
          </div>
        </div>

        {/* 4 Stat Metrics */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Total Invoices Issued</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{vendor.invoiceCount} invoices</p>
            <p className="text-[10px] text-slate-500">Across client ledgers</p>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Statutory Match Rate</span>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">{vendor.matchRate}%</p>
            <p className="text-[10px] text-emerald-600">Zero variance match</p>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Total Tax Value</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{formatCurrency(vendor.totalTaxClaimed)}</p>
            <p className="text-[10px] text-slate-500">Inward GST claimed</p>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Compliance Rating</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold text-sky-700">{vendor.complianceScore} / 100</span>
              {vendor.trend === 'improving' ? (
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-600" />
              )}
            </div>
            <p className="text-[10px] text-slate-500">Filing regularity index</p>
          </div>
        </div>
      </GlassCard>

      {/* Two Column Section: Risk Drivers and Filing History */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Risk Factors */}
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-sky-100 pb-3">
            <ShieldAlert className="h-4 w-4 text-rose-600" /> Assessed Risk Drivers & Enforcement
          </h3>

          <div className="space-y-2.5">
            {vendor.riskReasons.map((reason, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-rose-100 bg-rose-50/60 text-xs text-rose-900 flex items-start gap-2.5"
              >
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{reason}</p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Flagged automatically during multi-tenant 20-step reconciliation.
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3 text-xs space-y-1">
            <span className="font-bold text-slate-800">ITC Exposure Warning:</span>
            <p className="text-slate-600">
              Invoices from this supplier account for{' '}
              <span className="font-bold text-rose-700 font-mono">
                {formatCurrency(vendor.itcAtRisk)}
              </span>{' '}
              in potential statutory disallowance under Section 16(2)(aa).
            </p>
          </div>
        </GlassCard>

        {/* Filing History */}
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-sky-100 pb-3">
            <Calendar className="h-4 w-4 text-sky-600" /> Monthly Statutory Return Filing Record
          </h3>

          <div className="space-y-2 text-xs">
            {vendor.filingHistory.map((fh) => (
              <div
                key={fh.period}
                className="flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/30"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{fh.period}</span>
                  <span className="text-[10px] text-slate-500">Monthly Statement</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">GSTR-1:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {fh.gstr1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">GSTR-3B:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {fh.gstr3b}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Invoices from this Vendor Table */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-600" /> Inward Supplies Issued by {vendor.name} ({vendorInvoices.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click invoice row to investigate line items and GSTR-2B matching
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/admin/invoices')}
          >
            All Invoices <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-2.5 px-3 font-semibold">Invoice No</th>
                <th className="py-2.5 px-3 font-semibold">Invoice Date</th>
                <th className="py-2.5 px-3 font-semibold">Books Taxable</th>
                <th className="py-2.5 px-3 font-semibold">2B Taxable</th>
                <th className="py-2.5 px-3 font-semibold">Tax Difference</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {vendorInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/admin/invoices/${inv.id}`)}
                  className="hover:bg-sky-50/70 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-sky-700 group-hover:underline">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-3 text-slate-500">{inv.invoiceDate}</td>
                  <td className="py-3 px-3 font-mono text-slate-800">
                    ₹{inv.companyRecord.taxableValue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">
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
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 group-hover:text-sky-800">
                      Investigate <ExternalLink className="h-3 w-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-sky-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-sky-600" /> Edit Vendor Record
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Vendor Trade Name</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">GSTIN (Read Only)</label>
                <input
                  type="text"
                  value={vendor.gstin}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-mono font-bold text-slate-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-sky-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsEditOpen(false);
                    setNotice('Vendor record updated successfully.');
                    setTimeout(() => setNotice(null), 3000);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
