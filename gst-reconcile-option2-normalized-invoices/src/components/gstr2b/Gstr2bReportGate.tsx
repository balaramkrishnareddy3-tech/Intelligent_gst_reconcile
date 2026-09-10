import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  FileJson,
  Download,
  X,
  ShieldCheck,
  ExternalLink,
  Radio,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useGstStore } from '@/store/gstStore';
import { useNotifyStore } from '@/store/notifyStore';
import { buildGstr2bPayload, toCsv, periodLabelOf } from '@/services/gstApi';
import type { Gstr2bPayload } from '@/services/gstApi';
import { cn } from '@/utils/cn';

/* =========================================================================
 * GSTR-2B REPORT GATE
 * -----------------------------------------------------------------------
 * Watches the Company Data Sources page: the moment an upload finishes
 * (data-source telemetry flips to "Just now"), this gate opens a GSTN-style
 * OTP verification step. Once the OTP is verified, the full GSTR-2B
 * statement report for that ingestion is rendered clearly — supplier-wise
 * B2B blocks, invoice-level lines, ledger comparison and downloads.
 * Mounted globally; no existing page is modified.
 * ======================================================================= */

const PERIOD = '112025';

const inr = (n: number) =>
  n >= 10000000
    ? `₹${(n / 10000000).toFixed(2)} Cr`
    : n >= 100000
    ? `₹${(n / 100000).toFixed(2)} L`
    : `₹${n.toLocaleString('en-IN')}`;

interface PendingUpload {
  key: string;
  fileName: string;
  size: string;
  records: number;
}

