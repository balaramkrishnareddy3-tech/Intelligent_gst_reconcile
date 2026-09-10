import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminSafeGstStore } from '@/store/useAdminSafeGstStore';
import { useGstStore } from '@/store/gstStore';
import { useAuthStore } from '@/store/authStore';
import {
  Building2,
  ArrowLeft,
  ShieldCheck,
  FileText,
  GitCompare,
  AlertTriangle,
  Play,
  Download,
  Edit3,
  ExternalLink,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function AdminCompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Display data (invoices, dossier fields) is redacted for Admin viewing —
  // GSTIN, email, contact person, and phone are masked; exact statutory
  // figures (CGST/SGST/IGST/taxable) are banded to the nearest ₹1,000.
  const { getCompanyById, invoices } = useAdminSafeGstStore();
  // Mutating/authenticating actions must operate on the true underlying
  // record so editing and workspace impersonation continue to function
  // correctly — only the on-screen presentation is restricted, not the
  // integrity of the data itself.
  const { updateCompany, toggleCompanyStatus, runReconciliation, isReconciling, getCompanyById: getRawCompanyById } =
    useGstStore();
  const { login } = useAuthStore();

  const company = id ? getCompanyById(id) : undefined;
  const rawCompany = id ? getRawCompanyById(id) : undefined;

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState(company?.name || '');
  const [editAdminEmail, setEditAdminEmail] = useState(company?.adminEmail || '');
  const [editContactPerson, setEditContactPerson] = useState(company?.contactPerson || '');
  const [editPhone, setEditPhone] = useState(company?.phone || '');
  const [editPlan, setEditPlan] = useState(company?.plan || 'Enterprise Cloud');
  const [editJurisdiction, setEditJurisdiction] = useState(company?.jurisdiction || '');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!company) {
    return (
      <div className="py-16 text-center space-y-4">
        <Building2 className="mx-auto h-12 w-12 text-slate-400" />
        <h2 className="text-xl font-bold text-slate-900">Company Record Not Found</h2>
        <p className="text-xs text-slate-500">
          No registered enterprise tenant matching identifier{' '}
          <code className="font-mono text-sky-600 font-bold">{id}</code> was located.
        </p>
        <Button onClick={() => navigate('/admin/companies')}>
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Companies Registry
        </Button>
      </div>
    );
  }

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany(company.id, {
      name: editName,
      adminEmail: editAdminEmail,
      contactPerson: editContactPerson,
      phone: editPhone,
      plan: editPlan as any,
      jurisdiction: editJurisdiction,
    });
    setIsEditOpen(false);
    setActionNotice('Company details updated successfully!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleRunRecon = async () => {
    await runReconciliation();
    setActionNotice(`20-step reconciliation executed for ${company.name}!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleImpersonate = async () => {
    // Uses the true (unmasked) admin email so the demo credential match still
    // succeeds — the masked email is for on-screen display only.
    const success = await login(rawCompany?.adminEmail || company.adminEmail, 'company123', 'company');
    if (success) {
      navigate('/company/dashboard');
    }
  };

  const exportCompanyDossier = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Metric,Value',
        `Company ID,${company.id}`,
        `Company Name,"${company.name}"`,
        `GSTIN,${company.gstin}`,
        `Admin Email,${company.adminEmail}`,
        `Contact Person,"${company.contactPerson}"`,
        `Phone,${company.phone}`,
        `Jurisdiction,"${company.jurisdiction}"`,
        `Subscription Plan,${company.plan}`,
        `Account Status,${company.status}`,
        `Total Invoices,${company.invoiceCount}`,
        `Match Rate,${company.matchedRate}%`,
        `ITC Claimed,₹${company.itcClaimed}`,
        `ITC At Risk,₹${company.itcAtRisk}`,
        `Compliance Score,${company.complianceScore}/100`,
        `Risk Level,${company.riskLevel}`,
        `Last Reconciliation,${company.lastReconciliation}`,
        `Registration Date,${company.joinedDate}`,
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${company.id}_Dossier_${company.gstin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setActionNotice('Exported company dossier to CSV.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`Company Dossier: ${company.name}`}
        subtitle={`Tenant ID: ${company.id} • GSTIN: ${company.gstin} • Registration Date: ${company.joinedDate}`}
        icon={<Building2 className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/admin/companies')}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All Companies
            </Button>
            <Button
              size="sm"
              disabled={isReconciling}
              loading={isReconciling}
              onClick={handleRunRecon}
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Run 20-Step Recon
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={exportCompanyDossier}
            >
              <Download className="h-3.5 w-3.5" /> Export Dossier
            </Button>
          </div>
        }
      />

      {/* Action Notice Banner */}
      {actionNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="font-bold">{actionNotice}</span>
        </div>
      )}

      {/* Top Organization Identity Card */}
      <GlassCard className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sky-100 pb-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-extrabold text-xl shadow-md">
              {company.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900">{company.name}</h2>
                <StatusBadge
                  status={company.status === 'active' ? 'success' : 'danger'}
                  label={company.status.toUpperCase()}
                />
                <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {company.plan}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                Primary GSTIN:{' '}
                <span className="font-bold text-sky-700 font-mono">{company.gstin}</span> • State Code:{' '}
                {company.gstin.substring(0, 2)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                // Pre-fill from the true record (not the masked display copy)
                // so saving the form never overwrites real data with masked
                // placeholders.
                const source = rawCompany || company;
                setEditName(source.name);
                setEditAdminEmail(source.adminEmail);
                setEditContactPerson(source.contactPerson);
                setEditPhone(source.phone);
                setEditPlan(source.plan);
                setEditJurisdiction(source.jurisdiction);
                setIsEditOpen(true);
              }}
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Profile
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                toggleCompanyStatus(company.id);
                setActionNotice(
                  `Company status toggled to ${company.status === 'active' ? 'Suspended' : 'Active'}!`
                );
                setTimeout(() => setActionNotice(null), 3000);
              }}
            >
              {company.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}
            </Button>

            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleImpersonate}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Enter Workspace
            </Button>
          </div>
        </div>

        {/* 4 Primary High-Level Stat Tiles */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Total Inward Invoices</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{company.invoiceCount} records</p>
            <p className="text-[10px] text-slate-500">Inward ledger base</p>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Statutory Match Rate</span>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">{company.matchedRate}%</p>
            <p className="text-[10px] text-emerald-600">Zero variance match</p>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">ITC at Risk Exposure</span>
            <p className="text-lg font-bold text-rose-600 mt-0.5">
              ₹{(company.itcAtRisk / 100000).toFixed(2)} L
            </p>
            <p className="text-[10px] text-rose-600">Disallowance flag</p>
          </div>

          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Compliance Score</span>
            <p className="text-lg font-bold text-sky-700 mt-0.5">
              {company.complianceScore} <span className="text-xs text-slate-400">/ 100</span>
            </p>
            <p className="text-[10px] text-slate-500">Overall tenant health</p>
          </div>
        </div>
      </GlassCard>

      {/* Two Column Detailed Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Organization Profile & Tax Jurisdiction */}
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-sky-100 pb-3">
            <Building2 className="h-4 w-4 text-sky-600" /> Statutory & Organization Contacts
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-sky-100">
              <span className="text-slate-500">Legal Business Name</span>
              <span className="font-bold text-slate-900">{company.name}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-sky-100">
              <span className="text-slate-500">GSTIN Registration</span>
              <span className="font-mono font-bold text-sky-800">{company.gstin}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-sky-100">
              <span className="text-slate-500">Tax Jurisdiction</span>
              <span className="font-semibold text-slate-800">{company.jurisdiction}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-sky-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> Admin Email
              </span>
              <span className="font-semibold text-slate-800 font-mono">{company.adminEmail}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-sky-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" /> Authorized Contact
              </span>
              <span className="font-semibold text-slate-800">
                {company.contactPerson} ({company.phone})
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Tenant Since
              </span>
              <span className="font-semibold text-slate-800">{company.joinedDate}</span>
            </div>
          </div>
        </GlassCard>

        {/* Right: Reconciliation Telemetry & Engine Health */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-emerald-600" /> Reconciliation Telemetry
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Last synced: {company.lastReconciliation}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-sky-100">
              <span className="text-slate-500">Total Claimed ITC Base</span>
              <span className="font-mono font-bold text-slate-900">
                ₹{company.itcClaimed.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-sky-100">
              <span className="text-slate-500">Statutory Verified Safe ITC</span>
              <span className="font-mono font-bold text-emerald-700">
                ₹{(company.itcClaimed - company.itcAtRisk).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-sky-100">
              <span className="text-slate-500">Disallowed / At Risk ITC</span>
              <span className="font-mono font-bold text-rose-600">
                ₹{company.itcAtRisk.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between font-semibold text-slate-600">
                <span>Verified Match Ratio</span>
                <span className="text-emerald-700 font-bold">{company.matchedRate}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${company.matchedRate}%` }}
                />
                <div
                  className="bg-rose-500 transition-all duration-500"
                  style={{ width: `${100 - company.matchedRate}%` }}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="text-xs"
                onClick={() => navigate('/admin/mismatches')}
              >
                <AlertTriangle className="h-3 w-3 text-amber-600" /> Review Mismatches
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="text-xs"
                onClick={() => navigate('/admin/itc-risk')}
              >
                <ShieldCheck className="h-3 w-3 text-rose-600" /> Review ITC Risk
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Invoices associated with this company */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-sky-600" /> Inward Supply Invoices for {company.name} ({invoices.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live ledger records verified by the 20-step reconciliation engine
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/admin/invoices')}
          >
            All Invoices <ArrowRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-2.5 px-3 font-semibold">Invoice No</th>
                <th className="py-2.5 px-3 font-semibold">Date</th>
                <th className="py-2.5 px-3 font-semibold">Supplier Name & GSTIN</th>
                <th className="py-2.5 px-3 font-semibold">Books Taxable</th>
                <th className="py-2.5 px-3 font-semibold">2B Taxable</th>
                <th className="py-2.5 px-3 font-semibold">Tax Difference</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {invoices.slice(0, 8).map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/company/invoice/${inv.id}`)}
                  className="hover:bg-sky-50/60 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-mono font-bold text-sky-700">{inv.invoiceNumber}</td>
                  <td className="py-3 px-3 text-slate-500">{inv.invoiceDate}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{inv.vendorName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{inv.vendorGstin}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">
                    ₹{inv.companyRecord.taxableValue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800">
                    {inv.gstRecord ? `₹${inv.gstRecord.taxableValue.toLocaleString('en-IN')}` : 'Missing'}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-rose-600">
                    ₹{inv.taxDifference.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge
                      status={
                        inv.status === 'MATCHED'
                          ? 'success'
                          : inv.status === 'MISMATCHED'
                          ? 'warning'
                          : inv.status === 'MISSING'
                          ? 'danger'
                          : 'purple'
                      }
                      label={inv.status}
                    />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600">
                      Investigate <ExternalLink className="h-3 w-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Cross-Module Quick Navigation */}
      <GlassCard className="p-4">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Explore Connected Artifacts for {company.name}
        </h4>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            onClick={() => navigate('/admin/transaction-graph')}
          >
            <Layers className="h-3.5 w-3.5" /> View in Knowledge Graph
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/admin/mismatches')}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> View Tenant Mismatches
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/admin/itc-risk')}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-rose-600" /> View ITC Risk Profile
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/admin/audit-trail')}
          >
            <Calendar className="h-3.5 w-3.5 text-sky-600" /> View Audit Trail Events
          </Button>
        </div>
      </GlassCard>

      {/* Edit Company Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-sky-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-sky-600" /> Edit Enterprise Tenant
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Company Legal Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Admin Email</label>
                <input
                  type="email"
                  value={editAdminEmail}
                  onChange={(e) => setEditAdminEmail(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editContactPerson}
                    onChange={(e) => setEditContactPerson(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Phone</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Jurisdiction</label>
                  <input
                    type="text"
                    value={editJurisdiction}
                    onChange={(e) => setEditJurisdiction(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Subscription Plan</label>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as any)}
                    className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="Enterprise Cloud">Enterprise Cloud</option>
                    <option value="Enterprise Plus">Enterprise Plus</option>
                    <option value="Professional">Professional</option>
                    <option value="Starter">Starter</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-sky-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
