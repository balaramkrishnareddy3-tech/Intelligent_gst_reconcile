import { BarChart3, Download, FileText } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

const reports = [
  { name: 'Supplier Outward Tax Summary', desc: 'Complete breakdown of all outward invoices and ITC passed through', period: 'Nov 2025', format: 'Excel / CSV' },
  { name: 'Discrepancy & Dispute Ledger', desc: 'Line items flagged by enterprise buyers for value or date mismatches', period: 'Nov 2025', format: 'Excel / PDF' },
  { name: 'GST Filing Compliance Certificate', desc: 'GSTR-1 and GSTR-3B filing punctuality record for vendor rating', period: 'Q3 FY26', format: 'PDF Document' },
];

export default function VendorReports() {
  const handleDownload = (name: string) => {
    alert(`Downloading ${name}...`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Compliance Reports"
        subtitle="Download official statements and buyer mismatch certificates"
        icon={<BarChart3 className="h-6 w-6 text-white" />}
      />

      <div className="grid gap-4">
        {reports.map((report) => (
          <GlassCard key={report.name} hover className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{report.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{report.desc}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                    <span>Period: {report.period}</span>
                    <span>•</span>
                    <span>Format: {report.format}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownload(report.name)}
              >
                <Download className="h-3.5 w-3.5" /> Download Report
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
