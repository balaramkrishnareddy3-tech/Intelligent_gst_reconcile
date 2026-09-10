import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminSafeGstStore as useGstStore } from '@/store/useAdminSafeGstStore';
import {
  Users,
  Search,
  TrendingUp,
  TrendingDown,
  Building,
  Download,
  Plus,
  ArrowRight,
  Network,
  CheckCircle2,
  X,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AdminVendors() {
  const navigate = useNavigate();
  const { getVendorsSummary } = useGstStore();
  const vendors = getVendorsSummary();

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New vendor form
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorGstin, setNewVendorGstin] = useState('');

  const filtered = vendors.filter((v) => {
    if (riskFilter !== 'ALL' && v.riskLevel !== riskFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return v.name.toLowerCase().includes(q) || v.gstin.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOnboardVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorGstin || newVendorGstin.length < 15) {
      alert('Please enter a valid 15-character GSTIN');
      return;
    }
    setIsOnboardOpen(false);
    setNewVendorName('');
    setNewVendorGstin('');
    setNotice(`Supplier ${newVendorName} registered in global counterparty network.`);
    setTimeout(() => setNotice(null), 3500);
  };

  const exportAllVendors = () => {
    const headers = [
      'Vendor ID',
      'Name',
      'GSTIN',
      'Total Invoices',
      'Statutory Match Rate (%)',
      'Mismatches Count',
      'Missing in 2B',
      'Total Tax Base (₹)',
      'ITC At Risk (₹)',
      'Compliance Score',
      'Risk Level',
      'Filing Trend',
      'Primary Risk Driver',
    ];

    const rows = vendors.map((v) => [
      v.id,
      `"${v.name}"`,
      v.gstin,
      v.invoiceCount,
      v.matchRate,
      v.mismatchCount,
      v.missingCount,
      v.totalTaxClaimed,
      v.itcAtRisk,
      v.complianceScore,
      v.riskLevel,
      v.trend,
      `"${v.riskReasons[0] || 'Clean'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Global_Counterparty_Vendors_Registry.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotice('Exported vendor registry to CSV.');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Counterparty Supplier Master Telemetry"
        subtitle={`System-wide supplier compliance registry • Tracking ${vendors.length} vendors across all client companies`}
        icon={<Users className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={exportAllVendors}
            >
              <Download className="h-3.5 w-3.5" /> Export Vendor Registry
            </Button>
            <Button size="sm" onClick={() => setIsOnboardOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Onboard Supplier
            </Button>
          </div>
        }
      />

      {/* Notification banner */}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{notice}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Monitored Vendors</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{vendors.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across all client ledgers</p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">High Risk Flagged</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            {vendors.filter((v) => v.riskLevel === 'HIGH' || v.riskLevel === 'CRITICAL').length}
          </p>
          <p className="text-[11px] text-rose-600 font-semibold mt-0.5">Statutory disallowance risk</p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Average Score</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">
            {Math.round(vendors.reduce((s, v) => s + v.complianceScore, 0) / vendors.length)}%
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Filing regularity</p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Inward Tax Base</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ₹{(vendors.reduce((s, v) => s + v.totalTaxClaimed, 0) / 100000).toFixed(2)} L
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Supplier declared GST</p>
        </GlassCard>
      </div>

      {/* Filter Ribbon */}
      <GlassCard className="p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor by name or GSTIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Risk Level:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="rounded-xl border border-sky-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-sky-500 focus:outline-none"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Vendors Table */}
      <GlassCard className="p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-3 px-4 font-bold">Vendor Name</th>
                <th className="py-3 px-4 font-bold">GSTIN</th>
                <th className="py-3 px-4 font-bold text-center">Invoices</th>
                <th className="py-3 px-4 font-bold text-center">Match Rate</th>
                <th className="py-3 px-4 font-bold text-center">Mismatches</th>
                <th className="py-3 px-4 font-bold">Compliance Score</th>
                <th className="py-3 px-4 font-bold">Risk Level</th>
                <th className="py-3 px-4 font-bold">Risk Factors</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {filtered.map((v) => (
                <tr
                  key={v.gstin}
                  onClick={() => navigate(`/admin/vendors/${v.id}`)}
                  className="hover:bg-sky-50/70 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900 group-hover:text-indigo-700 flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {v.name}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{v.gstin}</td>

                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {v.invoiceCount}
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                    {v.matchRate}%
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {v.mismatchCount > 0 ? (
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {v.mismatchCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span>{v.complianceScore} / 100</span>
                      {v.trend === 'improving' ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge
                      status={
                        v.riskLevel === 'LOW'
                          ? 'success'
                          : v.riskLevel === 'MEDIUM'
                          ? 'warning'
                          : 'danger'
                      }
                      label={`${v.riskLevel} Risk`}
                    />
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                    {v.riskReasons[0] || 'Clean filing history'}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/transaction-graph?focus=${v.name}`);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Trace in Knowledge Graph"
                      >
                        <Network className="h-3.5 w-3.5" />
                      </button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/vendors/${v.id}`);
                        }}
                      >
                        Dossier <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Onboard Supplier Modal */}
      {isOnboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-sky-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Register Counterparty Supplier</h3>
                  <p className="text-[11px] text-slate-500">Add vendor to global compliance registry</p>
                </div>
              </div>
              <button
                onClick={() => setIsOnboardOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardVendor} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Vendor Trade Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Industrial Solutions Ltd"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Supplier GSTIN (15 Digits)</label>
                <input
                  type="text"
                  placeholder="e.g. 29AAACA1234K1Z5"
                  maxLength={15}
                  value={newVendorGstin}
                  onChange={(e) => setNewVendorGstin(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 font-mono text-xs font-bold text-indigo-700 uppercase focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-sky-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsOnboardOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Register Supplier
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
