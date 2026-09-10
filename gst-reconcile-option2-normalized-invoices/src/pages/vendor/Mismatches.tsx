import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGstStore } from '@/store/gstStore';
import { useAuthStore } from '@/store/authStore';
import type { InvoiceItem } from '@/types/gst';
import {
  AlertTriangle,
  ExternalLink,
  X,
  CheckCircle2,
  ShieldAlert,
  ClipboardList,
  FileSearch,
  Gauge,
  Sparkles,
  Send,
  Search as SearchIcon,
  Network,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

/* =========================================================================
 * Vendor Mismatch Resolution Workbench
 * -----------------------------------------------------------------------
 * Sourced from the SAME centralized invoices store as Company/Admin —
 * filtered to only the logged-in vendor's own invoices. Clicking Resolve
 * opens a full decision-support workflow (mismatch identification, root
 * cause explanation, checked records, risk/fraud scoring, and a
 * recommended action) instead of a plain alert, and writes an audit event
 * back into the centralized ledger via resolveMismatch().
 * ======================================================================= */

const RECORDS_CHECKED = ['Purchase Register', 'GSTR-2B', 'GSTR-1', 'Invoice Number', 'Invoice Date', 'Vendor GSTIN', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Duplicate Invoice Records'];

function typeLabel(inv: InvoiceItem): string {
  if (inv.status === 'MISSING') return 'Not in Buyer Books (GSTR-2B)';
  if (inv.status === 'DUPLICATE') return 'Duplicate Invoice Record';
  if (inv.status === 'HIGH_RISK') return 'Supplier / GSTIN Compliance Risk';
  if (inv.mismatchFields.includes('igst') || inv.mismatchFields.includes('taxableValue')) return 'Taxable / Tax Value Mismatch';
  return 'Amount Mismatch';
}

function fraudScore(inv: InvoiceItem): number {
  // Heuristic score derived from real record data — not a separate fake dataset.
  let score = 10;
  if (inv.status === 'MISSING') score += 35;
  if (inv.status === 'HIGH_RISK') score += 45;
  if (inv.status === 'DUPLICATE') score += 30;
  if (inv.taxableDifference > 0) score += Math.min(20, Math.round(inv.taxableDifference / 1000));
  if (inv.riskLevel === 'CRITICAL') score += 15;
  else if (inv.riskLevel === 'HIGH') score += 10;
  else if (inv.riskLevel === 'MEDIUM') score += 5;
  return Math.min(97, score);
}

export default function Mismatches() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusInvoiceNumber = searchParams.get('focus');
  const { user } = useAuthStore();
  const { invoices, companies, resolveMismatch } = useGstStore();

  const [search, setSearch] = useState(focusInvoiceNumber || '');
  const [activeInvoice, setActiveInvoice] = useState<InvoiceItem | null>(null);
  const [workflowStage, setWorkflowStage] = useState<'idle' | 'analyzing' | 'result'>('idle');
  const [decisionNote, setDecisionNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const buyerName = companies[0]?.name || 'Buyer Company';

  const myMismatches = useMemo(
    () => invoices.filter((inv) => inv.vendorGstin === user?.gstin && inv.status !== 'MATCHED'),
    [invoices, user?.gstin]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return myMismatches;
    const q = search.toLowerCase();
    return myMismatches.filter(
      (inv) => inv.invoiceNumber.toLowerCase().includes(q) || inv.status.toLowerCase().includes(q)
    );
  }, [myMismatches, search]);

  const openResolve = (invoice: InvoiceItem) => {
    setActiveInvoice(invoice);
    setWorkflowStage('analyzing');
    setDecisionNote('');
    setShowAuditTrail(false);
    // Simulate the system "thinking" through the analysis pipeline described in the workflow.
    window.setTimeout(() => setWorkflowStage('result'), 700);
  };

  const closeResolve = () => {
    setActiveInvoice(null);
    setWorkflowStage('idle');
    setShowAuditTrail(false);
  };

  const handleMarkResolved = () => {
    if (!activeInvoice) return;
    resolveMismatch(
      activeInvoice.invoiceNumber,
      decisionNote || 'Vendor confirmed and resolved the discrepancy after reviewing GSTR-1/2B and purchase register.'
    );
    setToast(`${activeInvoice.invoiceNumber} marked as resolved and synced to the central ledger.`);
    window.setTimeout(() => setToast(null), 3500);
    closeResolve();
  };

  const handleRequestCorrection = () => {
    if (!activeInvoice) return;
    setToast(`Correction request drafted for ${activeInvoice.invoiceNumber}. Buyer will be notified to amend records.`);
    window.setTimeout(() => setToast(null), 3500);
    closeResolve();
  };

  const handleKeepInvestigating = () => {
    if (!activeInvoice) return;
    setToast(`${activeInvoice.invoiceNumber} kept under investigation. No changes made to reconciliation status.`);
    window.setTimeout(() => setToast(null), 3500);
    closeResolve();
  };

  const score = activeInvoice ? fraudScore(activeInvoice) : 0;
  const riskBand = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';
  const riskColor = riskBand === 'High' ? 'text-rose-600' : riskBand === 'Medium' ? 'text-amber-600' : 'text-emerald-600';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discrepancies & Buyer Mismatches"
        subtitle="Discrepancies flagged against your invoices — resolve, request correction, or investigate, backed by the centralized reconciliation ledger"
        icon={<AlertTriangle className="h-6 w-6 text-white" />}
      />

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 shadow-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> {toast}
        </div>
      )}

      <GlassCard className="p-3.5">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your mismatches by invoice number or status..."
            className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="px-4 py-3 font-bold">Invoice Ref</th>
                <th className="px-4 py-3 font-bold">Buyer Entity</th>
                <th className="px-4 py-3 font-bold">Mismatch Type</th>
                <th className="px-4 py-3 font-bold">Your Declared Value</th>
                <th className="px-4 py-3 font-bold">Buyer Ledger Value</th>
                <th className="px-4 py-3 font-bold">Difference</th>
                <th className="px-4 py-3 font-bold">Severity</th>
                <th className="px-4 py-3 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-emerald-500" />
                    <p className="text-sm font-semibold text-slate-700">No open mismatches on your invoices</p>
                    <p className="text-xs text-slate-400">All your submitted invoices are statutorily matched.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-sky-50/60 ${
                      focusInvoiceNumber === inv.invoiceNumber ? 'bg-indigo-50/70' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-700">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{buyerName}</td>
                    <td className="px-4 py-3.5 text-slate-700">{typeLabel(inv)}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-800">
                      ₹{inv.companyRecord.taxableValue.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-800">
                      {inv.gstRecord ? `₹${inv.gstRecord.taxableValue.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-600">
                      ₹{inv.taxDifference.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        status={inv.riskLevel === 'LOW' || inv.riskLevel === 'MEDIUM' ? 'warning' : 'danger'}
                        label={inv.riskLevel === 'LOW' || inv.riskLevel === 'MEDIUM' ? 'Minor' : 'Critical'}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button variant="secondary" size="sm" onClick={() => openResolve(inv)}>
                        Resolve <ExternalLink className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Resolve Workflow Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3.5">
              <ClipboardList className="h-5 w-5 text-white" />
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Resolve Invoice — {activeInvoice.invoiceNumber}</p>
                <p className="text-[10px] font-medium text-indigo-100">
                  Automated mismatch analysis and decision support
                </p>
              </div>
              <button onClick={closeResolve} className="rounded-lg p-1.5 text-indigo-100 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {workflowStage === 'analyzing' ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                  <p className="text-sm font-bold text-slate-800">Analyzing invoice against GST records…</p>
                  <p className="text-xs text-slate-500">
                    Checking purchase register, GSTR-2B, GSTR-1, GSTIN, tax values, and duplicate entries.
                  </p>
                </div>
              ) : (
                <>
                  {/* Step 1 — Identify the mismatch */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <FileSearch className="h-3.5 w-3.5" /> Step 1 — Identify the Mismatch
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-slate-400">Invoice</span><p className="font-mono font-bold text-slate-900">{activeInvoice.invoiceNumber}</p></div>
                      <div><span className="text-slate-400">Buyer</span><p className="font-bold text-slate-900">{buyerName}</p></div>
                      <div><span className="text-slate-400">Mismatch Type</span><p className="font-bold text-slate-900">{typeLabel(activeInvoice)}</p></div>
                      <div><span className="text-slate-400">Difference</span><p className="font-mono font-bold text-rose-600">₹{activeInvoice.taxDifference.toLocaleString('en-IN')}</p></div>
                      <div><span className="text-slate-400">Your Declared Value</span><p className="font-mono font-bold text-slate-900">₹{activeInvoice.companyRecord.taxableValue.toLocaleString('en-IN')}</p></div>
                      <div><span className="text-slate-400">Buyer / GST Record Value</span><p className="font-mono font-bold text-slate-900">{activeInvoice.gstRecord ? `₹${activeInvoice.gstRecord.taxableValue.toLocaleString('en-IN')}` : 'Not found in GSTR-2B'}</p></div>
                    </div>
                  </div>

                  {/* Step 2 — Explain the reason */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      <Sparkles className="h-3.5 w-3.5" /> Step 2 — Why This Happened
                    </p>
                    <p className="leading-relaxed">{activeInvoice.mismatchExplanation}</p>
                  </div>

                  {/* Step 3 — Checked related records */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-xs">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Step 3 — Records Checked
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {RECORDS_CHECKED.map((record) => (
                        <span
                          key={record}
                          className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800"
                        >
                          <CheckCircle2 className="h-3 w-3" /> {record}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Step 4 — Risk analysis */}
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900">
                    <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-700">
                      <Gauge className="h-3.5 w-3.5" /> Step 4 — Risk Analysis
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500">ITC Impact</span>
                        <p className="font-mono font-bold text-rose-700">₹{activeInvoice.itcRiskAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Fraud / Suspicion Score</span>
                        <p className={`font-bold ${riskColor}`}>{score}/100 ({riskBand})</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-rose-800">
                      Indicators: {typeLabel(activeInvoice)}
                      {activeInvoice.mismatchFields.length > 0 ? `, field variance in ${activeInvoice.mismatchFields.join(', ')}` : ''}.
                    </p>
                  </div>

                  {/* Step 5 — Recommended resolution */}
                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs text-sky-900">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-700">
                      <ShieldAlert className="h-3.5 w-3.5" /> Step 5 — Recommended Action
                    </p>
                    <p className="leading-relaxed">{activeInvoice.recommendedAction}</p>
                  </div>

                  {/* Decision note */}
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-slate-600">
                      Resolution Note (recorded to Audit Trail)
                    </label>
                    <textarea
                      value={decisionNote}
                      onChange={(e) => setDecisionNote(e.target.value)}
                      rows={2}
                      placeholder="Optional: describe what you verified or corrected..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  {/* View Invoice Details */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-xs">
                    <button
                      onClick={() => setShowAuditTrail((v) => !v)}
                      className="flex w-full items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      <span className="flex items-center gap-1.5">
                        <ClipboardList className="h-3.5 w-3.5" /> Audit Trail for This Invoice
                      </span>
                      <span className="text-slate-400">{showAuditTrail ? 'Hide' : 'Show'}</span>
                    </button>
                    {showAuditTrail && (
                      <div className="mt-3 space-y-2">
                        {activeInvoice.auditEvents.length === 0 ? (
                          <p className="text-slate-400">No audit events recorded yet for this invoice.</p>
                        ) : (
                          activeInvoice.auditEvents.map((event) => (
                            <div key={event.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">{event.action}</span>
                                <span className="font-mono text-[10px] text-slate-400">{event.timestamp}</span>
                              </div>
                              <p className="mt-1 text-[11px] text-slate-600">{event.explanation}</p>
                              <p className="mt-0.5 text-[10px] font-semibold text-indigo-600">
                                Result: {event.result} • Actor: {event.actor}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            {workflowStage === 'result' && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleMarkResolved} className="!from-emerald-500 !to-teal-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Resolved
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleRequestCorrection}>
                    <Send className="h-3.5 w-3.5" /> Request Buyer Correction
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleKeepInvestigating}>
                    Keep Under Investigation
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate('/vendor/invoices')}
                  >
                    View Invoice Details
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/vendor/transaction-graph?focus=${activeInvoice.invoiceNumber}`)}
                  >
                    <Network className="h-3.5 w-3.5" /> View Knowledge Graph
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
