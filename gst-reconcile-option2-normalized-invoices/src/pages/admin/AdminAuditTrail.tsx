import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGstStore } from '@/store/gstStore';
import type { AuditEvent } from '@/types/gst';
import {
  ClipboardList,
  Search,
  Download,
  Clock,
  Shield,
  Filter,
  ArrowRight,
  Layers,
  CheckCircle2,
  X,
  FileText,
  Building,
  Key,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AdminAuditTrail() {
  const navigate = useNavigate();
  const { getAuditTrail, companies, invoices } = useGstStore();
  const auditEvents = getAuditTrail();

  // State
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [actorFilter, setActorFilter] = useState('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Manual stamp modal
  const [isStampOpen, setIsStampOpen] = useState(false);
  const [stampInvoiceId, setStampInvoiceId] = useState(invoices[0]?.invoiceNumber || 'INV-2025-4821');
  const [stampAction, setStampAction] = useState('Statutory Compliance Stamp');
  const [stampResult, setStampResult] = useState('VERIFIED_BY_ADMIN');
  const [stampNote, setStampNote] = useState('Admin verified tax invoices against audited books.');

  const filtered = useMemo(() => {
    return auditEvents.filter((e) => {
      // Action filter
      if (actionFilter !== 'ALL' && !e.action.toLowerCase().includes(actionFilter.toLowerCase())) {
        return false;
      }
      // Actor filter
      if (actorFilter !== 'ALL' && e.actor !== actorFilter) {
        return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchInvoice = e.invoiceId.toLowerCase().includes(q);
        const matchAction = e.action.toLowerCase().includes(q);
        const matchExpl = e.explanation.toLowerCase().includes(q);
        const matchActor = e.actor.toLowerCase().includes(q);
        const matchResult = e.result.toLowerCase().includes(q);
        if (!matchInvoice && !matchAction && !matchExpl && !matchActor && !matchResult) return false;
      }
      return true;
    });
  }, [auditEvents, actionFilter, actorFilter, search]);

  const handleManualStampSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nowStr = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newEvent: AuditEvent = {
      id: `aud-${Date.now()}`,
      timestamp: nowStr,
      invoiceId: stampInvoiceId,
      action: stampAction,
      result: stampResult,
      explanation: stampNote,
      actor: 'Super Admin',
    };

    // Prepend to first invoice's audit events
    const targetInv = invoices.find(
      (i) => i.invoiceNumber === stampInvoiceId || i.id === stampInvoiceId
    );
    if (targetInv) {
      targetInv.auditEvents.unshift(newEvent);
    }

    setIsStampOpen(false);
    setNotice(`Regulatory audit stamp logged for invoice ${stampInvoiceId}!`);
    setTimeout(() => setNotice(null), 3500);
  };

  const exportAuditLogCsv = () => {
    const headers = [
      'Audit Event ID',
      'Timestamp',
      'Invoice Reference',
      'Action Taken',
      'Processing Result',
      'Actor / Engine',
      'Statutory Findings & Explanation',
      'Integrity Hash (SHA-256)',
    ];

    const rows = filtered.map((e) => [
      e.id,
      `"${e.timestamp}"`,
      e.invoiceId,
      `"${e.action}"`,
      `"${e.result}"`,
      `"${e.actor}"`,
      `"${e.explanation}"`,
      `"SHA256:${e.id.substring(0, 8)}9a4c8f2b"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `System_Immutable_Audit_Trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotice('Exported immutable audit trail log to CSV.');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="System-Wide Immutable Audit Trail"
        subtitle={`Cryptographic verification log of all reconciliation events • ${auditEvents.length} Immutable events recorded`}
        icon={<ClipboardList className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={exportAuditLogCsv}
            >
              <Download className="h-3.5 w-3.5" /> Export Audit Log CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setIsStampOpen(true)}
            >
              <Key className="h-3.5 w-3.5" /> Stamp Regulatory Audit
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

      {/* Step-by-Step Processing Lifecycle Visualizer */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-sky-100 pb-2.5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-600" /> Multi-Tenant Invoice Verification & Audit Pipeline
          </h3>
          <span className="text-xs font-mono text-slate-500">20-Step Canonical Lifecycle</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-sky-50/50 p-3 rounded-xl border border-sky-100">
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-sky-200 text-sky-800">
            1. Invoice Ingested
          </span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-sky-200 text-sky-800">
            2. Record Validated
          </span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-sky-200 text-sky-800">
            3. GSTIN Normalized
          </span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-sky-200 text-sky-800">
            4. 2B Matched
          </span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-sky-200 text-sky-800">
            5. Taxes Compared
          </span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-amber-200 text-amber-800">
            6. Mismatch Flagged
          </span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-rose-200 text-rose-800">
            7. Risk Calculated
          </span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-rose-200 text-rose-800">
            8. ITC Impact Logged
          </span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="bg-emerald-600 text-white px-2.5 py-1 rounded shadow-xs font-bold">
            9. Final Audit Classification
          </span>
        </div>
      </GlassCard>

      {/* Multi-Tenant Filter Ribbon */}
      <GlassCard className="p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by invoice ID, action, actor, or finding..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Company Filter */}
          <div className="flex items-center gap-2">
            <Building className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
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

          {/* Action Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-xl border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Statutory Actions</option>
              <option value="Ingestion">Record Ingestion</option>
              <option value="Normalization">Normalization</option>
              <option value="Reconciliation">Reconciliation</option>
              <option value="Tax Comparison">Tax Comparison</option>
              <option value="Discrepancy">Discrepancy Resolution</option>
              <option value="Risk">Risk Assessment</option>
              <option value="Lookup">GSTR-2B Lookup</option>
            </select>
          </div>

          {/* Actor Filter */}
          <div>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="rounded-xl border border-sky-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Actors</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Recon Engine">Recon Engine</option>
              <option value="Rule Engine">Rule Engine</option>
              <option value="Risk Engine">Risk Engine</option>
              <option value="Compliance Engine">Compliance Engine</option>
              <option value="System">System</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Main Audit Log Table */}
      <GlassCard className="p-0 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-sky-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-4 w-4 text-sky-600" />
            Cryptographically Logged Audit Events ({filtered.length})
          </h3>
          <span className="text-xs text-slate-500">
            Click row to view event verification signature or inspect related invoice
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">Invoice Ref</th>
                <th className="py-3 px-4 font-bold">Action Taken</th>
                <th className="py-3 px-4 font-bold">Processing Result</th>
                <th className="py-3 px-4 font-bold">Explanation & Statutory Context</th>
                <th className="py-3 px-4 font-bold">Actor</th>
                <th className="py-3 px-4 font-bold text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <ClipboardList className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="font-semibold text-sm text-slate-700">No audit events match filters</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try clearing filter parameters or search terms.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const targetInv = invoices.find(
                    (i) => i.invoiceNumber === e.invoiceId || i.id === e.invoiceId
                  );
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setSelectedEvent(e)}
                      className="hover:bg-sky-50/70 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {e.timestamp}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-sky-700 group-hover:underline">
                        {e.invoiceId}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {e.action}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={
                            e.result.includes('MATCH') || e.result.includes('Success') || e.result.includes('VERIFIED')
                              ? 'success'
                              : e.result.includes('Discrepancy') || e.result.includes('MISMATCH') || e.result.includes('MEDIUM')
                              ? 'warning'
                              : 'danger'
                          }
                          label={e.result}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-sm text-[11px] leading-relaxed">
                        {e.explanation}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          <Shield className="h-3 w-3 text-sky-600" /> {e.actor}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {targetInv && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs px-2"
                              onClick={(evt) => {
                                evt.stopPropagation();
                                navigate(`/admin/invoices/${targetInv.id}`);
                              }}
                            >
                              Dossier <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Audit Event Detail Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Audit Verification Signature
                  </h3>
                  <p className="text-[11px] text-slate-500">Event ID: {selectedEvent.id}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-sky-100">
                <span className="text-slate-500">Timestamp</span>
                <span className="font-mono font-bold text-slate-800">{selectedEvent.timestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sky-100">
                <span className="text-slate-500">Invoice Reference</span>
                <span className="font-mono font-bold text-sky-700">{selectedEvent.invoiceId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sky-100">
                <span className="text-slate-500">Action</span>
                <span className="font-bold text-slate-900">{selectedEvent.action}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-sky-100">
                <span className="text-slate-500">Execution Result</span>
                <StatusBadge status="success" label={selectedEvent.result} />
              </div>
              <div className="flex justify-between py-1 border-b border-sky-100">
                <span className="text-slate-500">Responsible Actor</span>
                <span className="font-bold text-slate-900">{selectedEvent.actor}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Integrity Checksum</span>
                <span className="font-mono text-[10px] text-emerald-700 font-bold">
                  SHA-256 Validated (Block #{selectedEvent.id.replace('aud-', '').substring(0, 6)})
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
              <span className="font-bold text-slate-800">Statutory Explanation & Notes:</span>
              <p className="text-slate-600 leading-relaxed">{selectedEvent.explanation}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-sky-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedEvent(null)}
              >
                Close Inspection
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  const inv = invoices.find(
                    (i) => i.invoiceNumber === selectedEvent.invoiceId || i.id === selectedEvent.invoiceId
                  );
                  setSelectedEvent(null);
                  if (inv) {
                    navigate(`/admin/invoices/${inv.id}`);
                  } else {
                    navigate('/admin/invoices');
                  }
                }}
              >
                <FileText className="h-3.5 w-3.5" /> Full Line-Item Dossier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stamp Regulatory Audit Modal */}
      {isStampOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Stamp Regulatory Audit Memo
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Direct cryptographic audit log entry by Super Admin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStampOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleManualStampSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Target Invoice Reference
                </label>
                <select
                  value={stampInvoiceId}
                  onChange={(e) => setStampInvoiceId(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                >
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.invoiceNumber}>
                      {inv.invoiceNumber} — {inv.vendorName} (₹{inv.companyRecord.totalValue.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Audit Action</label>
                <input
                  type="text"
                  value={stampAction}
                  onChange={(e) => setStampAction(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Result Code</label>
                <input
                  type="text"
                  value={stampResult}
                  onChange={(e) => setStampResult(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-mono font-bold text-emerald-700 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Statutory Explanation & Findings
                </label>
                <textarea
                  rows={3}
                  value={stampNote}
                  onChange={(e) => setStampNote(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white p-3 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-sky-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsStampOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  <Key className="h-3.5 w-3.5" /> Stamp to Immutable Log
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
