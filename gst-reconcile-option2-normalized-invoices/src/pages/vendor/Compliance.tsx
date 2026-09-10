import { ShieldCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';

const filingHistory = [
  { period: 'Nov 2025', gstr1: 'Filed', gstr3b: 'Filed', date: '11-Dec-2025', status: 'success' as const },
  { period: 'Oct 2025', gstr1: 'Filed', gstr3b: 'Filed', date: '11-Nov-2025', status: 'success' as const },
  { period: 'Sep 2025', gstr1: 'Filed', gstr3b: 'Filed', date: '15-Oct-2025', status: 'success' as const },
  { period: 'Aug 2025', gstr1: 'Filed', gstr3b: 'Late', date: '18-Sep-2025', status: 'warning' as const },
  { period: 'Jul 2025', gstr1: 'Filed', gstr3b: 'Filed', date: '11-Aug-2025', status: 'success' as const },
  { period: 'Jun 2025', gstr1: 'Not Filed', gstr3b: 'Not Filed', date: '—', status: 'danger' as const },
];

export default function Compliance() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Supplier Compliance Scorecard"
        subtitle="Track your statutory return filing punctuality and credit pass-through trust rating"
        icon={<ShieldCheck className="h-6 w-6 text-white" />}
      />

      {/* Score card */}
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Compliance Score</p>
              <p className="text-2xl font-black text-emerald-700">87%</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Late Filings (FY 26)</p>
              <p className="text-2xl font-black text-amber-700">1</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Omitted Periods</p>
              <p className="text-2xl font-black text-rose-700">1</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filing history */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-sky-100">
          <h3 className="text-sm font-bold text-slate-900">Statutory Return Filing History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-3 px-4 font-bold">Return Period</th>
                <th className="py-3 px-4 font-bold">GSTR-1 Outward</th>
                <th className="py-3 px-4 font-bold">GSTR-3B Summary</th>
                <th className="py-3 px-4 font-bold">Date Filed</th>
                <th className="py-3 px-4 font-bold">Timeliness Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {filingHistory.map((f) => (
                <tr key={f.period} className="hover:bg-sky-50/60">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{f.period}</td>
                  <td className="py-3.5 px-4 text-slate-700">{f.gstr1}</td>
                  <td className="py-3.5 px-4 text-slate-700">{f.gstr3b}</td>
                  <td className="py-3.5 px-4 text-slate-500">{f.date}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge
                      status={f.status}
                      label={
                        f.status === 'success'
                          ? 'On Time'
                          : f.status === 'warning'
                          ? 'Delayed'
                          : 'Missed'
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
