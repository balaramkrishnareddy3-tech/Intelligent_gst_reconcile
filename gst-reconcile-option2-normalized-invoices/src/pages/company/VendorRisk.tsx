import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGstStore } from '@/store/gstStore';
import {
  Users,
  Search,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Building,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';

export default function VendorRisk() {
  const navigate = useNavigate();
  const { getVendorsSummary } = useGstStore();
  const vendors = getVendorsSummary();

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      if (riskFilter !== 'ALL' && v.riskLevel !== riskFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return v.name.toLowerCase().includes(q) || v.gstin.toLowerCase().includes(q);
      }
      return true;
    });
  }, [vendors, riskFilter, search]);

  const highRiskVendors = vendors.filter((v) => v.riskLevel === 'CRITICAL' || v.riskLevel === 'HIGH').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Compliance & Risk Scoring"
        subtitle={`Computed from verified ledger records • ${vendors.length} Total active suppliers`}
        icon={<Users className="h-6 w-6 text-white" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/company/itc-risk')}
            >
              ITC Risk Overview
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/company/reports')}
            >
              Export Compliance Sheet
            </Button>
          </div>
        }
      />

      {/* Summary metric ribbon */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Counterparties</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{vendors.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active in return period</p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">High Risk Suppliers</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{highRiskVendors}</p>
          <p className="text-[11px] text-rose-600 mt-0.5">Require credit hold</p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Average Compliance</p>
          <p className="text-2xl font-bold text-sky-700 mt-1">
            {Math.round(vendors.reduce((s, v) => s + v.complianceScore, 0) / vendors.length)}%
          </p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Filing discipline rate</p>
        </GlassCard>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase">Zero-Variance Suppliers</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {vendors.filter((v) => v.mismatchCount === 0 && v.missingCount === 0).length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">100% statutory match</p>
        </GlassCard>
      </div>

      {/* Search & Risk Filter Ribbon */}
      <GlassCard className="p-3.5">
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
            <span className="text-xs text-slate-500 font-semibold">Filter:</span>
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

      {/* Vendor Table */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sky-100 bg-sky-50/50 text-slate-600">
                <th className="py-3 px-4 font-bold">Vendor Name</th>
                <th className="py-3 px-4 font-bold">GSTIN</th>
                <th className="py-3 px-4 font-bold text-center">Invoices</th>
                <th className="py-3 px-4 font-bold text-center">Match Rate</th>
                <th className="py-3 px-4 font-bold text-center">Mismatches</th>
                <th className="py-3 px-4 font-bold text-center">Missing</th>
                <th className="py-3 px-4 font-bold">Compliance Score</th>
                <th className="py-3 px-4 font-bold">Risk Drivers & Reasons</th>
                <th className="py-3 px-4 font-bold text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100/60">
              {filteredVendors.map((vendor) => (
                <tr
                  key={vendor.gstin}
                  onClick={() => navigate(`/company/vendor-risk/${vendor.id}`)}
                  className="hover:bg-sky-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-sky-700 flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {vendor.name}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                    {vendor.gstin}
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {vendor.invoiceCount}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`font-bold ${
                        vendor.matchRate === 100
                          ? 'text-emerald-700'
                          : vendor.matchRate >= 50
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {vendor.matchRate}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {vendor.mismatchCount > 0 ? (
                      <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {vendor.mismatchCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {vendor.missingCount > 0 ? (
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {vendor.missingCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            vendor.complianceScore >= 80
                              ? 'bg-emerald-500'
                              : vendor.complianceScore >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${vendor.complianceScore}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800">{vendor.complianceScore}</span>
                      {vendor.trend === 'improving' ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      ) : vendor.trend === 'deteriorating' ? (
                        <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                      ) : null}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusBadge
                        status={
                          vendor.riskLevel === 'LOW'
                            ? 'success'
                            : vendor.riskLevel === 'MEDIUM'
                            ? 'warning'
                            : 'danger'
                        }
                        label={`${vendor.riskLevel} Risk`}
                      />
                      <span className="text-[11px] text-slate-600 line-clamp-1">
                        {vendor.riskReasons[0] || 'Clean record'}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 group-hover:text-sky-700">
                      View Profile <ArrowRight className="h-3.5 w-3.5" />
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
