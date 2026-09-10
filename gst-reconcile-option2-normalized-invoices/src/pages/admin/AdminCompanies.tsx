import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminSafeGstStore as useGstStore } from '@/store/useAdminSafeGstStore';
import {
  Building2,
  Search,
  ArrowRight,
  Plus,
  Play,
  Trash2,
  Power,
  X,
  CheckCircle2,
  Download,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AdminCompanies() {
  const navigate = useNavigate();
  const {
    companies,
    addCompany,
    toggleCompanyStatus,
    deleteCompany,
    runReconciliation,
    isReconciling,
  } = useGstStore();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'active' | 'suspended'>('ALL');
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Form states for new company onboarding
  const [newName, setNewName] = useState('');
  const [newGstin, setNewGstin] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newJurisdiction, setNewJurisdiction] = useState('27 - Maharashtra (Mumbai West)');
  const [newPlan, setNewPlan] = useState<'Enterprise Cloud' | 'Enterprise Plus' | 'Professional' | 'Starter'>(
    'Enterprise Cloud'
  );

  const filteredCompanies = companies.filter((c) => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.gstin.toLowerCase().includes(q) ||
        c.adminEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGstin || newGstin.length < 15) {
      alert('Please enter a valid 15-character GSTIN');
      return;
    }

    addCompany({
      name: newName,
      gstin: newGstin.toUpperCase(),
      adminEmail: newEmail,
      contactPerson: newContact,
      phone: newPhone,
      jurisdiction: newJurisdiction,
      plan: newPlan,
      status: 'active',
      invoiceCount: 24,
      matchedRate: 91.5,
      itcClaimed: 1850000,
      itcAtRisk: 154000,
      complianceScore: 89,
      riskLevel: 'LOW',
      lastReconciliation: 'Just now',
    });

    setIsOnboardOpen(false);
    setNewName('');
    setNewGstin('');
    setNewEmail('');
    setNewContact('');
    setNewPhone('');

    setNotice(`Successfully onboarded ${newName}! Active in multi-tenant system.`);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleRunReconForCompany = async (e: React.MouseEvent, compName: string) => {
    e.stopPropagation();
    await runReconciliation();
    setNotice(`Reconciliation completed for ${compName}!`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleToggleStatus = (e: React.MouseEvent, compId: string, currentStatus: string) => {
    e.stopPropagation();
    toggleCompanyStatus(compId);
    setNotice(`Company status changed to ${currentStatus === 'active' ? 'Suspended' : 'Active'}!`);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleDelete = (e: React.MouseEvent, compId: string, compName: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to remove ${compName} from the enterprise platform?`)) {
      deleteCompany(compId);
      setNotice(`Removed ${compName} from platform registry.`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const exportAllCompanies = () => {
    const headers = [
      'Company ID',
      'Name',
      'GSTIN',
      'Admin Email',
      'Contact Person',
      'Phone',
      'Jurisdiction',
      'Plan',
      'Status',
      'Invoices',
      'Match Rate (%)',
      'ITC Claimed (₹)',
      'ITC at Risk (₹)',
      'Score',
      'Risk Level',
      'Registered Date',
    ];

    const rows = companies.map((c) => [
      c.id,
      `"${c.name}"`,
      c.gstin,
      c.adminEmail,
      `"${c.contactPerson}"`,
      c.phone,
      `"${c.jurisdiction}"`,
      c.plan,
      c.status,
      c.invoiceCount,
      c.matchedRate,
      c.itcClaimed,
      c.itcAtRisk,
      c.complianceScore,
      c.riskLevel,
      c.joinedDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Registered_Enterprise_Companies_Registry.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotice('Exported company registry to CSV.');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Registered Enterprise Companies"
        subtitle="Manage client tenant organizations, GSTIN profiles, and reconciliation subscriptions"
        icon={<Building2 className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={exportAllCompanies}
            >
              <Download className="h-3.5 w-3.5" /> Export Roster
            </Button>
            <Button size="sm" onClick={() => setIsOnboardOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Onboard New Company
            </Button>
          </div>
        }
      />

      {/* Action Notification Banner */}
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{notice}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Tenants</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{companies.length}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            {companies.filter((c) => c.status === 'active').length} Active Organizations
          </p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Invoices Handled</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">
            {companies.reduce((s, c) => s + c.invoiceCount, 0)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across all client ledgers</p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Average Match Rate</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {companies.length > 0
              ? (
                  companies.reduce((s, c) => s + c.matchedRate, 0) / companies.length
                ).toFixed(1)
              : 0}
            %
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Statutory verification</p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Protected ITC</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            ₹{(companies.reduce((s, c) => s + c.itcClaimed, 0) / 100000).toFixed(2)} L
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Cumulative claims</p>
        </GlassCard>
      </div>

      {/* Search and Filter Ribbon */}
      <GlassCard className="p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search company by name, GSTIN, or admin email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-sky-50'
              }`}
            >
              All ({companies.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-emerald-50'
              }`}
            >
              Active ({companies.filter((c) => c.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterStatus('suspended')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === 'suspended'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-rose-50'
              }`}
            >
              Suspended ({companies.filter((c) => c.status === 'suspended').length})
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Interactive Companies Table */}
      <GlassCard className="p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-3 px-4 font-bold">Company Name</th>
                <th className="py-3 px-4 font-bold">GSTIN & Jurisdiction</th>
                <th className="py-3 px-4 font-bold text-center">Invoices</th>
                <th className="py-3 px-4 font-bold text-center">Match Rate</th>
                <th className="py-3 px-4 font-bold">ITC Claimed</th>
                <th className="py-3 px-4 font-bold">ITC at Risk</th>
                <th className="py-3 px-4 font-bold">Plan</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Building2 className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="font-semibold text-sm text-slate-700">No companies found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try adjusting the search query or onboarding a new company tenant.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((comp) => (
                  <tr
                    key={comp.id}
                    onClick={() => navigate(`/admin/companies/${comp.id}`)}
                    className="hover:bg-sky-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-sky-700 flex items-center gap-1.5">
                        {comp.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{comp.adminEmail}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                      <div className="font-bold text-sky-800">{comp.gstin}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{comp.jurisdiction}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {comp.invoiceCount}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-bold ${
                          comp.matchedRate >= 90
                            ? 'text-emerald-700'
                            : comp.matchedRate >= 75
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {comp.matchedRate}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      ₹{(comp.itcClaimed / 100000).toFixed(2)} L
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-rose-600">
                      ₹{(comp.itcAtRisk / 100000).toFixed(2)} L
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-[10px] bg-sky-50 text-sky-800 px-2 py-0.5 rounded border border-sky-200">
                        {comp.plan}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge
                        status={comp.status === 'active' ? 'success' : 'danger'}
                        label={comp.status.toUpperCase()}
                      />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleRunReconForCompany(e, comp.name)}
                          disabled={isReconciling}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                          title="Run 20-Step Reconciliation"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </button>

                        <button
                          onClick={(e) => handleToggleStatus(e, comp.id, comp.status)}
                          className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                            comp.status === 'active'
                              ? 'text-slate-400 hover:bg-amber-50 hover:text-amber-700'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={comp.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={(e) => handleDelete(e, comp.id, comp.name)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Company"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/companies/${comp.id}`);
                          }}
                        >
                          Dossier <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Onboard New Company Modal */}
      {isOnboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Onboard Enterprise Client</h3>
                  <p className="text-[11px] text-slate-500">Register tenant organization in platform cluster</p>
                </div>
              </div>
              <button
                onClick={() => setIsOnboardOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Company Legal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Zenith Technologies India Pvt Ltd"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Primary GSTIN (15 Digits)</label>
                <input
                  type="text"
                  placeholder="e.g. 27AAACZ1234K1Z0"
                  maxLength={15}
                  value={newGstin}
                  onChange={(e) => setNewGstin(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 font-mono text-xs font-bold text-sky-800 uppercase focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Admin Email</label>
                  <input
                    type="email"
                    placeholder="admin@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Subscription Plan</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Enterprise Cloud">Enterprise Cloud</option>
                    <option value="Enterprise Plus">Enterprise Plus</option>
                    <option value="Professional">Professional</option>
                    <option value="Starter">Starter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Tax Jurisdiction</label>
                <input
                  type="text"
                  placeholder="e.g. 27 - Maharashtra (Mumbai West)"
                  value={newJurisdiction}
                  onChange={(e) => setNewJurisdiction(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
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
                  Complete Onboarding
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
