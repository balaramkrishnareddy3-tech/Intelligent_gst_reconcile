export type ReconciliationStatus = 'MATCHED' | 'MISMATCHED' | 'MISSING' | 'DUPLICATE' | 'HIGH_RISK';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CompanyPurchaseRecord {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  totalValue: number;
  itcEligible: boolean;
  hsnCode?: string;
  pos?: string;
}

export interface GstRecord {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  totalValue: number;
  itcAvailable: boolean;
  filingDate?: string;
  returnPeriod?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  invoiceId: string;
  action: string;
  result: string;
  explanation: string;
  actor: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  vendorId: string;
  vendorName: string;
  vendorGstin: string;
  companyRecord: CompanyPurchaseRecord;
  gstRecord: GstRecord | null;
  status: ReconciliationStatus;
  mismatchFields: string[];
  taxDifference: number;
  taxableDifference: number;
  mismatchExplanation?: string;
  riskLevel: RiskLevel;
  itcRiskAmount: number;
  recommendedAction: string;
  auditEvents: AuditEvent[];
  source?: 'Seed Data' | 'Prototype Live Feed' | 'GSTN-GATEWAY' | string;
  createdAt?: string;
  liveStatus?: 'Received' | 'Processing' | 'Mismatch' | 'High Risk' | 'Matched';
}

export interface DataSourceStatus {
  key: 'purchase' | 'gstr2b' | 'gstr1' | 'einvoice' | 'eway';
  title: string;
  description: string;
  type: string;
  status: 'connected' | 'syncing' | 'stale' | 'pending';
  lastSync: string;
  recordCount: number;
  fileName?: string;
  fileSize?: string;
}

export interface VendorSummary {
  id: string;
  name: string;
  gstin: string;
  invoiceCount: number;
  matchedCount: number;
  mismatchCount: number;
  missingCount: number;
  duplicateCount: number;
  highRiskCount: number;
  matchRate: number;
  complianceScore: number;
  totalTaxClaimed: number;
  itcAtRisk: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
  trend: 'improving' | 'stable' | 'deteriorating';
  filingHistory: { period: string; gstr1: 'On-Time' | 'Late' | 'Pending'; gstr3b: 'On-Time' | 'Late' | 'Pending' }[];
}

export interface CompanyTenant {
  id: string;
  name: string;
  gstin: string;
  adminEmail: string;
  contactPerson: string;
  phone: string;
  jurisdiction: string;
  plan: 'Enterprise Cloud' | 'Enterprise Plus' | 'Professional' | 'Starter';
  status: 'active' | 'suspended' | 'pending';
  invoiceCount: number;
  matchedRate: number;
  itcClaimed: number;
  itcAtRisk: number;
  complianceScore: number;
  riskLevel: RiskLevel;
  lastReconciliation: string;
  joinedDate: string;
}

export interface ReconciliationBatch {
  id: string;
  companyId: string;
  companyName: string;
  period: string;
  totalRecords: number;
  matchedCount: number;
  mismatchCount: number;
  missingCount: number;
  duplicateCount: number;
  highRiskCount: number;
  matchRate: number;
  status: 'Completed' | 'In Progress' | 'Failed';
  durationSeconds: number;
  timestamp: string;
  rulesApplied: number;
  varianceAmount: number;
  failureReason?: string;
  logs: string[];
}

export interface AdminPlatformSettings {
  tolerance: number;
  matchingStrategy: 'strict' | 'standard_gstr2b' | 'fuzzy_flexible';
  auditRetentionDays: number;
  sandboxMode: boolean;
  autoReconInterval: 'manual' | '6h' | '12h' | '24h';
  defaultTenantPlan: 'Enterprise Cloud' | 'Enterprise Plus' | 'Professional' | 'Starter';
  alertOnCriticalRisk: boolean;
  alertOnBatchFailure: boolean;
  alertOnSuspendedGstin: boolean;
  platformMaintenanceMode: boolean;
  lastBackupDate: string;
}
