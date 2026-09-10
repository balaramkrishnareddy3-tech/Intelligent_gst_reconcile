import { useState } from 'react';
import { useGstStore } from '@/store/gstStore';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Users,
  ClipboardList,
  FileText,
  Eye,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function CompanyReports() {
  const { invoices, getVendorsSummary, getAuditTrail } = useGstStore();
  const vendors = getVendorsSummary();
  const auditEvents = getAuditTrail();

  const [activeReportKey, setActiveReportKey] = useState<string>('reconciliation');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const reportTypes = [
    {
      id: 'reconciliation',
      title: 'Reconciliation Report',
      subtitle: 'Complete invoice-level matching between purchase ledger and GSTR-2B statement.',
      records: invoices.length,
      icon: FileSpreadsheet,
      color: 'text-sky-600',
      badge: 'Statutory Core',
    },
    {
      id: 'mismatch',
      title: 'Mismatch Report',
      subtitle: 'Line-by-line differences in taxable amounts, CGST, SGST, IGST, and missing returns.',
      records: invoices.filter((i) => i.status !== 'MATCHED').length,
      icon: AlertTriangle,
      color: 'text-amber-600',
      badge: 'Priority Action',
    },
    {
      id: 'itc_risk',
      title: 'ITC Risk Report',
      subtitle: 'Section 16(2)(aa) statutory risk breakdown with disallowance exposures.',
      records: invoices.filter((i) => i.itcRiskAmount > 0).length,
      icon: ShieldAlert,
      color: 'text-rose-600',
      badge: 'Cash Flow Protection',
    },
    {
      id: 'vendor_compliance',
      title: 'Vendor Compliance Report',
      subtitle: 'Counterparty filing discipline, risk levels, match rates, and dispute frequency.',
      records: vendors.length,
      icon: Users,
      color: 'text-indigo-600',
      badge: 'Counterparty Scorecard',
    },
    {
      id: 'audit_trail',
      title: 'Audit Trail Report',
      subtitle: 'Step-by-step verification history, actors, timestamps, and normalization hashes.',
      records: auditEvents.length,
      icon: ClipboardList,
      color: 'text-blue-600',
      badge: 'Statutory Proof',
    },
    {
      id: 'exception',
      title: 'Exception Report',
      subtitle: 'Statutory exceptions, supplier GSTIN suspensions, and duplicate ledger entries.',
      records: invoices.filter((i) => i.status === 'DUPLICATE' || i.status === 'HIGH_RISK').length,
      icon: AlertTriangle,
      color: 'text-red-600',
      badge: 'Executive Attention',
    },
  ];

  const handleExportCsv = (reportId: string) => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `GST_Reconcile_${reportId}.csv`;

    if (reportId === 'reconciliation' || reportId === 'exception') {
      headers = [
        'Invoice Number',
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
      ];
      const source =
        reportId === 'exception'
          ? invoices.filter((i) => i.status === 'DUPLICATE' || i.status === 'HIGH_RISK')
          : invoices;
      rows = source.map((inv) => [
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
      ]);
    } else if (reportId === 'mismatch' || reportId === 'itc_risk') {
      headers = [
        'Invoice Number',
        'Vendor Name',
        'Status',
        'Tax Variance',
        'ITC at Risk',
        'Risk Level',
        'Explanation',
        'Recommended Action',
      ];
      const source =
        reportId === 'itc_risk'
          ? invoices.filter((i) => i.itcRiskAmount > 0)
          : invoices.filter((i) => i.status !== 'MATCHED');
      rows = source.map((inv) => [
        inv.invoiceNumber,
        `"${inv.vendorName}"`,
        inv.status,
        inv.taxDifference,
        inv.itcRiskAmount,
        inv.riskLevel,
        `"${inv.mismatchExplanation || ''}"`,
        `"${inv.recommendedAction}"`,
      ]);
    } else if (reportId === 'vendor_compliance') {
      headers = [
        'Vendor Name',
        'Vendor GSTIN',
        'Invoice Count',
        'Match Rate (%)',
        'Mismatches',
        'Missing in 2B',
        'Compliance Score',
        'Risk Level',
        'Risk Factors',
      ];
      rows = vendors.map((v) => [
        `"${v.name}"`,
        v.gstin,
        v.invoiceCount,
        v.matchRate,
        v.mismatchCount,
        v.missingCount,
        v.complianceScore,
        v.riskLevel,
        `"${v.riskReasons.join('; ')}"`,
      ]);
    } else if (reportId === 'audit_trail') {
      headers = ['Timestamp', 'Invoice ID', 'Action', 'Result', 'Explanation', 'Actor'];
      rows = auditEvents.map((a) => [
        a.timestamp,
        a.invoiceId,
        `"${a.action}"`,
        `"${a.result}"`,
        `"${a.explanation}"`,
        a.actor,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(`Exported ${filename} successfully!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Official GST Reports & Export Center"
        subtitle="Generate executive compliance summaries, mismatch ledgers, and audit trail records"
        icon={<BarChart3 className="h-6 w-6 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrintPdf}>
              <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
            </Button>
            <Button size="sm" onClick={() => handleExportCsv(activeReportKey)}>
              <Download className="h-3.5 w-3.5" /> Export Selected to Excel
            </Button>
          </div>
        }
      />

      {/* Success Notification */}
      {downloadSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="font-bold">{downloadSuccess}</span>
        </div>
      )}

      {/* Report Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((rep) => {
          const isSelected = rep.id === activeReportKey;
          return (
            <GlassCard
              key={rep.id}
              onClick={() => setActiveReportKey(rep.id)}
              className={`p-5 cursor-pointer transition-all ${
                isSelected
                  ? 'border-sky-500 ring-2 ring-sky-500/20 bg-white shadow-md'
                  : 'hover:border-sky-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-sky-50 ${rep.color}`}>
                  <rep.icon className="h-5 w-5" />
                </div>
                <StatusBadge status="neutral" label={rep.badge} />
              </div>

              <h3 className="text-sm font-bold text-slate-900">{rep.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {rep.subtitle}
              </p>

              <div className="mt-4 pt-3 border-t border-sky-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Verified Records:</span>
                <span className="font-bold text-slate-900">{rep.records} entries</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportCsv(rep.id);
                  }}
                >
                  <Download className="h-3 w-3" /> Excel / CSV
                </Button>
                <Button
                  size="sm"
                  variant={isSelected ? 'primary' : 'ghost'}
                  className="px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveReportKey(rep.id);
                  }}
                  title="Preview report table below"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Live Report Preview Section */}
      <GlassCard className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-sky-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-600" /> Active Report Preview:{' '}
              {reportTypes.find((r) => r.id === activeReportKey)?.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live data from centralized reconciliation memory (November 2025 return period)
            </p>
          </div>
          <Button size="sm" onClick={() => handleExportCsv(activeReportKey)}>
            <Download className="h-3.5 w-3.5" /> Download Full Dataset
          </Button>
        </div>

        {/* Live Table Preview */}
        <div className="overflow-x-auto max-h-[380px]">
          {activeReportKey === 'reconciliation' || activeReportKey === 'mismatch' || activeReportKey === 'itc_risk' || activeReportKey === 'exception' ? (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-sky-50 text-slate-600 shadow-xs">
                <tr className="border-b border-sky-100">
                  <th className="py-2.5 px-3 font-semibold">Invoice No</th>
                  <th className="py-2.5 px-3 font-semibold">Vendor Name</th>
                  <th className="py-2.5 px-3 font-semibold">Books Taxable</th>
                  <th className="py-2.5 px-3 font-semibold">2B Taxable</th>
                  <th className="py-2.5 px-3 font-semibold">Tax Variance</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/60">
                {(activeReportKey === 'mismatch'
                  ? invoices.filter((i) => i.status !== 'MATCHED')
                  : activeReportKey === 'itc_risk'
                  ? invoices.filter((i) => i.itcRiskAmount > 0)
                  : activeReportKey === 'exception'
                  ? invoices.filter((i) => i.status === 'DUPLICATE' || i.status === 'HIGH_RISK')
                  : invoices
                ).map((inv) => (
                  <tr key={inv.id} className="hover:bg-sky-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-700">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800">{inv.vendorName}</td>
                    <td className="py-2.5 px-3 font-mono">
                      ₹{inv.companyRecord.taxableValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {inv.gstRecord ? `₹${inv.gstRecord.taxableValue.toLocaleString('en-IN')}` : 'Missing'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-600">
                      ₹{inv.taxDifference.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge
                        status={
                          inv.status === 'MATCHED'
                            ? 'success'
                            : inv.status === 'MISMATCHED'
                            ? 'warning'
                            : 'danger'
                        }
                        label={inv.status}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[11px]">{inv.riskLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeReportKey === 'vendor_compliance' ? (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-sky-50 text-slate-600 shadow-xs">
                <tr className="border-b border-sky-100">
                  <th className="py-2.5 px-3 font-semibold">Vendor Name</th>
                  <th className="py-2.5 px-3 font-semibold">GSTIN</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Invoices</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Match Rate</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Mismatches</th>
                  <th className="py-2.5 px-3 font-semibold">Compliance Score</th>
                  <th className="py-2.5 px-3 font-semibold">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/60">
                {vendors.map((v) => (
                  <tr key={v.gstin} className="hover:bg-sky-50/50">
                    <td className="py-2.5 px-3 font-bold text-slate-800">{v.name}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{v.gstin}</td>
                    <td className="py-2.5 px-3 text-center">{v.invoiceCount}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{v.matchRate}%</td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-600">{v.mismatchCount}</td>
                    <td className="py-2.5 px-3 font-bold">{v.complianceScore} / 100</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge
                        status={v.riskLevel === 'LOW' ? 'success' : v.riskLevel === 'MEDIUM' ? 'warning' : 'danger'}
                        label={`${v.riskLevel} Risk`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-sky-50 text-slate-600 shadow-xs">
                <tr className="border-b border-sky-100">
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold">Invoice Ref</th>
                  <th className="py-2.5 px-3 font-semibold">Action</th>
                  <th className="py-2.5 px-3 font-semibold">Result</th>
                  <th className="py-2.5 px-3 font-semibold">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100/60">
                {auditEvents.slice(0, 15).map((e) => (
                  <tr key={e.id} className="hover:bg-sky-50/50">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{e.timestamp}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-700">{e.invoiceId}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{e.action}</td>
                    <td className="py-2.5 px-3 font-bold">{e.result}</td>
                    <td className="py-2.5 px-3 text-slate-600">{e.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
