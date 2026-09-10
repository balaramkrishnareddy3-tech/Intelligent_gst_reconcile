import { Settings, Building, Bell, Save, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export default function VendorSettings() {
  const { user } = useAuthStore();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Settings & Preferences"
        subtitle="Manage business credentials, GST portal keys, and notification triggers"
        icon={<Settings className="h-6 w-6 text-white" />}
        actions={
          <Button size="sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" /> Save Preferences
          </Button>
        }
      />

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="font-bold">Preferences saved successfully!</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-sky-100 pb-3">
            <Building className="h-4 w-4 text-indigo-600" /> Supplier Organization Profile
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-500 font-semibold block mb-1">Business Trade Name</label>
              <div className="rounded-xl border border-sky-200 bg-white px-3.5 py-2 font-bold text-slate-800">
                {user?.companyName || 'Vendor Supplies Co'}
              </div>
            </div>
            <div>
              <label className="text-slate-500 font-semibold block mb-1">GSTIN</label>
              <div className="rounded-xl border border-sky-200 bg-white px-3.5 py-2 font-mono font-bold text-indigo-700">
                {user?.gstin || '29GGGGG1314R9Z6'}
              </div>
            </div>
            <div>
              <label className="text-slate-500 font-semibold block mb-1">Contact Email</label>
              <div className="rounded-xl border border-sky-200 bg-white px-3.5 py-2 font-medium text-slate-800">
                {user?.email || 'vendor@demo.com'}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Notifications */}
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-sky-100 pb-3">
            <Bell className="h-4 w-4 text-indigo-600" /> Discrepancy Alerts & Webhooks
          </h3>
          <div className="space-y-3 text-xs">
            {[
              { label: 'Instant alert when buyer flags value mismatch', desc: 'Email and portal notification' },
              { label: 'Monthly compliance score recalculation', desc: 'Summary of filing timeliness' },
              { label: 'Buyer payment hold warning', desc: 'Triggered when invoice missing in GSTR-2B' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/50"
              >
                <div>
                  <span className="font-bold text-slate-800 block">{item.label}</span>
                  <span className="text-[11px] text-slate-500">{item.desc}</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
