
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ShieldAlert,
  Sparkles, Info, ArrowRight, FileQuestion, RefreshCw, Download
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { generateGstr2b, uploadInvoiceFile, downloadGstr2bCsv, type BackendInvoice, type Gstr2bResponse } from '@/services/backendApi';

const statusMeta: Record<string, { icon: any; color: string; bg: string; border: string; label: string; badge: any }> = {
  MATCHED: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Matched', badge: 'success' },
  MISMATCHED: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Mismatched', badge: 'warning' },
  MISSING: { icon: FileQuestion, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Missing in GSTR-2B', badge: 'danger' },
  DUPLICATE: { icon: AlertTriangle, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Duplicate', badge: 'purple' },
  HIGH_RISK: { icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'High Risk', badge: 'danger' },
};

const toDisplay = (row: BackendInvoice) => ({
  invoiceNumber: row.invoice_number,
  invoiceDate: row.invoice_date,
  taxableValue: Number(row.taxable_value || 0),
  totalGst: Number(row.total_gst || 0),
  totalValue: Number(row.total_value || 0),
  itcRiskAmount: Number(row.itc_risk_amount || 0),
  status: row.status,
  riskLevel: row.risk_level,
  explanation: row.mismatch_explanation || 'Uploaded and saved to Supabase.',
  action: row.recommended_action || 'Generate GSTR-2B and run reconciliation.',
});

export default function VendorUpload() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [uploaded, setUploaded] = useState<BackendInvoice[]>([]);
  const [gstr2b, setGstr2b] = useState<Gstr2bResponse | null>(null);
  const [generating, setGenerating] = useState(false);

  const steps = [
    'Uploading invoice file to FastAPI...',
    'Reading invoice rows and validating columns...',
    'Normalizing taxable value, CGST, SGST, IGST...',
    'Saving invoice records to Supabase...',
    'Preparing reconciliation-ready ledger...',
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validExtensions = ['.csv', '.xlsx', '.json'];
    if (!validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setValidationError('Invalid file format. Upload CSV, Excel (.xlsx), or JSON.');
      setSelectedFile(null);
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setValidationError('File size exceeds 15 MB limit.');
      setSelectedFile(null);
      return;
    }
    setValidationError(null);
    setApiError(null);
    setSelectedFile(file);
    setUploaded([]);
    setGstr2b(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !user) return;
    setIsProcessing(true);
    setApiError(null);
    setUploaded([]);
    setGstr2b(null);
    setProgress(0);

    try {
      for (let i = 0; i < steps.length - 1; i++) {
        setProgressStep(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 180));
        setProgress(Math.round(((i + 1) / steps.length) * 100));
      }
      setProgressStep(steps[steps.length - 1]);
      const response = await uploadInvoiceFile(selectedFile, {
        id: user.id,
        companyName: user.companyName,
        gstin: user.gstin,
      });
      setUploaded(response.items);
      setProgress(100);
      if (!response.items.length) {
        setApiError(response.message + (response.skipped_count ? ' Duplicate rows were skipped.' : ''));
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Upload failed. Make sure FastAPI and Supabase are running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = async () => {
    if (!user || !uploaded.length) return;
    setGenerating(true);
    setApiError(null);
    try {
      const report = await generateGstr2b('112025', user.id);
      setGstr2b(report);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'GSTR-2B generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploaded([]);
    setGstr2b(null);
    setValidationError(null);
    setApiError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Invoice for Reconciliation"
        subtitle="Upload an invoice file, save it to Supabase, view it immediately, and generate a demo GSTR-2B from the saved records."
        icon={<Upload className="h-6 w-6 text-white" />}
      />

      <div className="rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50 via-white to-blue-50 p-4 text-xs text-slate-700 shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
          <div>
            <span className="font-bold text-sky-900">Demo GST mode:</span> the uploaded file is parsed by FastAPI,
            stored in Supabase, and used to generate a simulated GSTR-2B statement. This is not a live GSTN connection and does not require a GSTIN.
          </div>
        </div>
      </div>

      <GlassCard className="space-y-5">
        <input ref={fileInputRef} type="file" onChange={handleFileChange} accept=".csv,.xlsx,.json" className="hidden" />
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
            selectedFile ? 'border-indigo-400 bg-indigo-50/50' : 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-300 hover:bg-indigo-50/60'
          }`}
        >
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-md">
            {selectedFile ? <FileSpreadsheet className="h-7 w-7 text-emerald-600" /> : <Upload className="h-7 w-7" />}
          </div>
          {selectedFile ? (
            <>
              <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload</p>
              <p className="pt-1 text-[11px] font-medium text-indigo-600">Click to choose a different file</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-800">Drop your invoice file here, or <span className="font-bold text-indigo-600 underline">browse files</span></p>
              <p className="text-xs text-slate-400">Supports CSV, Excel (.xlsx), and JSON (up to 15 MB)</p>
            </>
          )}
        </div>

        {validationError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{validationError}</div>}
        {apiError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{apiError}</div>}

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>{progressStep}</span><span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {uploaded.length ? (
            <Button variant="secondary" size="sm" onClick={resetUpload}><Upload className="h-3.5 w-3.5" /> Upload Another</Button>
          ) : <span />}
          <Button size="sm" disabled={!selectedFile || isProcessing} loading={isProcessing} onClick={handleSubmit} className="!from-indigo-500 !to-purple-600">
            <Sparkles className="h-3.5 w-3.5" /> Upload & Save to Supabase
          </Button>
        </div>
      </GlassCard>

      {uploaded.length > 0 && (
        <GlassCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Uploaded Invoice Records ({uploaded.length})</p>
              <p className="text-xs text-slate-500">These records are now stored in Supabase and will appear in My Invoices.</p>
            </div>
            <Button size="sm" onClick={handleGenerate} loading={generating} disabled={generating} className="!from-emerald-500 !to-teal-600">
              <RefreshCw className="h-3.5 w-3.5" /> Generate GSTR-2B
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-sky-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-sky-50/70 text-slate-600">
                <tr>
                  <th className="px-3 py-2 font-bold">Invoice No.</th>
                  <th className="px-3 py-2 font-bold">Date</th>
                  <th className="px-3 py-2 text-right font-bold">Taxable</th>
                  <th className="px-3 py-2 text-right font-bold">GST</th>
                  <th className="px-3 py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {uploaded.map(row => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 font-mono font-bold text-indigo-700">{row.invoice_number}</td>
                    <td className="px-3 py-2 text-slate-600">{row.invoice_date}</td>
                    <td className="px-3 py-2 text-right">₹{Number(row.taxable_value).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right">₹{Number(row.total_gst).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={statusMeta[row.status]?.badge || 'info'} label={statusMeta[row.status]?.label || row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => navigate('/vendor/invoices')}>
              View All My Invoices <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </GlassCard>
      )}

      {uploaded.length > 0 && (
        <GlassCard className="space-y-4 border border-indigo-100 bg-indigo-50/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Reconciliation Preview</p>
              <p className="text-xs text-slate-600">Generate the statement after upload to see the invoice lines included in demo GSTR-2B.</p>
            </div>
            {gstr2b && (
              <Button size="sm" variant="secondary" onClick={() => downloadGstr2bCsv(gstr2b)}>
                <Download className="h-3.5 w-3.5" /> Download CSV
              </Button>
            )}
          </div>

          {gstr2b ? (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  ['Invoices', gstr2b.summary.invoices],
                  ['Suppliers', gstr2b.summary.suppliers],
                  ['Taxable', `₹${gstr2b.summary.total_taxable.toLocaleString('en-IN')}`],
                  ['Total GST', `₹${gstr2b.summary.total_tax.toLocaleString('en-IN')}`],
                  ['Invoice Value', `₹${gstr2b.summary.total_value.toLocaleString('en-IN')}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-white bg-white p-3 text-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                    <p className="text-sm font-black text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-bold">Invoice No.</th>
                      <th className="px-3 py-2 font-bold">Date</th>
                      <th className="px-3 py-2 font-bold">Supplier GSTIN</th>
                      <th className="px-3 py-2 text-right font-bold">Taxable</th>
                      <th className="px-3 py-2 text-right font-bold">CGST</th>
                      <th className="px-3 py-2 text-right font-bold">SGST</th>
                      <th className="px-3 py-2 text-right font-bold">IGST</th>
                      <th className="px-3 py-2 text-right font-bold">Total GST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gstr2b.records.map(r => (
                      <tr key={`${r.invoice_id}-${r.invoice_number}`}>
                        <td className="px-3 py-2 font-mono font-bold text-indigo-700">{r.invoice_number}</td>
                        <td className="px-3 py-2">{r.invoice_date}</td>
                        <td className="px-3 py-2 font-mono">{r.vendor_gstin}</td>
                        <td className="px-3 py-2 text-right">{r.taxable_value.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{r.cgst.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{r.sgst.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right">{r.igst.toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700">{r.total_gst.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-500">
                Generated at {new Date(gstr2b.generated_at).toLocaleString()} • Request {gstr2b.request_id} • Source: demo Supabase ledger
              </p>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-indigo-200 bg-white p-5 text-center text-xs text-slate-500">
              Click <b>Generate GSTR-2B</b> above to create the statement from the uploaded records.
            </div>
          )}
        </GlassCard>
      )}

      {uploaded.length > 0 && (() => {
        const first = toDisplay(uploaded[0]);
        const meta = statusMeta[first.status] || statusMeta.MISSING;
        const Icon = meta.icon;
        return (
          <GlassCard className={`space-y-4 border ${meta.border} ${meta.bg}`}>
            <div className="flex items-center gap-3">
              <Icon className={`h-6 w-6 ${meta.color}`} />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Upload Complete — {first.invoiceNumber}</p>
                <p className="text-xs text-slate-600">Saved in Supabase and available in the invoice list.</p>
              </div>
              <StatusBadge status={meta.badge} label={meta.label} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white bg-white/70 p-3"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Taxable Value</span><p className="text-sm font-black">₹{first.taxableValue.toLocaleString('en-IN')}</p></div>
              <div className="rounded-xl border border-white bg-white/70 p-3"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total GST</span><p className="text-sm font-black">₹{first.totalGst.toLocaleString('en-IN')}</p></div>
              <div className="rounded-xl border border-white bg-white/70 p-3"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ITC at Risk</span><p className="text-sm font-black text-rose-600">₹{first.itcRiskAmount.toLocaleString('en-IN')}</p></div>
              <div className="rounded-xl border border-white bg-white/70 p-3"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Risk Level</span><p className="text-sm font-black">{first.riskLevel}</p></div>
            </div>
          </GlassCard>
        );
      })()}
    </div>
  );
}
