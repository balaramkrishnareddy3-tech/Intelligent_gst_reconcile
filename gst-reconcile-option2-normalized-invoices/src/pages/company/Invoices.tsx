import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, RefreshCw, Search, Eye, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { fetchVendorInvoices, type BackendInvoice } from '@/services/backendApi';
import { useAuthStore } from '@/store/authStore';

function formatINR(value: number) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function statusLabel(status: string) {
  const normalized = (status || '').toUpperCase();
  if (normalized === 'MATCHED') return 'success';
  if (normalized === 'MISSING') return 'warning';
  if (normalized === 'DUPLICATE' || normalized === 'MISMATCHED' || normalized === 'HIGH_RISK') return 'danger';
  return 'neutral';
}

export default function Invoices() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<BackendInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const loadInvoices = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetchVendorInvoices(user.id);
      setInvoices(response.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load uploaded invoices.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const filteredInvoices = invoices.filter((invoice) => {
    const haystack = [
      invoice.invoice_number,
      invoice.vendor_name,
      invoice.vendor_gstin,
      invoice.status,
      invoice.source,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="All invoices uploaded from Data Sources and stored in the reconciliation backend."
        icon={<FileText className="h-6 w-6 text-white" />}
        actions={
          <Button size="sm" variant="secondary" onClick={() => void loadInvoices()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <GlassCard className="!p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total invoices</div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">{invoices.length.toLocaleString('en-IN')}</div>
        </GlassCard>
        <GlassCard className="!p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Matched</div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">
            {invoices.filter((invoice) => invoice.status === 'MATCHED').length.toLocaleString('en-IN')}
          </div>
        </GlassCard>
        <GlassCard className="!p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Exceptions</div>
          <div className="mt-2 text-2xl font-extrabold text-rose-700">
            {invoices.filter((invoice) => invoice.status !== 'MATCHED').length.toLocaleString('en-IN')}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="!p-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-sky-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Uploaded invoice records</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Live data loaded from the backend.</p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search invoice, vendor, GSTIN..."
              className="h-10 w-full rounded-lg border border-sky-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading invoices...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {invoices.length ? 'No invoices match your search.' : 'No uploaded invoices yet.'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Upload an invoice from Data Sources and return here to see it.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-sky-50/70">
                <tr className="border-b border-sky-100 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-bold">Invoice</th>
                  <th className="px-4 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold">Vendor</th>
                  <th className="px-4 py-3 font-bold">GSTIN</th>
                  <th className="px-4 py-3 text-right font-bold">Taxable</th>
                  <th className="px-4 py-3 text-right font-bold">GST</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-slate-100 hover:bg-sky-50/30">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{invoice.invoice_number || invoice.id}</div>
                      <div className="mt-0.5 text-[10px] text-slate-400">{invoice.source || 'Uploaded file'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{invoice.invoice_date || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{invoice.vendor_name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{invoice.vendor_gstin || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{formatINR(invoice.taxable_value)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{formatINR(invoice.total_gst)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={statusLabel(invoice.status) as any} label={invoice.status || 'UNKNOWN'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/company/invoice/${invoice.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
