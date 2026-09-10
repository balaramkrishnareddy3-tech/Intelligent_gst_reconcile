
import { useEffect, useMemo, useState } from 'react';
import { FileText, Search, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { fetchVendorInvoices, type BackendInvoice } from '@/services/backendApi';
import { useAuthStore } from '@/store/authStore';

const badgeFor = (status: string) => {
  if (status === 'MATCHED') return { status: 'success' as const, label: 'Matched' };
  if (status === 'MISMATCHED') return { status: 'warning' as const, label: 'Mismatched' };
  if (status === 'MISSING') return { status: 'danger' as const, label: 'Missing in GSTR-2B' };
  if (status === 'DUPLICATE') return { status: 'purple' as const, label: 'Duplicate' };
  if (status === 'HIGH_RISK') return { status: 'danger' as const, label: 'High Risk' };
  return { status: 'info' as const, label: status };
};

export default function VendorInvoices() {
  const { user } = useAuthStore();
  const [invoices, setInvoices] = useState<BackendInvoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchVendorInvoices(user.id);
      setInvoices(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(inv =>
      [inv.invoice_number, inv.vendor_name, inv.vendor_gstin, inv.total_value, inv.status]
        .join(' ').toLowerCase().includes(q)
    );
  }, [invoices, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outward Supplies & Invoices"
        subtitle="Invoices saved in Supabase for your vendor account"
        icon={<FileText className="h-6 w-6 text-white" />}
      />

      <GlassCard className="p-3.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              type="text"
              placeholder="Search invoice number, supplier, GSTIN, amount..."
              className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </GlassCard>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div>}

      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-3 px-4 font-bold">Invoice No.</th>
                <th className="py-3 px-4 font-bold">Date</th>
                <th className="py-3 px-4 font-bold">Supplier / Vendor</th>
                <th className="py-3 px-4 font-bold">Taxable Amount</th>
                <th className="py-3 px-4 font-bold">Tax</th>
                <th className="py-3 px-4 font-bold">Recon Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400">Loading invoices from Supabase...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-slate-400">No uploaded invoices found. Upload one from Upload Invoice.</td></tr>
              ) : filtered.map(inv => {
                const badge = badgeFor(inv.status);
                return (
                  <tr key={inv.id} className="hover:bg-sky-50/60">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{inv.invoice_number}</td>
                    <td className="py-3.5 px-4 text-slate-500">{inv.invoice_date}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inv.vendor_name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{inv.vendor_gstin}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">₹{Number(inv.taxable_value).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">₹{Number(inv.total_gst).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4"><StatusBadge status={badge.status} label={badge.label} /></td>
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
