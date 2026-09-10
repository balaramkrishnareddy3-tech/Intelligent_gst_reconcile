import { useState } from 'react';
import { Settings, Building, ShieldCheck, Save, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useGstStore } from '@/store/gstStore';

export default function CompanySettings() {
  const { user } = useAuthStore();
  const { resetData } = useGstStore();

  const [tolerance, setTolerance] = useState('10');
  const [matchSource, setMatchSource] = useState('GSTR-2B');
  const [autoSync, setAutoSync] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Settings & Reconciliation Rules"
        subtitle="Manage entity tax profiles, matching parameters, and tolerance thresholds"
        icon={<Settings className="h-6 w-6 text-white" />}
        actions={
          <Button size="sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" /> Save Configuration
          </Button>
        }
      />

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="font-bold">Configuration updated and applied to reconciliation engine!</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Profile */}
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-sky-100 pb-3">
            <Building className="h-4 w-4 text-sky-600" /> Company Statutory Identity
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 font-semibold block mb-1">Company Trade Name</label>
              <div className="rounded-xl border border-sky-200 bg-white px-3.5 py-2 font-bold text-slate-800">
                {user?.companyName || 'Acme Corp India Pvt Ltd'}
              </div>
            </div>
            <div>
              <label className="text-slate-500 font-semibold block mb-1">Primary GSTIN</label>
              <div className="rounded-xl border border-sky-200 bg-white px-3.5 py-2 font-mono font-bold text-sky-800">
                {user?.gstin || '27AABCU9603R1ZM'}
              </div>
            </div>
            <div>
              <label className="text-slate-500 font-semibold block mb-1">Filing Jurisdiction</label>
              <div className="rounded-xl border border-sky-200 bg-white px-3.5 py-2 font-medium text-slate-800">
                State: 27 - Maharashtra • Division: Mumbai West
              </div>
            </div>
            <div>
              <label className="text-slate-500 font-semibold block mb-1">Authorized Finance Admin</label>
              <div className="rounded-xl border border-sky-200 bg-white px-3.5 py-2 font-medium text-slate-800">
                {user?.name} ({user?.email})
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Engine Rules & Tolerance */}
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-sky-100 pb-3">
            <ShieldCheck className="h-4 w-4 text-sky-600" /> Statutory Tolerance & Matching Engine
          </h3>
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="text-slate-600 font-semibold block mb-1">
                Value Difference Tolerance (₹ INR)
              </label>
              <input
                type="number"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                className="w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Variances below this statutory threshold are classified as rounding deviations.
              </p>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">
                Default Statutory Source
              </label>
              <select
                value={matchSource}
                onChange={(e) => setMatchSource(e.target.value)}
                className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-sky-500 focus:outline-none"
              >
                <option value="GSTR-2B">GSTR-2B (Statutory Auto-Drafted Statement - Recommended)</option>
                <option value="GSTR-2A">GSTR-2A (Dynamic Live Feed)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/50">
              <div>
                <span className="font-bold text-slate-800 block">Automatic Feed Normalization</span>
                <span className="text-[11px] text-slate-500">
                  Auto-strip invoice prefix slashes and uppercase GSTINs
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-sky-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-700 block text-xs">Reset Sample Data</span>
                <span className="text-[10px] text-slate-400">Restore default demo ledger records</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  resetData();
                  alert('Centralized dataset reset to default state.');
                }}
              >
                Reset Store
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