export default function Gstr2bReportGate() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { invoices, dataSources } = useGstStore();
  const pushNotify = useNotifyStore((s) => s.push);

  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [phase, setPhase] = useState<'otp' | 'report'>('otp');
  const [otpIssued, setOtpIssued] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const prevSig = useRef<Record<string, string> | null>(null);
  const reportedRef = useRef(false);

  const gstin = user?.gstin ?? '27AABCU9603R1ZM';

  /* ---------- detect upload completion on /company/data-sources ---------- */
  useEffect(() => {
    const sig = (d: (typeof dataSources)[number]) =>
      `${d.lastSync}|${d.fileName}|${d.recordCount}`;
    const cur: Record<string, string> = {};
    dataSources.forEach((d) => (cur[d.key] = sig(d)));
    const prev = prevSig.current;
    prevSig.current = cur;
    if (!prev) return;
    if (user?.role !== 'company') return;

    const changed = dataSources.find((d) => cur[d.key] !== prev[d.key]);
    if (!changed) return;
    // GSTN gateway pushes carry their own auth — only plain uploads open the gate
    if (!changed.lastSync.startsWith('Just now') || changed.lastSync.includes('GSTN gateway'))
      return;

    setPending({
      key: changed.key,
      fileName: changed.fileName ?? 'upload',
      size: changed.fileSize ?? '—',
      records: changed.recordCount,
    });
    setOtpIssued(String(Math.floor(100000 + Math.random() * 900000)));
    setOtpInput('');
    setOtpError(null);
    setPhase('otp');
    reportedRef.current = false;
  }, [dataSources, user]);

  /* ---------- build the GSTR-2B statement report ---------- */
  const payload: Gstr2bPayload | null = useMemo(
    () => (phase === 'report' ? buildGstr2bPayload(invoices, gstin, PERIOD) : null),
    [phase, invoices, gstin]
  );

  /* ---------- ledger vs statement comparison ---------- */
  const comparison = useMemo(() => {
    if (!payload) return null;
    const payMap = new Map<string, { txval: number; cgst: number; sgst: number; igst: number; totalGst: number }>();
    payload.docdata.b2b.forEach((s) =>
      s.inv.forEach((i) =>
        payMap.set(i.inum, { txval: i.txval, cgst: i.cgst, sgst: i.sgst, igst: i.igst, totalGst: i.igst + i.cgst + i.sgst + i.otherTax })
      )
    );
    let matched = 0;
    let mismatched = 0;
    invoices.forEach((inv) => {
      const p = payMap.get(inv.invoiceNumber);
      if (!p) return;
      const same =
        Math.abs(p.txval - inv.companyRecord.taxableValue) < 0.5 &&
        Math.abs(p.cgst - inv.companyRecord.cgst) < 0.5 &&
        Math.abs(p.sgst - inv.companyRecord.sgst) < 0.5 &&
        Math.abs(p.igst - inv.companyRecord.igst) < 0.5 &&
        Math.abs(p.totalGst - inv.companyRecord.totalGst) < 0.5;
      if (same) matched++;
      else mismatched++;
    });
    const missing = invoices.filter((i) => !payMap.has(i.invoiceNumber)).length;
    return { matched, mismatched, missing };
  }, [payload, invoices]);

  /* ---------- OTP verification ---------- */
  const verifyOtp = () => {
    setVerifying(true);
    setOtpError(null);
    window.setTimeout(() => {
      setVerifying(false);
      if (otpInput.trim() !== otpIssued) {
        setOtpError('OTP mismatch — 401 Unauthorized. Use the OTP dispatched to the registered mobile.');
        return;
      }
      setPhase('report');
      if (!reportedRef.current) {
        reportedRef.current = true;
        pushNotify({
          kind: 'success',
          title: 'GSTR-2B report generated',
          message: `OTP verified • statement report for ${periodLabelOf(PERIOD)} rendered from ${pending?.fileName ?? 'upload'}.`,
          source: 'GSTN Gateway',
          module: 'gateway',
        });
      }
    }, 450);
  };

  const download = (kind: 'json' | 'csv') => {
    if (!payload) return;
    const content = kind === 'json' ? JSON.stringify(payload, null, 2) : toCsv(payload);
    const blob = new Blob([content], { type: kind === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR2B_REPORT_${gstin}_${PERIOD}.${kind}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const close = () => {
    setPending(null);
    setPhase('otp');
    setOtpInput('');
    setOtpError(null);
  };

  if (!pending) return null;

  const s = payload?.docdata.summary;
  const flatInv = payload ? payload.docdata.b2b.flatMap((sup) => sup.inv.map((i) => ({ ...i, trade: sup.trade_name, ctin: sup.ctin }))) : [];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/40">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-5 py-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <FileJson className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">
              {phase === 'otp' ? 'GSTN OTP Verification Required' : `GSTR-2B Statement Report — ${periodLabelOf(PERIOD)}`}
            </p>
            <p className="text-[10px] font-medium text-sky-100">
              {phase === 'otp'
                ? `Ingestion of ${pending.fileName} awaits statutory OTP authorisation`
                : `GSTIN ${gstin} • ${pending.fileName} • OTP verified ✓`}
            </p>
          </div>
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-sky-100 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {phase === 'otp' ? (
            <div className="mx-auto max-w-md space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30">
                  <KeyRound className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-900">Authorize GSTR-2B ingestion</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  Upload of <span className="font-mono font-bold text-slate-800">{pending.fileName}</span>{' '}
                  ({pending.size}, {pending.records} records) completed. GSTN requires OTP
                  authorisation for GSTIN <span className="font-mono font-bold">{gstin}</span> before
                  the statement report is released.
                </p>

                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] text-emerald-800">
                  <span className="font-bold">SANDBOX OTP dispatched to registered mobile:</span>{' '}
                  <span className="font-mono text-base font-black tracking-[0.3em]">{otpIssued}</span>
                </div>

                <input
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-center font-mono text-lg tracking-[0.5em] text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
                {otpError && (
                  <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] font-semibold text-rose-700">
                    {otpError}
                  </p>
                )}

                <button
                  onClick={verifyOtp}
                  disabled={otpInput.length !== 6 || verifying}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-500/30 transition-all hover:scale-[1.01] disabled:opacity-40"
                >
                  {verifying ? <Radio className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  Verify OTP & Release GSTR-2B Report
                </button>
              </div>
            </div>
          ) : (
            payload && s && (
              <div className="space-y-5">
                {/* Meta strip */}
                <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                  {[
                    ['GSTIN', gstin],
                    ['Period', `${periodLabelOf(PERIOD)} (${PERIOD})`],
                    ['Generated', new Date(payload.genDate).toLocaleString()],
                    ['Request ID', payload.genRequestId],
                    ['Source File', pending.fileName],
                    ['File Size', pending.size],
                    ['Records Ingested', String(pending.records)],
                    ['Authorisation', 'OTP verified ✓'],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{k}</span>
                      <p className="truncate font-mono font-bold text-slate-800" title={v}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Summary tiles */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                  {[
                    ['Suppliers', String(s.suppliers), 'text-slate-900'],
                    ['B2B Invoices', String(s.invoices), 'text-slate-900'],
                    ['Total Taxable', inr(s.totalTaxable), 'text-slate-900'],
                    ['IGST', inr(s.totalIgst), 'text-sky-700'],
                    ['CGST+SGST', inr(s.totalCgst + s.totalSgst), 'text-sky-700'],
                    ['Other Tax', inr(s.totalOtherTax), 'text-amber-700'],
                    ['Total ITC', inr(s.totalTax), 'text-emerald-700'],
                  ].map(([k, v, c]) => (
                    <div key={k} className="rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-sm">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{k}</span>
                      <p className={cn('text-sm font-black', c)}>{v}</p>
                    </div>
                  ))}
                </div>

                {/* Ledger comparison */}
                {comparison && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Statement vs Purchase Ledger
                    </p>
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="bg-emerald-500"
                        style={{ width: `${(comparison.matched / (invoices.length || 1)) * 100}%` }}
                      />
                      <div
                        className="bg-amber-400"
                        style={{ width: `${(comparison.mismatched / (invoices.length || 1)) * 100}%` }}
                      />
                      <div
                        className="bg-rose-500"
                        style={{ width: `${(comparison.missing / (invoices.length || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-[11px] font-semibold">
                      <span className="text-emerald-700">✓ {comparison.matched} matched</span>
                      <span className="text-amber-700">⚠ {comparison.mismatched} value mismatches</span>
                      <span className="text-rose-700">✕ {comparison.missing} missing in statement</span>
                    </div>
                  </div>
                )}

                {/* Supplier-wise B2B */}
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Supplier-wise B2B Blocks
                  </p>
                  <div className="max-h-44 overflow-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="sticky top-0 bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-2 font-bold">Supplier GSTIN</th>
                          <th className="px-4 py-2 font-bold">Trade Name</th>
                          <th className="px-4 py-2 text-right font-bold">Invoices</th>
                          <th className="px-4 py-2 text-right font-bold">Taxable</th>
                          <th className="px-4 py-2 text-right font-bold">Tax</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payload.docdata.b2b.map((sup) => (
                          <tr key={sup.ctin} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-mono font-bold text-sky-700">{sup.ctin}</td>
                            <td className="px-4 py-2 text-slate-700">{sup.trade_name}</td>
                            <td className="px-4 py-2 text-right font-bold">{sup.inv.length}</td>
                            <td className="px-4 py-2 text-right">{inr(sup.inv.reduce((a, i) => a + i.txval, 0))}</td>
                            <td className="px-4 py-2 text-right font-bold text-emerald-700">
                              {inr(sup.inv.reduce((a, i) => a + i.igst + i.cgst + i.sgst + i.otherTax, 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Invoice-level lines */}
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Invoice-level Statement Lines ({flatInv.length})
                  </p>
                  <div className="max-h-56 overflow-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="sticky top-0 bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-2 font-bold">Invoice No</th>
                          <th className="px-4 py-2 font-bold">Date</th>
                          <th className="px-4 py-2 font-bold">Supplier</th>
                          <th className="px-4 py-2 text-right font-bold">Taxable</th>
                          <th className="px-4 py-2 text-right font-bold">IGST</th>
                          <th className="px-4 py-2 text-right font-bold">CGST</th>
                          <th className="px-4 py-2 text-right font-bold">SGST</th>
                          <th className="px-4 py-2 text-right font-bold">Other Tax</th>
                          <th className="px-4 py-2 text-right font-bold">Invoice Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {flatInv.map((i, idx) => (
                          <tr key={`${i.inum}-${idx}`} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-mono font-bold text-sky-700">{i.inum}</td>
                            <td className="px-4 py-2 text-slate-600">{i.dt}</td>
                            <td className="max-w-[140px] truncate px-4 py-2 text-slate-700">{i.trade}</td>
                            <td className="px-4 py-2 text-right">{i.txval.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-2 text-right">{i.igst.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-2 text-right">{i.cgst.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-2 text-right">{i.sgst.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-2 text-right font-semibold text-amber-700">{i.otherTax.toLocaleString('en-IN')}</td>
                            <td className="px-4 py-2 text-right font-bold">{i.val.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer actions */}
        {phase === 'report' && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
            <p className="text-[10px] text-slate-400">
              Statement released by GSTN gateway after OTP authorisation • {payload?.genRequestId}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => download('json')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:border-sky-400 hover:text-sky-700"
              >
                <Download className="h-3 w-3" /> JSON
              </button>
              <button
                onClick={() => download('csv')}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:border-sky-400 hover:text-sky-700"
              >
                <Download className="h-3 w-3" /> CSV
              </button>
              <button
                onClick={() => {
                  close();
                  navigate('/company/reconciliation/results');
                }}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-md shadow-sky-500/30 hover:scale-[1.02]"
              >
                <ExternalLink className="h-3 w-3" /> Open Reconciliation Results
              </button>
              <button
                onClick={close}
                className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
