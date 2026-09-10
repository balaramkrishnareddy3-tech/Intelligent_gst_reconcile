import { useState, useRef } from 'react';
import {
  Settings,
  ShieldCheck,
  Server,
  Save,
  CheckCircle2,
  RotateCcw,
  Download,
  Upload,
  Bell,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { useGstStore } from '@/store/gstStore';

export default function AdminSettings() {
  const {
    adminSettings,
    updateAdminSettings,
    exportSystemBackupJson,
    importSystemBackupJson,
    resetData,
    invoices,
    companies,
    batches,
    getAuditTrail,
  } = useGstStore();

  const auditEvents = getAuditTrail();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State initialized from store
  const [tolerance, setTolerance] = useState(adminSettings.tolerance.toString());
  const [matchingStrategy, setMatchingStrategy] = useState(adminSettings.matchingStrategy);
  const [auditRetentionDays, setAuditRetentionDays] = useState(
    adminSettings.auditRetentionDays.toString()
  );
  const [autoReconInterval, setAutoReconInterval] = useState(adminSettings.autoReconInterval);
  const [defaultTenantPlan, setDefaultTenantPlan] = useState(adminSettings.defaultTenantPlan);
  const [sandboxMode, setSandboxMode] = useState(adminSettings.sandboxMode);
  const [alertOnCriticalRisk, setAlertOnCriticalRisk] = useState(adminSettings.alertOnCriticalRisk);
  const [alertOnBatchFailure, setAlertOnBatchFailure] = useState(adminSettings.alertOnBatchFailure);
  const [alertOnSuspendedGstin, setAlertOnSuspendedGstin] = useState(
    adminSettings.alertOnSuspendedGstin
  );
  const [platformMaintenanceMode, setPlatformMaintenanceMode] = useState(
    adminSettings.platformMaintenanceMode
  );

  // Notice state
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const tolNum = parseFloat(tolerance) || 10;
    const retDays = parseInt(auditRetentionDays, 10) || 90;

    updateAdminSettings({
      tolerance: tolNum,
      matchingStrategy,
      auditRetentionDays: retDays,
      autoReconInterval,
      defaultTenantPlan,
      sandboxMode,
      alertOnCriticalRisk,
      alertOnBatchFailure,
      alertOnSuspendedGstin,
      platformMaintenanceMode,
    });

    setFeedbackNotice('Global platform settings updated and applied to multi-tenant engine!');
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportSystemBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GST_Reconcile_Platform_Backup_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFeedbackNotice('Full platform JSON backup downloaded successfully!');
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importSystemBackupJson(content);
      if (success) {
        setFeedbackNotice('Platform database restored successfully from JSON backup!');
      } else {
        alert('Failed to parse or restore backup JSON. Please verify file schema.');
      }
      setTimeout(() => setFeedbackNotice(null), 3500);
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetToSeed = () => {
    if (
      confirm(
        'Are you sure you want to restore the platform database to default seed state? All custom records will be reset.'
      )
    ) {
      resetData();
      setTolerance('10');
      setMatchingStrategy('standard_gstr2b');
      setAuditRetentionDays('90');
      setAutoReconInterval('6h');
      setDefaultTenantPlan('Enterprise Cloud');
      setSandboxMode(true);
      setAlertOnCriticalRisk(true);
      setAlertOnBatchFailure(true);
      setAlertOnSuspendedGstin(true);
      setPlatformMaintenanceMode(false);

      setFeedbackNotice('Platform storage reset to initial enterprise demo seed state.');
      setTimeout(() => setFeedbackNotice(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Global Platform System Settings & Telemetry"
        subtitle="Configure multi-tenant reconciliation parameters, database telemetry, and statutory rule controls"
        icon={<Settings className="h-6 w-6 text-white" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadBackup}
            >
              <Download className="h-3.5 w-3.5" /> Export JSON Backup
            </Button>
            <Button
              size="sm"
              onClick={handleSaveSettings}
            >
              <Save className="h-3.5 w-3.5" /> Save Configuration
            </Button>
          </div>
        }
      />

      {/* Hidden file input for restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportBackup}
        accept=".json"
        className="hidden"
      />

      {/* Success/Action Notice */}
      {feedbackNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{feedbackNotice}</span>
        </div>
      )}

      {/* System Status Banner */}
      <div className="rounded-2xl border border-sky-200/80 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Platform Cluster Telemetry
              </h3>
              <StatusBadge status="success" label="Healthy (0 Anomalies)" />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Multi-tenant persistent cache: {companies.length} Tenants • {invoices.length} Invoices •{' '}
              {batches.length} Reconciliation Batches • {auditEvents.length} Audit Events
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">
            Last Backup: {adminSettings.lastBackupDate}
          </span>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. Engine & Matching Rules Configuration */}
          <GlassCard className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-sky-100 pb-3">
              <ShieldCheck className="h-4 w-4 text-sky-600" /> Statutory Engine Global Thresholds
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Tolerance input */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Default Value Rounding Tolerance (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={tolerance}
                    onChange={(e) => setTolerance(e.target.value)}
                    className="w-full rounded-xl border border-sky-200 bg-white py-2 pl-8 pr-3 text-xs font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Variances below this threshold are automatically verified as rounding tolerances.
                </p>
              </div>

              {/* Matching Strategy */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Statutory Matching Algorithm
                </label>
                <select
                  value={matchingStrategy}
                  onChange={(e) => setMatchingStrategy(e.target.value as any)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
                >
                  <option value="standard_gstr2b">
                    Standard GSTR-2B Statutory Statement (Recommended)
                  </option>
                  <option value="strict">Strict Zero-Error (Zero tolerance for rate deviations)</option>
                  <option value="fuzzy_flexible">
                    Fuzzy Flexible (Support partial invoice numbering match)
                  </option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Determines statutory canonical rule execution during 20-step reconciliation runs.
                </p>
              </div>

              {/* Auto Recon Interval */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Automated Reconciliation Scheduler Interval
                </label>
                <select
                  value={autoReconInterval}
                  onChange={(e) => setAutoReconInterval(e.target.value as any)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
                >
                  <option value="6h">Every 6 Hours (High Volume Enterprise)</option>
                  <option value="12h">Every 12 Hours (Twice Daily)</option>
                  <option value="24h">Daily Automated Reconciliation (Nightly Batch)</option>
                  <option value="manual">Manual Execution Only</option>
                </select>
              </div>

              {/* Default Plan for New Tenants */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Default Subscription Tier for New Tenants
                </label>
                <select
                  value={defaultTenantPlan}
                  onChange={(e) => setDefaultTenantPlan(e.target.value as any)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Enterprise Cloud">Enterprise Cloud (Unlimited runs & AI Matching)</option>
                  <option value="Enterprise Plus">Enterprise Plus</option>
                  <option value="Professional">Professional</option>
                  <option value="Starter">Starter</option>
                </select>
              </div>
            </div>
          </GlassCard>

          {/* 2. Compliance Policies & Alert Triggers */}
          <GlassCard className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-sky-100 pb-3">
              <Bell className="h-4 w-4 text-amber-600" /> Statutory Alerts & Retention Policies
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Audit Retention Policy */}
              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Cryptographic Audit Trail Retention Policy
                </label>
                <select
                  value={auditRetentionDays}
                  onChange={(e) => setAuditRetentionDays(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
                >
                  <option value="90">90 Days (Statutory Minimum)</option>
                  <option value="180">180 Days (Recommended)</option>
                  <option value="365">365 Days (Full Financial Year)</option>
                  <option value="0">Indefinite Permanent Storage (Statutory Archive)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Logs remain immutable and cryptographically hashed with SHA-256 signatures.
                </p>
              </div>

              {/* Notification Toggles */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/40">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Alert on Suspended GSTIN Detection
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Immediate alert when counterparty GSTIN is cancelled or suspended by tax department
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertOnSuspendedGstin}
                    onChange={(e) => setAlertOnSuspendedGstin(e.target.checked)}
                    className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/40">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Alert on High / Critical ITC Risk
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Dispatched when invoice credit disallowance risk exceeds ₹50,000 threshold
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertOnCriticalRisk}
                    onChange={(e) => setAlertOnCriticalRisk(e.target.checked)}
                    className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/40">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Alert on Pipeline Batch Failure
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Instant notification if a multi-tenant reconciliation batch encounters fatal schema errors
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={alertOnBatchFailure}
                    onChange={(e) => setAlertOnBatchFailure(e.target.checked)}
                    className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-sky-100 bg-sky-50/40">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Prototype Sandbox Mock Feed
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Enables simulated statutory API payloads and sample GSTR-2B data feeds
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sandboxMode}
                    onChange={(e) => setSandboxMode(e.target.checked)}
                    className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* 3. Platform Storage Backup & Seed Management Workspace */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-sky-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Server className="h-4 w-4 text-indigo-600" /> Platform Storage & Backup Workstation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Export full JSON backup, restore from file, or reset platform database to clean seed state
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDownloadBackup}
              >
                <Download className="h-3.5 w-3.5" /> Download Full JSON Backup
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" /> Restore From Backup File
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/50 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Tenant Stores</span>
              <p className="text-base font-bold text-slate-900">{companies.length} Registered Tenants</p>
              <p className="text-[11px] text-slate-500">Multi-tenant database records</p>
            </div>

            <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/50 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Reconciliation Ledgers
              </span>
              <p className="text-base font-bold text-slate-900">{invoices.length} Inward Invoices</p>
              <p className="text-[11px] text-slate-500">Cross-verified line items</p>
            </div>

            <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/50 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                Audit Trail Integrity
              </span>
              <p className="text-base font-bold text-emerald-700">
                {auditEvents.length} SHA-256 Signed Events
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">100% Cryptographic Health</p>
            </div>
          </div>

          {/* Reset Database Section */}
          <div className="pt-3 border-t border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                Reset System Database to Default Seed State
              </span>
              <span className="text-[11px] text-slate-500">
                Restores the multi-tenant database to default enterprise seed records (Acme Corp, Bharat Logistics, Apex Tools, Delta Polymers).
              </span>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleResetToSeed}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Database to Seed State
            </Button>
          </div>
        </GlassCard>

        {/* Submit Bar */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="submit"
            size="md"
          >
            <Save className="h-4 w-4" /> Save System Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
