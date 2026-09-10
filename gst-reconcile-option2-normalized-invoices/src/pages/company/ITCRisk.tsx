import { useNavigate } from 'react-router-dom';
import { useGstStore } from '@/store/gstStore';
import {
  ShieldAlert,
  IndianRupee,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function ITCRisk() {
  const navigate = useNavigate();
  const { invoices, getStats } = useGstStore();
  const stats = getStats();

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  // Risky invoices sorted by highest risk amount
  const riskyInvoices = invoices
    .filter((inv) => inv.itcRiskAmount > 0 || inv.status !== 'MATCHED')
    .sort((a, b) => b.itcRiskAmount - a.itcRiskAmount);

  // Potentially risky vs High risk breakdown
  const highRiskTotal = invoices
    .filter((i) => i.riskLevel === 'HIGH' || i.riskLevel === 'CRITICAL')
    .reduce((sum, i) => sum + i.itcRiskAmount, 0);

  const mediumRiskTotal = invoices
    .filter((i) => i.riskLevel === 'MEDIUM')
    .reduce((sum, i) => sum + i.itcRiskAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Input Tax Credit (ITC) Risk Engine"
        subtitle="Protect company cash flow • Section 16(2)(aa) & Rule 36(4) statutory compliance analysis"
        icon={<ShieldAlert className="h-6 w-6 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/company/vendor-risk')}
            >
              Analyze Vendor Risk
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/company/reports')}
            >
              Generate Risk Report
            </Button>
          </div>
        }
      />

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total ITC Claimed"
          value={formatCurrency(stats.totalItc)}
          change="Gross inward tax"
          changeType="neutral"
          icon={<IndianRupee className="h-5 w-5" />}
          accentColor="sky"
        />

        <StatCard
          title="Matched & Safe ITC"
          value={formatCurrency(stats.safeItc)}
          change={`${stats.healthRate}% statutory safe`}
          changeType="positive"
          icon={<CheckCircle2 className="h-5 w-5" />}
          accentColor="emerald"
        />

        <StatCard
          title="Potentially Risky ITC"
          value={formatCurrency(mediumRiskTotal)}
          change="Value differences"
          changeType="negative"
          icon={<AlertTriangle className="h-5 w-5" />}
          accentColor="amber"
        />

        <StatCard
          title="High / Critical Risk ITC"
          value={formatCurrency(highRiskTotal)}
          change="Statutory disallowance"
          changeType="negative"
          icon={<TrendingDown className="h-5 w-5" />}
          accentColor="rose"
        />
      </div>

      {/* Risk Breakdown Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-600" /> ITC Eligibility & Risk Classification Breakdown
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              Total Risk: {formatCurrency(stats.itcAtRisk)}
            </span>
          </div>

          <div className="space-y-3.5">
            {[
              {
                category: 'Missing in GSTR-2B Statement (Sec 16(2)(aa))',
                invoices: invoices.filter((i) => i.status === 'MISSING').length,
                amount: invoices.filter((i) => i.status === 'MISSING').reduce((s, i) => s + i.itcRiskAmount, 0),
                severity: 'CRITICAL',
                action: 'Hold ITC claim until supplier files GSTR-1 outward return',
                color: 'bg-rose-500',
              },
              {
                category: 'Vendor GSTIN Suspended or Cancelled',
                invoices: invoices.filter((i) => i.status === 'HIGH_RISK').length,
                amount: invoices.filter((i) => i.status === 'HIGH_RISK').reduce((s, i) => s + i.itcRiskAmount, 0),
                severity: 'CRITICAL',
                action: 'Strictly disallow credit; issue legal notice to supplier',
                color: 'bg-red-600',
              },
              {
                category: 'Duplicate Journal / Ledger Submission',
                invoices: invoices.filter((i) => i.status === 'DUPLICATE').length,
                amount: invoices.filter((i) => i.status === 'DUPLICATE').reduce((s, i) => s + i.itcRiskAmount, 0),
                severity: 'HIGH',
                action: 'Reversal of duplicate purchase entry in accounting books',
                color: 'bg-purple-500',
              },
              {
                category: 'Tax Rate / Value Amount Deviation',
                invoices: invoices.filter((i) => i.status === 'MISMATCHED').length,
                amount: invoices.filter((i) => i.status === 'MISMATCHED').reduce((s, i) => s + i.itcRiskAmount, 0),
                severity: 'MEDIUM',
                action: 'Claim lower amount or obtain counterparty debit/credit note',
                color: 'bg-amber-500',
              },
            ].map((row) => (
              <div
                key={row.category}
                className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                    <span className="font-bold text-slate-800">{row.category}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-4.5">{row.action}</p>
                </div>

                <div className="flex items-center gap-4 pl-4.5 sm:pl-0">
                  <div className="text-right">
                    <p className="font-mono font-bold text-rose-700">{formatCurrency(row.amount)}</p>
                    <p className="text-[10px] text-slate-400">{row.invoices} invoices</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : row.severity === 'HIGH'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {row.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Safe vs Risky Ratio Card */}
        <GlassCard className="space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">ITC Statutory Protection</h3>
            <p className="text-xs text-slate-500">
              Ratio of verified vs non-verified credit for current month GSTR-3B
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white p-5 space-y-3 shadow-md">
            <span className="text-xs uppercase font-semibold text-sky-100">Eligible Claim Ratio</span>
            <div className="text-3xl font-black">{stats.healthRate}%</div>
            <p className="text-xs text-sky-100 leading-relaxed">
              {stats.healthRate >= 90
                ? 'Excellent credit security posture. Minimal interest exposure under Section 50(3).'
                : 'Attention needed. Higher than 10% ITC exposure requires vendor intervention.'}
            </p>
          </div>

          <Button
            size="sm"
            className="w-full text-xs"
            onClick={() => navigate('/company/transaction-graph')}
          >
            Trace ITC Risk in Knowledge Graph <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </GlassCard>
      </div>

      {/* Top Risky Invoices Table - Each linking to /company/invoice/:id */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-sky-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" /> Top Risky Invoices Impacting ITC
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Prioritized by potential disallowance amount • Click row to investigate
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {riskyInvoices.length} Invoices Flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-2.5 px-3 font-semibold">Invoice No</th>
                <th className="py-2.5 px-3 font-semibold">Vendor Name</th>
                <th className="py-2.5 px-3 font-semibold">Vendor GSTIN</th>
                <th className="py-2.5 px-3 font-semibold">Claimed Tax (₹)</th>
                <th className="py-2.5 px-3 font-semibold">ITC at Risk (₹)</th>
                <th className="py-2.5 px-3 font-semibold">Risk Classification</th>
                <th className="py-2.5 px-3 font-semibold">Action Required</th>
                <th className="py-2.5 px-3 font-semibold text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {riskyInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => navigate(`/company/invoice/${inv.id}`)}
                  className="hover:bg-sky-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-sky-700 group-hover:underline">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">{inv.vendorName}</td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-500">{inv.vendorGstin}</td>
                  <td className="py-3 px-3 font-mono text-slate-800">
                    ₹{inv.companyRecord.totalGst.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-rose-600">
                    ₹{inv.itcRiskAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge
                      status={
                        inv.status === 'MISMATCHED'
                          ? 'warning'
                          : inv.status === 'MISSING'
                          ? 'danger'
                          : 'purple'
                      }
                      label={inv.status}
                    />
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs truncate">
                    {inv.recommendedAction}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 group-hover:text-sky-700">
                      Investigate <ExternalLink className="h-3 w-3" />
                    </span>
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
