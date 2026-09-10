import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';

export default function VendorDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Portal Dashboard"
        subtitle="Manage outbound invoices, monitor compliance scores, and resolve buyer mismatches"
        icon={<LayoutDashboard className="h-6 w-6 text-white" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Invoices"
          value="1,247"
          change="+28 this month"
          changeType="positive"
          icon={<FileText className="h-5 w-5" />}
          accentColor="purple"
        />
        <StatCard
          title="Mismatches"
          value="23"
          change="1.8% of total"
          changeType="negative"
          icon={<AlertTriangle className="h-5 w-5" />}
          accentColor="amber"
        />
        <StatCard
          title="Compliance Score"
          value="87%"
          change="+3% vs last quarter"
          changeType="positive"
          icon={<ShieldCheck className="h-5 w-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Open Issues"
          value="5"
          change="2 awaiting response"
          changeType="neutral"
          icon={<Clock className="h-5 w-5" />}
          accentColor="sky"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mismatch summary */}
        <GlassCard className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-sky-100 pb-3">
            Buyer Flagged Mismatches Summary
          </h3>
          <div className="space-y-2.5">
            {[
              { label: 'Taxable Amount Mismatch', count: 12, status: 'warning' as const },
              { label: 'Invoice Not Traced by Buyer Ledger', count: 6, status: 'danger' as const },
              { label: 'Invoice Date Period Mismatch', count: 3, status: 'warning' as const },
              { label: 'Buyer GSTIN Format Discrepancy', count: 2, status: 'danger' as const },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl p-3 border border-sky-100 bg-sky-50/40 hover:bg-sky-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle
                    className={`h-4 w-4 ${
                      item.status === 'danger' ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-900">{item.count}</span>
                  <StatusBadge
                    status={item.status}
                    label={item.status === 'danger' ? 'Critical' : 'Minor'}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Recent activity */}
        <GlassCard className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-sky-100 pb-3">
            Compliance Feed & Notifications
          </h3>
          <div className="space-y-3">
            {[
              {
                icon: CheckCircle2,
                text: 'Invoice INV-2025-4824 verified by Acme Corp',
                time: '2 hr ago',
                color: 'text-emerald-600',
              },
              {
                icon: AlertTriangle,
                text: 'New value variance notice on INV-2025-4822',
                time: '4 hr ago',
                color: 'text-amber-600',
              },
              {
                icon: TrendingUp,
                text: 'Quarterly compliance score upgraded to 87%',
                time: '1 day ago',
                color: 'text-indigo-600',
              },
              {
                icon: CheckCircle2,
                text: 'Buyer dispute #42 marked as resolved',
                time: '2 days ago',
                color: 'text-emerald-600',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl p-2.5 border border-sky-100/60 bg-white/60 hover:bg-sky-50 transition-colors"
              >
                <item.icon className={`mt-0.5 h-4 w-4 shrink-0 ${item.color}`} />
                <div>
                  <p className="text-xs font-medium text-slate-800">{item.text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
