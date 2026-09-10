import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGstStore } from '@/store/gstStore';
import {
  ClipboardList,
  Search,
  Filter,
  ArrowRight,
  Download,
  Clock,
  Shield,
  Layers,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AuditTrail() {
  const navigate = useNavigate();
  const { getAuditTrail, invoices } = useGstStore();
  const auditEvents = getAuditTrail();

  const [search, setSearch] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');

  const filteredEvents = useMemo(() => {
    return auditEvents.filter((ev) => {
      if (selectedActionFilter !== 'ALL' && !ev.action.toLowerCase().includes(selectedActionFilter.toLowerCase())) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          ev.invoiceId.toLowerCase().includes(q) ||
          ev.action.toLowerCase().includes(q) ||
          ev.explanation.toLowerCase().includes(q) ||
          ev.result.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auditEvents, selectedActionFilter, search]);

  const exportAuditCsv = () => {
    const headers = ['Timestamp', 'Invoice ID', 'Action', 'Result', 'Explanation', 'Actor'];
    const rows = filteredEvents.map((e) => [
      e.timestamp,
      e.invoiceId,
      `"${e.action}"`,
      `"${e.result}"`,
      `"${e.explanation}"`,
      e.actor,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'GST_Audit_Trail_Events.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory Audit Trail & Compliance Log"
        subtitle={`Immutable log of all invoice processing steps • ${auditEvents.length} Recorded verification events`}
        icon={<ClipboardList className="h-6 w-6 text-white" />}
        actions={
          <Button size="sm" onClick={exportAuditCsv}>
            <Download className="h-3.5 w-3.5" /> Export Audit Log
          </Button>
        }
      />

      {/* Step-by-Step Processing Lifecycle Visualizer */}
      <GlassCard className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers className="h-4 w-4 text-sky-600" /> Standard Invoice Processing Lifecycle
        </h3>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-700 bg-sky-50/50 p-3 rounded-xl border border-sky-100">
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-sky-200 text-sky-800">
            1. Invoice Uploaded
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-sky-200 text-sky-800">
            2. Record Validated
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-sky-200 text-sky-800">
            3. GSTIN Normalized
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-sky-200 text-sky-800">
            4. Invoice Matched
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-sky-200 text-sky-800">
            5. Tax Values Compared
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-amber-200 text-amber-800">
            6. Mismatch Detected
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-rose-200 text-rose-800">
            7. Risk Calculated
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="bg-white px-2.5 py-1 rounded shadow-xs border border-rose-200 text-rose-800">
            8. ITC Risk Generated
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="bg-emerald-600 text-white px-2.5 py-1 rounded shadow-xs">
            9. Final Classification
          </span>
        </div>
      </GlassCard>

      {/* Filter & Search Bar */}
      <GlassCard className="p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by invoice number, action, or explanation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Actions</option>
              <option value="Ingestion">Record Ingestion</option>
              <option value="Reconciliation">Reconciliation Engine</option>
              <option value="Tax Comparison">Tax Comparison</option>
              <option value="Risk">Risk Calculation</option>
              <option value="Lookup">GSTR-2B Lookup</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Audit Log Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-3 px-4 font-bold">Timestamp</th>
                <th className="py-3 px-4 font-bold">Invoice Reference</th>
                <th className="py-3 px-4 font-bold">Action Taken</th>
                <th className="py-3 px-4 font-bold">Processing Result</th>
                <th className="py-3 px-4 font-bold">Explanation & Statutory Context</th>
                <th className="py-3 px-4 font-bold">Actor</th>
                <th className="py-3 px-4 font-bold text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {filteredEvents.map((event) => {
                const inv = invoices.find((i) => i.id === event.invoiceId || i.invoiceNumber === event.invoiceId);
                return (
                  <tr
                    key={event.id}
                    onClick={() => {
                      if (inv) navigate(`/company/invoice/${inv.id}`);
                    }}
                    className="hover:bg-sky-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {event.timestamp}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-sky-700 group-hover:underline">
                      {event.invoiceId}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {event.action}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge
                        status={
                          event.result.includes('MATCH') || event.result.includes('Success')
                            ? 'success'
                            : event.result.includes('Discrepancy') || event.result.includes('MISMATCH')
                            ? 'warning'
                            : 'danger'
                        }
                        label={event.result}
                      />
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-sm">
                      {event.explanation}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        <Shield className="h-3 w-3 text-sky-600" /> {event.actor}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:text-sky-700">
                        Investigate <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
