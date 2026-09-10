import { useParams, useNavigate } from 'react-router-dom';
import { useAdminSafeGstStore as useGstStore } from '@/store/useAdminSafeGstStore';
import {
  FileText,
  ArrowLeft,
  Network,
  Users,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Info,
  Calendar,
  Building,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AdminInvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoiceById, companies } = useGstStore();

  const invoice = id ? getInvoiceById(id) : undefined;

  if (!invoice) {
    return (
      <div className="py-16 text-center space-y-4">
        <FileQuestion className="mx-auto h-12 w-12 text-slate-400" />
        <h2 className="text-xl font-bold text-slate-900">Invoice Record Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested identifier <code className="font-mono text-sky-600 font-bold">{id}</code> could not be
          located in the centralized reconciliation store.
        </p>
        <Button onClick={() => navigate('/admin/invoices')}>
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Invoice Registry
        </Button>
      </div>
    );
  }

  const { companyRecord, gstRecord } = invoice;
  const buyerCompany = companies[0] || {
    id: 'COMP-01',
    name: 'Acme Corp India Pvt Ltd',
    gstin: '27AABCU9603R1ZM',
  };

  // Field by field comparisons
  const fields = [
    {
      label: 'Taxable Value',
      companyVal: companyRecord.taxableValue,
      gstVal: gstRecord?.taxableValue ?? null,
      isMatch: gstRecord ? companyRecord.taxableValue === gstRecord.taxableValue : false,
      diff: gstRecord ? Math.abs(companyRecord.taxableValue - gstRecord.taxableValue) : companyRecord.taxableValue,
    },
    {
      label: 'CGST (Central Tax)',
      companyVal: companyRecord.cgst,
      gstVal: gstRecord?.cgst ?? null,
      isMatch: gstRecord ? companyRecord.cgst === gstRecord.cgst : false,
      diff: gstRecord ? Math.abs(companyRecord.cgst - gstRecord.cgst) : companyRecord.cgst,
    },
    {
      label: 'SGST (State Tax)',
      companyVal: companyRecord.sgst,
      gstVal: gstRecord?.sgst ?? null,
      isMatch: gstRecord ? companyRecord.sgst === gstRecord.sgst : false,
      diff: gstRecord ? Math.abs(companyRecord.sgst - gstRecord.sgst) : companyRecord.sgst,
    },
    {
      label: 'IGST (Integrated Tax)',
      companyVal: companyRecord.igst,
      gstVal: gstRecord?.igst ?? null,
      isMatch: gstRecord ? companyRecord.igst === gstRecord.igst : false,
      diff: gstRecord ? Math.abs(companyRecord.igst - gstRecord.igst) : companyRecord.igst,
    },
    {
      label: 'Total GST Amount',
      companyVal: companyRecord.totalGst,
      gstVal: gstRecord?.totalGst ?? null,
      isMatch: gstRecord ? companyRecord.totalGst === gstRecord.totalGst : false,
      diff: gstRecord ? Math.abs(companyRecord.totalGst - gstRecord.totalGst) : companyRecord.totalGst,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Admin Line-Item Investigation: ${invoice.invoiceNumber}`}
        subtitle={`System-Wide Audit & Field Comparison • Supplier: ${invoice.vendorName} • Buyer: ${buyerCompany.name}`}
        icon={<FileText className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/admin/invoices')}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Invoices
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/admin/transaction-graph?focus=${invoice.invoiceNumber}`)}
            >
              <Network className="h-3.5 w-3.5" /> Trace in Knowledge Graph
            </Button>
          </div>
        }
      />

      {/* Metadata Ribbon */}
      <GlassCard className="p-4 bg-gradient-to-r from-sky-50/70 via-white to-blue-50/70">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Invoice Number</span>
            <p className="font-mono font-bold text-sky-800 text-sm">{invoice.invoiceNumber}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Invoice Date
            </span>
            <p className="font-bold text-slate-800">{invoice.invoiceDate}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Building className="h-3 w-3" /> Counterparty Supplier
            </span>
            <p className="font-bold text-slate-800">{invoice.vendorName}</p>
            <p className="font-mono text-[10px] text-slate-400">{invoice.vendorGstin}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Statutory Status & Risk</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusBadge
                status={
                  invoice.status === 'MATCHED'
                    ? 'success'
                    : invoice.status === 'MISMATCHED'
                    ? 'warning'
                    : invoice.status === 'MISSING'
                    ? 'danger'
                    : 'purple'
                }
                label={invoice.status}
              />
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  invoice.riskLevel === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800'
                    : invoice.riskLevel === 'HIGH'
                    ? 'bg-orange-100 text-orange-800'
                    : invoice.riskLevel === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {invoice.riskLevel}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Side-by-Side: Company Purchase Record vs GSTR-2B Record */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Company Purchase Record */}
        <GlassCard className="space-y-4 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="h-4 w-4 text-sky-600" /> Buyer Purchase Ledger (ERP Books)
            </h3>
            <span className="text-[10px] font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 font-bold">
              {buyerCompany.name}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Taxable Value</span>
              <span className="font-bold text-slate-900 font-mono">
                ₹{companyRecord.taxableValue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">CGST</span>
              <span className="font-semibold text-slate-800 font-mono">
                ₹{companyRecord.cgst.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">SGST</span>
              <span className="font-semibold text-slate-800 font-mono">
                ₹{companyRecord.sgst.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">IGST</span>
              <span className="font-semibold text-slate-800 font-mono">
                ₹{companyRecord.igst.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 bg-sky-50/40 px-2 rounded">
              <span className="font-bold text-slate-700">Total GST Claimed</span>
              <span className="font-bold text-sky-800 font-mono">
                ₹{companyRecord.totalGst.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Gross Invoice Value</span>
              <span className="font-bold text-slate-900 font-mono">
                ₹{companyRecord.totalValue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Internal Books Eligibility</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {companyRecord.itcEligible ? 'Claimed in Accounts' : 'Ineligible'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Right: GSTR-2B Statement Record */}
        <GlassCard
          className={`space-y-4 border-l-4 ${
            gstRecord ? 'border-l-indigo-500' : 'border-l-rose-500'
          }`}
        >
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" /> GST Portal Inward Statement (GSTR-2B)
            </h3>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                gstRecord
                  ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200'
              }`}
            >
              {gstRecord ? 'Portal Statement' : 'Missing in Portal'}
            </span>
          </div>

          {gstRecord ? (
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Taxable Value</span>
                <span className="font-bold text-slate-900 font-mono">
                  ₹{gstRecord.taxableValue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">CGST</span>
                <span className="font-semibold text-slate-800 font-mono">
                  ₹{gstRecord.cgst.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">SGST</span>
                <span className="font-semibold text-slate-800 font-mono">
                  ₹{gstRecord.sgst.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">IGST</span>
                <span className="font-semibold text-slate-800 font-mono">
                  ₹{gstRecord.igst.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 bg-indigo-50/40 px-2 rounded">
                <span className="font-bold text-slate-700">Total GST Reported</span>
                <span className="font-bold text-indigo-800 font-mono">
                  ₹{gstRecord.totalGst.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Filing Period & Date</span>
                <span className="font-semibold text-slate-800">
                  {gstRecord.returnPeriod} ({gstRecord.filingDate})
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Portal ITC Status</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded border ${
                    gstRecord.itcAvailable
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200'
                  }`}
                >
                  {gstRecord.itcAvailable ? 'ITC Available' : 'ITC Disallowed by Law'}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <FileQuestion className="mx-auto h-10 w-10 text-rose-500" />
              <p className="text-sm font-bold text-rose-800">
                Counterparty GSTR-1 Omission
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                This invoice was not uploaded or finalized by the vendor in their GSTR-1 return for
                the period. Consequently, no credit is auto-populated in GSTR-2B.
              </p>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Field-by-Field Detailed Comparison Table */}
      <GlassCard className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-sky-100 pb-3">
          <CheckCircle2 className="h-4 w-4 text-sky-600" /> Field-by-Field Verification Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-2.5 px-3 font-semibold">Field Name</th>
                <th className="py-2.5 px-3 font-semibold">Company Purchase Value</th>
                <th className="py-2.5 px-3 font-semibold">GSTR-2B Portal Value</th>
                <th className="py-2.5 px-3 font-semibold">Variance / Deviation</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {fields.map((f) => (
                <tr key={f.label} className="hover:bg-sky-50/40">
                  <td className="py-3 px-3 font-semibold text-slate-800">{f.label}</td>
                  <td className="py-3 px-3 font-mono text-slate-900">
                    ₹{f.companyVal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-900">
                    {f.gstVal !== null ? `₹${f.gstVal.toLocaleString('en-IN')}` : '— (Missing)'}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    {f.diff > 0 ? (
                      <span className="text-rose-600">₹{f.diff.toLocaleString('en-IN')}</span>
                    ) : (
                      <span className="text-emerald-600">₹0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {f.gstVal === null ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        MISSING
                      </span>
                    ) : f.isMatch ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        MATCHED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        MISMATCHED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Mismatch Explanation & Recommended Action */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="space-y-3 bg-amber-50/40 border-amber-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Mismatch Root Cause Analysis
          </h4>
          <div className="rounded-xl bg-white p-3.5 border border-amber-200/80 text-xs text-slate-700 space-y-2">
            <p className="font-semibold text-slate-900">
              {invoice.mismatchExplanation || 'Zero variances detected for this invoice.'}
            </p>
            {invoice.taxDifference > 0 && (
              <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded">
                <div>Tax Difference: ₹{invoice.taxDifference.toLocaleString('en-IN')}</div>
                <div>Taxable Difference: ₹{invoice.taxableDifference.toLocaleString('en-IN')}</div>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="space-y-3 bg-sky-50/40 border-sky-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-sky-600" /> Statutory Enforcement & Action Plan
          </h4>
          <div className="rounded-xl bg-white p-3.5 border border-sky-200/80 text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Statutory Risk Level:</span>
              <span className="font-bold text-rose-600">{invoice.riskLevel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">ITC Exposure at Risk:</span>
              <span className="font-bold text-rose-600 font-mono text-sm">
                ₹{invoice.itcRiskAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="pt-1 border-t border-sky-100">
              <span className="text-slate-500 block mb-1">Recommended Action:</span>
              <p className="font-semibold text-slate-800 bg-sky-50/60 p-2 rounded">
                {invoice.recommendedAction}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Cross-Entity Navigation Bar */}
      <GlassCard className="p-4">
        <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
          Explore Connected Entities & Audits
        </h4>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            onClick={() => navigate(`/admin/transaction-graph?focus=${invoice.invoiceNumber}`)}
          >
            <Network className="h-3.5 w-3.5" /> View in Knowledge Graph
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/admin/vendors/${invoice.vendorId}`)}
          >
            <Users className="h-3.5 w-3.5 text-indigo-600" /> View Supplier Dossier
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/admin/companies/${buyerCompany.id}`)}
          >
            <Building className="h-3.5 w-3.5 text-sky-600" /> View Buyer Tenant Dossier
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/admin/audit-trail')}
          >
            <ClipboardList className="h-3.5 w-3.5 text-slate-600" /> View Audit Trail Events
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
