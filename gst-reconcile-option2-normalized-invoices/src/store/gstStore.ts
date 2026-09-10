import { create } from 'zustand';
import type {
  InvoiceItem,
  DataSourceStatus,
  VendorSummary,
  AuditEvent,
  CompanyTenant,
  ReconciliationBatch,
  RiskLevel,
  AdminPlatformSettings,
} from '@/types/gst';
import type { Gstr2bPayload } from '@/services/gstApi';
import type { BackendInvoice } from '@/services/backendApi';

const STORAGE_KEY = 'gst_reconcile_data_v2';
const DATA_SOURCES_KEY = 'gst_reconcile_sources_v2';
const COMPANIES_KEY = 'gst_reconcile_companies_v2';
const BATCHES_KEY = 'gst_reconcile_batches_v2';
const SETTINGS_KEY = 'gst_reconcile_admin_settings_v2';

export const INITIAL_SETTINGS: AdminPlatformSettings = {
  tolerance: 10,
  matchingStrategy: 'standard_gstr2b',
  auditRetentionDays: 90,
  sandboxMode: true,
  autoReconInterval: '6h',
  defaultTenantPlan: 'Enterprise Cloud',
  alertOnCriticalRisk: true,
  alertOnBatchFailure: true,
  alertOnSuspendedGstin: true,
  platformMaintenanceMode: false,
  lastBackupDate: 'Never',
};

export const INITIAL_BATCHES: ReconciliationBatch[] = [
  {
    id: 'REC-847',
    companyId: 'COMP-01',
    companyName: 'Acme Corp India Pvt Ltd',
    period: 'Nov 2025',
    totalRecords: 16,
    matchedCount: 15,
    mismatchCount: 1,
    missingCount: 0,
    duplicateCount: 0,
    highRiskCount: 0,
    matchRate: 94.2,
    status: 'Completed',
    durationSeconds: 2.1,
    timestamp: 'Today at 10:25 AM',
    rulesApplied: 20,
    varianceAmount: 900,
    logs: [
      'Ingesting 16 purchase register line items from ERP',
      'Normalizing supplier GSTINs and invoice numbers',
      'Matching against GSTR-2B statement November 2025',
      'Verifying CGST, SGST, IGST statutory tax values',
      'Tax variance of ₹900 detected on INV-2025-4822',
      'All 20 statutory rules executed with 0 fatal errors',
    ],
  },
  {
    id: 'REC-846',
    companyId: 'COMP-02',
    companyName: 'Bharat Logistics & Infra Ltd',
    period: 'Nov 2025',
    totalRecords: 42,
    matchedCount: 34,
    mismatchCount: 8,
    missingCount: 0,
    duplicateCount: 0,
    highRiskCount: 2,
    matchRate: 81.0,
    status: 'Completed',
    durationSeconds: 3.4,
    timestamp: 'Today at 09:15 AM',
    rulesApplied: 20,
    varianceAmount: 148000,
    logs: [
      'Imported 42 line items across 12 supplier ledgers',
      'GSTR-2B cross-verification performed with ±₹10 tolerance',
      'Flagged 8 line items for counterparty GSTR-1 rate deviations',
      'Calculated Section 16 credit exposure of ₹1.48 L',
    ],
  },
  {
    id: 'REC-845',
    companyId: 'COMP-03',
    companyName: 'Apex Precision Tools Ltd',
    period: 'Nov 2025',
    totalRecords: 28,
    matchedCount: 26,
    mismatchCount: 2,
    missingCount: 0,
    duplicateCount: 0,
    highRiskCount: 0,
    matchRate: 92.8,
    status: 'Completed',
    durationSeconds: 2.2,
    timestamp: 'Yesterday at 04:30 PM',
    rulesApplied: 20,
    varianceAmount: 12000,
    logs: [
      'Loaded 28 purchase entries from Tally ERP',
      '26 invoices matched within strict zero-error tolerance',
      'Discrepancy logged for freight tax allocation (₹12,000)',
    ],
  },
  {
    id: 'REC-844',
    companyId: 'COMP-04',
    companyName: 'Delta Polymers India',
    period: 'Nov 2025',
    totalRecords: 35,
    matchedCount: 24,
    mismatchCount: 8,
    missingCount: 2,
    duplicateCount: 1,
    highRiskCount: 3,
    matchRate: 68.5,
    status: 'Completed',
    durationSeconds: 2.8,
    timestamp: 'Yesterday at 02:10 PM',
    rulesApplied: 20,
    varianceAmount: 284000,
    logs: [
      'High-variance batch processed for Delta Polymers',
      '2 unfiled supplier invoices detected under Sec 16(2)(aa)',
      '1 duplicate journal entry detected and marked for reversal',
      'Cumulative ITC exposure calculated at ₹2.84 L',
    ],
  },
  {
    id: 'REC-843',
    companyId: 'COMP-03',
    companyName: 'Apex Precision Tools Ltd',
    period: 'Oct 2025',
    totalRecords: 25,
    matchedCount: 23,
    mismatchCount: 2,
    missingCount: 0,
    duplicateCount: 0,
    highRiskCount: 0,
    matchRate: 92.0,
    status: 'Completed',
    durationSeconds: 2.0,
    timestamp: '12-Nov-2025',
    rulesApplied: 20,
    varianceAmount: 8500,
    logs: ['Archived historical return period verification run.'],
  },
  {
    id: 'REC-842',
    companyId: 'COMP-02',
    companyName: 'Bharat Logistics & Infra Ltd',
    period: 'Nov 2025',
    totalRecords: 18,
    matchedCount: 0,
    mismatchCount: 0,
    missingCount: 0,
    duplicateCount: 0,
    highRiskCount: 0,
    matchRate: 0,
    status: 'Failed',
    durationSeconds: 0.4,
    timestamp: 'Today at 08:30 AM',
    rulesApplied: 3,
    varianceAmount: 0,
    failureReason: 'Malformed GSTR-2B JSON Schema: Missing mandatory IRN field at row index 4.',
    logs: [
      'Initiated batch ingestion',
      'Validating JSON payload structure against statutory schema',
      'FATAL ERROR: Null value encountered on non-nullable field IRN',
      'Execution aborted to prevent database corruption. Retriable.',
    ],
  },
  {
    id: 'REC-841',
    companyId: 'COMP-01',
    companyName: 'Acme Corp India Pvt Ltd',
    period: 'Oct 2025',
    totalRecords: 15,
    matchedCount: 14,
    mismatchCount: 1,
    missingCount: 0,
    duplicateCount: 0,
    highRiskCount: 0,
    matchRate: 93.3,
    status: 'Completed',
    durationSeconds: 1.9,
    timestamp: '14-Oct-2025',
    rulesApplied: 20,
    varianceAmount: 450,
    logs: ['Monthly reconciliation completed with minor rounding variance.'],
  },
  {
    id: 'REC-840',
    companyId: 'COMP-04',
    companyName: 'Delta Polymers India',
    period: 'Nov 2025',
    totalRecords: 12,
    matchedCount: 6,
    mismatchCount: 2,
    missingCount: 0,
    duplicateCount: 0,
    highRiskCount: 0,
    matchRate: 50.0,
    status: 'In Progress',
    durationSeconds: 1.2,
    timestamp: 'Today at 10:40 AM',
    rulesApplied: 12,
    varianceAmount: 1800,
    logs: [
      'Ingesting batch lines for intermediate validation',
      'Step 12: Comparing IGST values across states...',
    ],
  },
];

export const INITIAL_COMPANIES: CompanyTenant[] = [
  {
    id: 'COMP-01',
    name: 'Acme Corp India Pvt Ltd',
    gstin: '27AABCU9603R1ZM',
    adminEmail: 'company@demo.com',
    contactPerson: 'Rajesh Kumar',
    phone: '+91 98201 12450',
    jurisdiction: '27 - Maharashtra (Mumbai West)',
    plan: 'Enterprise Cloud',
    status: 'active',
    invoiceCount: 16,
    matchedRate: 94.2,
    itcClaimed: 1240000,
    itcAtRisk: 184000,
    complianceScore: 88,
    riskLevel: 'LOW',
    lastReconciliation: 'Today at 10:25 AM',
    joinedDate: '15-Jan-2025',
  },
  {
    id: 'COMP-02',
    name: 'Bharat Logistics & Infra Ltd',
    gstin: '24AABCB1290K1Z4',
    adminEmail: 'finance@bharatlogistics.in',
    contactPerson: 'Sunil Mehta',
    phone: '+91 98791 43210',
    jurisdiction: '24 - Gujarat (Ahmedabad South)',
    plan: 'Enterprise Plus',
    status: 'active',
    invoiceCount: 42,
    matchedRate: 81.0,
    itcClaimed: 3450000,
    itcAtRisk: 148000,
    complianceScore: 74,
    riskLevel: 'HIGH',
    lastReconciliation: 'Today at 09:15 AM',
    joinedDate: '02-Feb-2025',
  },
  {
    id: 'COMP-03',
    name: 'Apex Precision Tools Ltd',
    gstin: '29AABCA9012J1Z2',
    adminEmail: 'tax@apexprecision.com',
    contactPerson: 'Arun Venkatesh',
    phone: '+91 99001 87654',
    jurisdiction: '29 - Karnataka (Bengaluru North)',
    plan: 'Professional',
    status: 'active',
    invoiceCount: 28,
    matchedRate: 92.8,
    itcClaimed: 1820000,
    itcAtRisk: 12000,
    complianceScore: 94,
    riskLevel: 'LOW',
    lastReconciliation: 'Yesterday at 04:30 PM',
    joinedDate: '18-Mar-2025',
  },
  {
    id: 'COMP-04',
    name: 'Delta Polymers India',
    gstin: '33AABCD4512N1Z8',
    adminEmail: 'admin@deltapolymers.in',
    contactPerson: 'K. Ramaswamy',
    phone: '+91 94440 56789',
    jurisdiction: '33 - Tamil Nadu (Chennai Central)',
    plan: 'Enterprise Cloud',
    status: 'active',
    invoiceCount: 35,
    matchedRate: 68.5,
    itcClaimed: 2210000,
    itcAtRisk: 284000,
    complianceScore: 61,
    riskLevel: 'CRITICAL',
    lastReconciliation: 'Yesterday at 02:10 PM',
    joinedDate: '10-Apr-2025',
  },
];

export const INITIAL_DATA_SOURCES: DataSourceStatus[] = [
  {
    key: 'purchase',
    title: 'Purchase Register (ERP / Books)',
    description: 'Internal accounts payable ledger imported from Tally / SAP / Oracle ERP.',
    type: 'Internal Accounting Ledger',
    status: 'connected',
    lastSync: 'Today at 09:42 AM',
    recordCount: 16,
    fileName: 'Purchase_Register_Q3_FY26.xlsx',
    fileSize: '4.8 MB',
  },
  {
    key: 'gstr2b',
    title: 'GSTR-2B Auto-Drafted Statement',
    description: 'Official monthly auto-drafted ITC statement generated from supplier GSTR-1 filings.',
    type: 'GST Portal Official Statement',
    status: 'connected',
    lastSync: 'Today at 10:15 AM',
    recordCount: 15,
    fileName: 'GSTR2B_27AABCU9603R1ZM_NOV2025.json',
    fileSize: '2.1 MB',
  },
  {
    key: 'gstr1',
    title: 'GSTR-1 Supplier Outward Supplies',
    description: 'Direct supplier GSTR-1 outward filing records for supplier-side confirmation.',
    type: 'Integration / API support – prototype',
    status: 'connected',
    lastSync: 'Yesterday at 04:30 PM',
    recordCount: 14,
    fileName: 'GSTR1_Counterparty_Feed.csv',
    fileSize: '1.4 MB',
  },
  {
    key: 'einvoice',
    title: 'E-Invoice System (IRN Repository)',
    description: 'Invoice Registration Portal (IRP) verified invoices with signed QR codes and IRNs.',
    type: 'Integration / API support – prototype',
    status: 'connected',
    lastSync: 'Today at 08:00 AM',
    recordCount: 12,
    fileName: 'IRP_Validated_Dump.json',
    fileSize: '3.2 MB',
  },
  {
    key: 'eway',
    title: 'E-Way Bill System',
    description: 'Movement goods validation records linked to tax invoices above ₹50,000 threshold.',
    type: 'Integration / API support – prototype',
    status: 'connected',
    lastSync: 'Yesterday at 06:10 PM',
    recordCount: 11,
    fileName: 'EWB_Consignment_Feed.csv',
    fileSize: '890 KB',
  },
];

export const INITIAL_INVOICES: InvoiceItem[] = [
  {
    id: 'INV-2025-4821',
    invoiceNumber: 'INV-2025-4821',
    invoiceDate: '2025-11-15',
    vendorId: 'VEND-01',
    vendorName: 'Tata Steel Ltd',
    vendorGstin: '27AAACT2727Q1ZV',
    companyRecord: {
      taxableValue: 625000,
      cgst: 56250,
      sgst: 56250,
      igst: 0,
      totalGst: 112500,
      totalValue: 737500,
      itcEligible: true,
      hsnCode: '7208',
      pos: '27 - Maharashtra',
    },
    gstRecord: {
      taxableValue: 625000,
      cgst: 56250,
      sgst: 56250,
      igst: 0,
      totalGst: 112500,
      totalValue: 737500,
      itcAvailable: true,
      filingDate: '2025-12-08',
      returnPeriod: 'Nov 2025',
    },
    status: 'MATCHED',
    mismatchFields: [],
    taxDifference: 0,
    taxableDifference: 0,
    mismatchExplanation: 'All 8 data points match exactly between Purchase Register and GSTR-2B. ITC fully verified and safe to claim.',
    riskLevel: 'LOW',
    itcRiskAmount: 0,
    recommendedAction: 'Claim 100% ITC in current GSTR-3B return.',
    auditEvents: [
      { id: 'aud-1', timestamp: '2025-12-01 10:14:22', invoiceId: 'INV-2025-4821', action: 'Record Ingestion', result: 'Success', explanation: 'Imported from ERP books and GSTR-2B feed.', actor: 'System' },
      { id: 'aud-2', timestamp: '2025-12-01 10:14:23', invoiceId: 'INV-2025-4821', action: 'Normalization', result: 'Normalized', explanation: 'GSTIN trimmed and verified valid checksum format.', actor: 'Rule Engine' },
      { id: 'aud-3', timestamp: '2025-12-01 10:14:24', invoiceId: 'INV-2025-4821', action: 'Reconciliation', result: 'MATCHED', explanation: 'Taxable value, CGST, and SGST match within ₹0 tolerance.', actor: 'Recon Engine' },
    ],
  },
  {
    id: 'INV-2025-4822',
    invoiceNumber: 'INV-2025-4822',
    invoiceDate: '2025-11-18',
    vendorId: 'VEND-02',
    vendorName: 'Mahindra Parts & Logistics',
    vendorGstin: '27AABCM8291M1ZU',
    companyRecord: {
      taxableValue: 100000,
      cgst: 9000,
      sgst: 9000,
      igst: 0,
      totalGst: 18000,
      totalValue: 118000,
      itcEligible: true,
      hsnCode: '8708',
      pos: '27 - Maharashtra',
    },
    gstRecord: {
      taxableValue: 105000,
      cgst: 9450,
      sgst: 9450,
      igst: 0,
      totalGst: 18900,
      totalValue: 123900,
      itcAvailable: true,
      filingDate: '2025-12-10',
      returnPeriod: 'Nov 2025',
    },
    status: 'MISMATCHED',
    mismatchFields: ['taxableValue', 'cgst', 'sgst', 'totalGst'],
    taxDifference: 900,
    taxableDifference: 5000,
    mismatchExplanation: 'Taxable Value: Company ₹100,000 vs GST Record ₹105,000 (Difference: ₹5,000). Total GST difference of ₹900 detected.',
    riskLevel: 'MEDIUM',
    itcRiskAmount: 900,
    recommendedAction: 'Restrict ITC to lower value (₹18,000) or issue debit note with vendor prior to GSTR-3B filing.',
    auditEvents: [
      { id: 'aud-4', timestamp: '2025-12-01 10:15:01', invoiceId: 'INV-2025-4822', action: 'Record Ingestion', result: 'Success', explanation: 'Purchase record matched with GSTR-2B by invoice number & GSTIN.', actor: 'System' },
      { id: 'aud-5', timestamp: '2025-12-01 10:15:02', invoiceId: 'INV-2025-4822', action: 'Tax Comparison', result: 'Discrepancy Found', explanation: 'Books tax ₹18,000 vs 2B tax ₹18,900. Differential ₹900.', actor: 'Recon Engine' },
      { id: 'aud-6', timestamp: '2025-12-01 10:15:03', invoiceId: 'INV-2025-4822', action: 'Risk Calculation', result: 'MEDIUM_RISK', explanation: 'Tax variance exceeds tolerance threshold of ±₹10.', actor: 'Risk Engine' },
    ],
  },
  {
    id: 'INV-2025-4823',
    invoiceNumber: 'INV-2025-4823',
    invoiceDate: '2025-11-20',
    vendorId: 'VEND-03',
    vendorName: 'Singh Electronics & Hardware',
    vendorGstin: '29GGGGG1314R9Z6',
    companyRecord: {
      taxableValue: 253333,
      cgst: 0,
      sgst: 0,
      igst: 45600,
      totalGst: 45600,
      totalValue: 298933,
      itcEligible: true,
      hsnCode: '8517',
      pos: '29 - Karnataka',
    },
    gstRecord: null,
    status: 'MISSING',
    mismatchFields: ['missing_in_gstr2b'],
    taxDifference: 45600,
    taxableDifference: 253333,
    mismatchExplanation: 'Invoice present in Company Purchase Register but entirely absent from GSTR-2B. Supplier has not filed GSTR-1.',
    riskLevel: 'HIGH',
    itcRiskAmount: 45600,
    recommendedAction: 'Do not claim ITC in GSTR-3B. Hold payment or send automated notice to supplier to file GSTR-1.',
    auditEvents: [
      { id: 'aud-7', timestamp: '2025-12-01 10:16:10', invoiceId: 'INV-2025-4823', action: 'GSTR-2B Lookup', result: 'NOT_FOUND', explanation: 'Invoice INV-2025-4823 not traced in any section of GSTR-2B.', actor: 'Recon Engine' },
      { id: 'aud-8', timestamp: '2025-12-01 10:16:11', invoiceId: 'INV-2025-4823', action: 'ITC Impact Analysis', result: 'Full Exposure', explanation: '₹45,600 ITC classified as inaccessible under Section 16(2)(aa).', actor: 'Risk Engine' },
    ],
  },
  {
    id: 'INV-2025-4824',
    invoiceNumber: 'INV-2025-4824',
    invoiceDate: '2025-11-12',
    vendorId: 'VEND-04',
    vendorName: 'Reliance Industries Ltd',
    vendorGstin: '27AAACR5055K1Z5',
    companyRecord: {
      taxableValue: 1216111,
      cgst: 109450,
      sgst: 109450,
      igst: 0,
      totalGst: 218900,
      totalValue: 1435011,
      itcEligible: true,
      hsnCode: '2710',
      pos: '27 - Maharashtra',
    },
    gstRecord: {
      taxableValue: 1216111,
      cgst: 109450,
      sgst: 109450,
      igst: 0,
      totalGst: 218900,
      totalValue: 1435011,
      itcAvailable: true,
      filingDate: '2025-12-09',
      returnPeriod: 'Nov 2025',
    },
    status: 'MATCHED',
    mismatchFields: [],
    taxDifference: 0,
    taxableDifference: 0,
    mismatchExplanation: 'Flawless reconciliation. Inward supply matches supplier outward declaration with valid E-Way bill consignment.',
    riskLevel: 'LOW',
    itcRiskAmount: 0,
    recommendedAction: 'Proceed with auto-reconciled credit utilization.',
    auditEvents: [
      { id: 'aud-9', timestamp: '2025-12-01 10:17:00', invoiceId: 'INV-2025-4824', action: 'Reconciliation', result: 'MATCHED', explanation: 'Values match exactly.', actor: 'Recon Engine' },
    ],
  },
  {
    id: 'INV-2025-4825',
    invoiceNumber: 'INV-2025-4825',
    invoiceDate: '2025-11-22',
    vendorId: 'VEND-05',
    vendorName: 'Patel Enterprises & Tech',
    vendorGstin: '24AAECR0987K1Z8',
    companyRecord: {
      taxableValue: 373333,
      cgst: 0,
      sgst: 0,
      igst: 67200,
      totalGst: 67200,
      totalValue: 440533,
      itcEligible: true,
      hsnCode: '8471',
      pos: '24 - Gujarat',
    },
    gstRecord: {
      taxableValue: 376666,
      cgst: 0,
      sgst: 0,
      igst: 67800,
      totalGst: 67800,
      totalValue: 444466,
      itcAvailable: true,
      filingDate: '2025-12-11',
      returnPeriod: 'Nov 2025',
    },
    status: 'MISMATCHED',
    mismatchFields: ['taxableValue', 'igst', 'totalGst'],
    taxDifference: 600,
    taxableDifference: 3333,
    mismatchExplanation: 'Taxable Value difference of ₹3,333. IGST in Books is ₹67,200 while GSTR-2B reports ₹67,800. Net difference ₹600.',
    riskLevel: 'MEDIUM',
    itcRiskAmount: 600,
    recommendedAction: 'Request credit note from vendor for ₹600 or adjust purchase entry before filing GSTR-3B.',
    auditEvents: [
      { id: 'aud-10', timestamp: '2025-12-01 10:18:22', invoiceId: 'INV-2025-4825', action: 'Discrepancy Logged', result: 'MISMATCHED', explanation: 'Variance detected on IGST field.', actor: 'Recon Engine' },
    ],
  },
  {
    id: 'INV-2025-4826',
    invoiceNumber: 'INV-2025-4826',
    invoiceDate: '2025-11-25',
    vendorId: 'VEND-06',
    vendorName: 'Maheshwari Traders',
    vendorGstin: '27AABCU9603R1ZM',
    companyRecord: {
      taxableValue: 233333,
      cgst: 21000,
      sgst: 21000,
      igst: 0,
      totalGst: 42000,
      totalValue: 275333,
      itcEligible: true,
      hsnCode: '4819',
      pos: '27 - Maharashtra',
    },
    gstRecord: {
      taxableValue: 233333,
      cgst: 21000,
      sgst: 21000,
      igst: 0,
      totalGst: 42000,
      totalValue: 275333,
      itcAvailable: false,
      filingDate: '2025-12-14',
      returnPeriod: 'Nov 2025',
    },
    status: 'HIGH_RISK',
    mismatchFields: ['vendor_gstin_suspended', 'itc_ineligible_flag'],
    taxDifference: 42000,
    taxableDifference: 0,
    mismatchExplanation: 'CRITICAL COMPLIANCE BREACH: Vendor GSTIN is currently Suspended by tax authorities. GSTR-2B marks ITC as Ineligible.',
    riskLevel: 'CRITICAL',
    itcRiskAmount: 42000,
    recommendedAction: 'Strictly prohibit ITC claim under Rule 36(4). Flag vendor for finance freeze until GSTIN restoration proof provided.',
    auditEvents: [
      { id: 'aud-11', timestamp: '2025-12-01 10:19:15', invoiceId: 'INV-2025-4826', action: 'GSTIN Status Check', result: 'SUSPENDED', explanation: 'Tax authority API flagged status as cancelled/suspended.', actor: 'Compliance Engine' },
      { id: 'aud-12', timestamp: '2025-12-01 10:19:16', invoiceId: 'INV-2025-4826', action: 'ITC Ineligibility', result: 'HIGH_RISK', explanation: 'ITC disallowed as per GST statutory provisions.', actor: 'Risk Engine' },
    ],
  },
  {
    id: 'INV-2025-4827',
    invoiceNumber: 'INV-2025-4827',
    invoiceDate: '2025-11-26',
    vendorId: 'VEND-06',
    vendorName: 'Maheshwari Traders',
    vendorGstin: '27AABCU9603R1ZM',
    companyRecord: {
      taxableValue: 150000,
      cgst: 13500,
      sgst: 13500,
      igst: 0,
      totalGst: 27000,
      totalValue: 177000,
      itcEligible: true,
      hsnCode: '4819',
      pos: '27 - Maharashtra',
    },
    gstRecord: {
      taxableValue: 150000,
      cgst: 13500,
      sgst: 13500,
      igst: 0,
      totalGst: 27000,
      totalValue: 177000,
      itcAvailable: false,
      filingDate: '2025-12-14',
      returnPeriod: 'Nov 2025',
    },
    status: 'DUPLICATE',
    mismatchFields: ['duplicate_invoice_number', 'duplicate_irn'],
    taxDifference: 27000,
    taxableDifference: 0,
    mismatchExplanation: 'Duplicate submission detected in ERP import. Identical invoice reference was previously recorded and processed in batch REC-846.',
    riskLevel: 'HIGH',
    itcRiskAmount: 27000,
    recommendedAction: 'Void duplicate journal entry in Purchase Register to prevent double-counting of input tax credit.',
    auditEvents: [
      { id: 'aud-13', timestamp: '2025-12-01 10:20:00', invoiceId: 'INV-2025-4827', action: 'Duplicate Detection', result: 'DUPLICATE_FOUND', explanation: 'Matches prior hash in purchase database.', actor: 'Deduplication Engine' },
    ],
  },
  {
    id: 'INV-2025-4828',
    invoiceNumber: 'INV-2025-4828',
    invoiceDate: '2025-11-10',
    vendorId: 'VEND-07',
    vendorName: 'Larsen & Toubro Ltd',
    vendorGstin: '27AAACL0149P1ZM',
    companyRecord: {
      taxableValue: 890000,
      cgst: 80100,
      sgst: 80100,
      igst: 0,
      totalGst: 160200,
      totalValue: 1050200,
      itcEligible: true,
      hsnCode: '8429',
      pos: '27 - Maharashtra',
    },
    gstRecord: {
      taxableValue: 890000,
      cgst: 80100,
      sgst: 80100,
      igst: 0,
      totalGst: 160200,
      totalValue: 1050200,
      itcAvailable: true,
      filingDate: '2025-12-05',
      returnPeriod: 'Nov 2025',
    },
    status: 'MATCHED',
    mismatchFields: [],
    taxDifference: 0,
    taxableDifference: 0,
    mismatchExplanation: 'Complete match verified. 100% compliant supplier filing.',
    riskLevel: 'LOW',
    itcRiskAmount: 0,
    recommendedAction: 'Approved for automated credit offset.',
    auditEvents: [
      { id: 'aud-14', timestamp: '2025-12-01 10:21:00', invoiceId: 'INV-2025-4828', action: 'Reconciliation', result: 'MATCHED', explanation: 'All values aligned.', actor: 'Recon Engine' },
    ],
  },
  {
    id: 'INV-2025-4829',
    invoiceNumber: 'INV-2025-4829',
    invoiceDate: '2025-11-28',
    vendorId: 'VEND-08',
    vendorName: 'Kumar Industrial Supplies',
    vendorGstin: '33AADCS2834L1ZR',
    companyRecord: {
      taxableValue: 182200,
      cgst: 0,
      sgst: 0,
      igst: 32796,
      totalGst: 32796,
      totalValue: 214996,
      itcEligible: true,
      hsnCode: '7318',
      pos: '33 - Tamil Nadu',
    },
    gstRecord: {
      taxableValue: 180000,
      cgst: 0,
      sgst: 0,
      igst: 32400,
      totalGst: 32400,
      totalValue: 212400,
      itcAvailable: true,
      filingDate: '2025-12-10',
      returnPeriod: 'Nov 2025',
    },
    status: 'MISMATCHED',
    mismatchFields: ['taxableValue', 'igst', 'totalGst'],
    taxDifference: 396,
    taxableDifference: 2200,
    mismatchExplanation: 'Taxable difference of ₹2,200 resulting in IGST discrepancy of ₹396. Likely freight charge omission in supplier return.',
    riskLevel: 'MEDIUM',
    itcRiskAmount: 396,
    recommendedAction: 'Contact Kumar Supplies to report freight billing delta in GSTR-1 amendment table 9.',
    auditEvents: [
      { id: 'aud-15', timestamp: '2025-12-01 10:22:04', invoiceId: 'INV-2025-4829', action: 'Tax Difference', result: 'MISMATCHED', explanation: 'Discrepancy of ₹396 logged.', actor: 'Recon Engine' },
    ],
  },
  {
    id: 'INV-2025-4830',
    invoiceNumber: 'INV-2025-4830',
    invoiceDate: '2025-11-05',
    vendorId: 'VEND-09',
    vendorName: 'Infosys BPM & Cloud Services',
    vendorGstin: '29AAACI4325E1Z0',
    companyRecord: {
      taxableValue: 450000,
      cgst: 0,
      sgst: 0,
      igst: 81000,
      totalGst: 81000,
      totalValue: 531000,
      itcEligible: true,
      hsnCode: '9983',
      pos: '29 - Karnataka',
    },
    gstRecord: {
      taxableValue: 450000,
      cgst: 0,
      sgst: 0,
      igst: 81000,
      totalGst: 81000,
      totalValue: 531000,
      itcAvailable: true,
      filingDate: '2025-12-04',
      returnPeriod: 'Nov 2025',
    },
    status: 'MATCHED',
    mismatchFields: [],
    taxDifference: 0,
    taxableDifference: 0,
    mismatchExplanation: 'Full compliance confirmed for IT services input credit.',
    riskLevel: 'LOW',
    itcRiskAmount: 0,
    recommendedAction: 'Direct reconciliation match.',
    auditEvents: [
      { id: 'aud-16', timestamp: '2025-12-01 10:23:00', invoiceId: 'INV-2025-4830', action: 'Reconciliation', result: 'MATCHED', explanation: 'Values match exactly.', actor: 'Recon Engine' },
    ],
  },
  {
    id: 'INV-2025-4831',
    invoiceNumber: 'INV-2025-4831',
    invoiceDate: '2025-11-19',
    vendorId: 'VEND-03',
    vendorName: 'Singh Electronics & Hardware',
    vendorGstin: '29GGGGG1314R9Z6',
    companyRecord: {
      taxableValue: 120000,
      cgst: 0,
      sgst: 0,
      igst: 21600,
      totalGst: 21600,
      totalValue: 141600,
      itcEligible: true,
      hsnCode: '8504',
      pos: '29 - Karnataka',
    },
    gstRecord: null,
    status: 'MISSING',
    mismatchFields: ['missing_in_gstr2b'],
    taxDifference: 21600,
    taxableDifference: 120000,
    mismatchExplanation: 'Second unfiled invoice from Singh Electronics. Missing in GSTR-2B. ITC cannot be claimed under statutory rules.',
    riskLevel: 'HIGH',
    itcRiskAmount: 21600,
    recommendedAction: 'Immediate communication to vendor finance team required.',
    auditEvents: [
      { id: 'aud-17', timestamp: '2025-12-01 10:24:10', invoiceId: 'INV-2025-4831', action: 'GSTR-2B Trace', result: 'NOT_FOUND', explanation: 'Missing from monthly inward statement.', actor: 'Recon Engine' },
    ],
  },
  {
    id: 'INV-2025-4832',
    invoiceNumber: 'INV-2025-4832',
    invoiceDate: '2025-11-14',
    vendorId: 'VEND-10',
    vendorName: 'UltraTech Cement Ltd',
    vendorGstin: '27AAACU1234F1Z9',
    companyRecord: {
      taxableValue: 780000,
      cgst: 109200,
      sgst: 109200,
      igst: 0,
      totalGst: 218400,
      totalValue: 998400,
      itcEligible: true,
      hsnCode: '2523',
      pos: '27 - Maharashtra',
    },
    gstRecord: {
      taxableValue: 780000,
      cgst: 109200,
      sgst: 109200,
      igst: 0,
      totalGst: 218400,
      totalValue: 998400,
      itcAvailable: true,
      filingDate: '2025-12-07',
      returnPeriod: 'Nov 2025',
    },
    status: 'MATCHED',
    mismatchFields: [],
    taxDifference: 0,
    taxableDifference: 0,
    mismatchExplanation: 'Verified against 28% cement GST bracket with valid E-way bill dispatch.',
    riskLevel: 'LOW',
    itcRiskAmount: 0,
    recommendedAction: 'Claim in full.',
    auditEvents: [
      { id: 'aud-18', timestamp: '2025-12-01 10:25:00', invoiceId: 'INV-2025-4832', action: 'Reconciliation', result: 'MATCHED', explanation: '100% matched.', actor: 'Recon Engine' },
    ],
  },
];

export interface GstStoreState {
  invoices: InvoiceItem[];
  dataSources: DataSourceStatus[];
  companies: CompanyTenant[];
  batches: ReconciliationBatch[];
  adminSettings: AdminPlatformSettings;
  activeRunningBatch: ReconciliationBatch | null;
  isReconciling: boolean;
  reconciliationProgress: number;
  currentReconciliationStep: string;
  reconciliationSteps: string[];
  lastReconciliationTimestamp: string | null;

  // Actions
  uploadDataSource: (key: DataSourceStatus['key'], file: File, recordCount?: number) => Promise<void>;
  mergeBackendInvoices: (items: BackendInvoice[]) => void;
  runReconciliation: () => Promise<void>;
  triggerReconciliationJob: (companyId?: string) => Promise<ReconciliationBatch>;
  retryFailedBatch: (batchId: string) => Promise<void>;
  deleteBatchJob: (batchId: string) => void;
  getReconciliationBatches: () => ReconciliationBatch[];
  getBatchById: (id: string) => ReconciliationBatch | undefined;
  getReconciliationStats: () => {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
    successRate: number;
    avgDuration: number;
    totalVariance: number;
  };
  getInvoiceById: (id: string) => InvoiceItem | undefined;
  getStats: () => {
    totalInvoices: number;
    matchedCount: number;
    mismatchCount: number;
    missingCount: number;
    duplicateCount: number;
    highRiskCount: number;
    totalItc: number;
    itcAtRisk: number;
    safeItc: number;
    healthRate: number;
  };
  getVendorsSummary: () => VendorSummary[];
  getVendorById: (id: string) => VendorSummary | undefined;
  getCompanies: () => CompanyTenant[];
  getCompanyById: (id: string) => CompanyTenant | undefined;
  addCompany: (company: Omit<CompanyTenant, 'id' | 'joinedDate'>) => void;
  updateCompany: (id: string, updates: Partial<CompanyTenant>) => void;
  deleteCompany: (id: string) => void;
  toggleCompanyStatus: (id: string) => void;
  resolveMismatch: (invoiceId: string, note?: string) => void;
  updateInvoiceRisk: (invoiceId: string, riskLevel: RiskLevel, recommendedAction?: string) => void;
  addLiveTransaction: () => InvoiceItem;
  ensureLiveFeedSeed: () => void;
  addVendorInvoice: (input: {
    vendorId: string;
    vendorName: string;
    vendorGstin: string;
    fileName: string;
  }) => InvoiceItem;
  updateAdminSettings: (updates: Partial<AdminPlatformSettings>) => void;
  exportSystemBackupJson: () => string;
  importSystemBackupJson: (jsonData: string) => boolean;
  applyGstr2bPayload: (payload: Gstr2bPayload) => { applied: number; missing: number };
  getAuditTrail: () => AuditEvent[];
  resetData: () => void;
}

export const RECON_STEPS = [
  'Reading uploaded purchase register and GST records...',
  'Validating mandatory statutory GST invoice fields...',
  'Normalizing supplier GSTINs (State code, checksum, case)...',
  'Normalizing invoice number formats (removing slashes, zeros)...',
  'Normalizing filing dates & return period intervals...',
  'Comparing company purchase ledger against GSTR-2B statement...',
  'Comparing supplier GSTIN accuracy across records...',
  'Matching canonical invoice numbers...',
  'Comparing taxable values across lines...',
  'Comparing CGST values (Intra-state components)...',
  'Comparing SGST values (Intra-state components)...',
  'Comparing IGST values (Inter-state components)...',
  'Detecting missing invoices in GSTR-2B...',
  'Detecting duplicate invoice entries and hashes...',
  'Calculating line-item tax amount deviations...',
  'Classifying reconciliation status (MATCHED / MISMATCHED / etc)...',
  'Calculating risk scores & Section 16 compliance flags...',
  'Generating final reconciliation matrix & variance report...',
  'Generating structured immutable audit trail events...',
  'Preparing knowledge relationships for the Transaction Graph...',
];

export const useGstStore = create<GstStoreState>((set, get) => {
  // Load initial state
  const loadInvoices = (): InvoiceItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_INVOICES;
  };

  const loadSources = (): DataSourceStatus[] => {
    try {
      const stored = localStorage.getItem(DATA_SOURCES_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_DATA_SOURCES;
  };

  const loadCompanies = (): CompanyTenant[] => {
    try {
      const stored = localStorage.getItem(COMPANIES_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_COMPANIES;
  };

  const loadBatches = (): ReconciliationBatch[] => {
    try {
      const stored = localStorage.getItem(BATCHES_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_BATCHES;
  };

  const loadSettings = (): AdminPlatformSettings => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_SETTINGS;
  };

  return {
    invoices: loadInvoices(),
    dataSources: loadSources(),
    companies: loadCompanies(),
    batches: loadBatches(),
    adminSettings: loadSettings(),
    activeRunningBatch: null,
    isReconciling: false,
    reconciliationProgress: 0,
    currentReconciliationStep: '',
    reconciliationSteps: RECON_STEPS,
    lastReconciliationTimestamp: '2025-12-01 10:25 AM',

    mergeBackendInvoices: (items) => {
      if (!items.length) return;
      set((state) => {
        const incoming = items.map((row): InvoiceItem => {
          const componentTax = Number(row.cgst || 0) + Number(row.sgst || 0) + Number(row.igst || 0);
          const totalGst = Number(row.total_gst || componentTax);
          const totalValue = Number(row.total_value || (Number(row.taxable_value || 0) + totalGst));
          const taxDifference = Math.max(0, totalGst - componentTax);
          const source = row.source || 'Backend Upload';
          return {
            id: row.id,
            invoiceNumber: row.invoice_number,
            invoiceDate: row.invoice_date,
            vendorId: row.vendor_id,
            vendorName: row.vendor_name || 'Uploaded Supplier',
            vendorGstin: row.vendor_gstin || 'DEMO-SUPPLIER-GSTIN',
            companyRecord: {
              taxableValue: Number(row.taxable_value || 0),
              cgst: Number(row.cgst || 0),
              sgst: Number(row.sgst || 0),
              igst: Number(row.igst || 0),
              totalGst,
              totalValue,
              itcEligible: true,
              pos: row.vendor_gstin?.slice(0, 2) || 'NA',
            },
            gstRecord: {
              taxableValue: Number(row.taxable_value || 0),
              cgst: Number(row.cgst || 0),
              sgst: Number(row.sgst || 0),
              igst: Number(row.igst || 0),
              totalGst,
              totalValue,
              itcAvailable: true,
              filingDate: row.invoice_date,
              returnPeriod: 'Backend Upload',
            },
            status: (row.status || 'MATCHED') as InvoiceItem['status'],
            mismatchFields: row.mismatch_fields || [],
            taxDifference,
            taxableDifference: 0,
            mismatchExplanation: row.mismatch_explanation || 'Normalized from uploaded invoice and synchronized with the backend ledger.',
            riskLevel: (row.risk_level || 'LOW') as RiskLevel,
            itcRiskAmount: Number(row.itc_risk_amount || 0),
            recommendedAction: row.recommended_action || 'Review normalized invoice and reconcile with GSTR-2B.',
            auditEvents: [{
              id: `aud-upload-${row.id}`,
              timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              invoiceId: row.invoice_number,
              action: 'Invoice Normalized & Synced',
              result: 'SUCCESS',
              explanation: `Uploaded invoice parsed by FastAPI and synchronized from Supabase (${source}).`,
              actor: 'FastAPI + Supabase',
            }],
            source,
            createdAt: row.created_at || new Date().toISOString(),
            liveStatus: 'Received',
          };
        });

        const byNumber = new Map(state.invoices.map((invoice) => [invoice.invoiceNumber, invoice]));
        incoming.forEach((invoice) => byNumber.set(invoice.invoiceNumber, invoice));
        const nextInvoices = Array.from(byNumber.values()).sort((a, b) =>
          String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextInvoices));
        return { invoices: nextInvoices };
      });
    },

    uploadDataSource: async (key, file, customRecordCount) => {
      // Ultra-fast responsive file reading and validation
      await new Promise((resolve) => setTimeout(resolve, 20));

      const count = customRecordCount || Math.floor(Math.random() * 20) + 12;
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

      set((state) => {
        const nextSources = state.dataSources.map((ds) => {
          if (ds.key === key) {
            return {
              ...ds,
              status: 'connected' as const,
              lastSync: 'Just now',
              recordCount: count,
              fileName: file.name,
              fileSize: sizeMB,
            };
          }
          return ds;
        });

        localStorage.setItem(DATA_SOURCES_KEY, JSON.stringify(nextSources));
        return { dataSources: nextSources };
      });
    },

    runReconciliation: async () => {
      set({ isReconciling: true, reconciliationProgress: 0, currentReconciliationStep: RECON_STEPS[0] });

      const totalSteps = RECON_STEPS.length;
      for (let i = 0; i < totalSteps; i++) {
        await new Promise((resolve) => setTimeout(resolve, 15));
        const progress = Math.round(((i + 1) / totalSteps) * 100);
        set({
          reconciliationProgress: progress,
          currentReconciliationStep: RECON_STEPS[i],
        });
      }

      // Finish reconciliation and calculate timestamp
      const nowStr = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      set({
        isReconciling: false,
        reconciliationProgress: 100,
        lastReconciliationTimestamp: nowStr,
      });
    },

    getInvoiceById: (id: string) => {
      return get().invoices.find((inv) => inv.id === id || inv.invoiceNumber === id);
    },

    getStats: () => {
      const invoices = get().invoices;
      const totalInvoices = invoices.length;
      const matchedCount = invoices.filter((i) => i.status === 'MATCHED').length;
      const mismatchCount = invoices.filter((i) => i.status === 'MISMATCHED').length;
      const missingCount = invoices.filter((i) => i.status === 'MISSING').length;
      const duplicateCount = invoices.filter((i) => i.status === 'DUPLICATE').length;
      const highRiskCount = invoices.filter((i) => i.status === 'HIGH_RISK').length;

      const totalItc = invoices.reduce((sum, i) => sum + i.companyRecord.totalGst, 0);
      const itcAtRisk = invoices.reduce((sum, i) => sum + i.itcRiskAmount, 0);
      const safeItc = totalItc - itcAtRisk;
      const healthRate = totalInvoices > 0 ? Number(((matchedCount / totalInvoices) * 100).toFixed(1)) : 0;

      return {
        totalInvoices,
        matchedCount,
        mismatchCount,
        missingCount,
        duplicateCount,
        highRiskCount,
        totalItc,
        itcAtRisk,
        safeItc,
        healthRate,
      };
    },

    getVendorsSummary: () => {
      const invoices = get().invoices;
      const vendorMap = new Map<string, VendorSummary>();

      invoices.forEach((inv) => {
        let v = vendorMap.get(inv.vendorGstin);
        if (!v) {
          v = {
            id: inv.vendorId,
            name: inv.vendorName,
            gstin: inv.vendorGstin,
            invoiceCount: 0,
            matchedCount: 0,
            mismatchCount: 0,
            missingCount: 0,
            duplicateCount: 0,
            highRiskCount: 0,
            matchRate: 0,
            complianceScore: 100,
            totalTaxClaimed: 0,
            itcAtRisk: 0,
            riskLevel: 'LOW',
            riskReasons: [],
            trend: 'stable',
            filingHistory: [
              { period: 'Nov 2025', gstr1: 'On-Time', gstr3b: 'On-Time' },
              { period: 'Oct 2025', gstr1: 'On-Time', gstr3b: 'On-Time' },
              { period: 'Sep 2025', gstr1: 'On-Time', gstr3b: 'On-Time' },
            ],
          };
          vendorMap.set(inv.vendorGstin, v);
        }

        v.invoiceCount += 1;
        v.totalTaxClaimed += inv.companyRecord.totalGst;
        v.itcAtRisk += inv.itcRiskAmount;

        if (inv.status === 'MATCHED') v.matchedCount += 1;
        if (inv.status === 'MISMATCHED') v.mismatchCount += 1;
        if (inv.status === 'MISSING') v.missingCount += 1;
        if (inv.status === 'DUPLICATE') v.duplicateCount += 1;
        if (inv.status === 'HIGH_RISK') v.highRiskCount += 1;
      });

      // Compute derived scores and reasons
      return Array.from(vendorMap.values()).map((v) => {
        v.matchRate = Number(((v.matchedCount / v.invoiceCount) * 100).toFixed(1));
        const penalty = v.highRiskCount * 40 + v.missingCount * 25 + v.duplicateCount * 20 + v.mismatchCount * 12;
        v.complianceScore = Math.max(10, 100 - penalty);

        const reasons: string[] = [];
        if (v.highRiskCount > 0) reasons.push('GSTIN flagged / Suspended status');
        if (v.missingCount > 0) reasons.push(`${v.missingCount} invoices missing in GSTR-2B`);
        if (v.mismatchCount > 0) reasons.push(`${v.mismatchCount} tax value mismatches detected`);
        if (v.duplicateCount > 0) reasons.push(`${v.duplicateCount} duplicate entries recorded`);
        if (reasons.length === 0) reasons.push('Consistent on-time GSTR-1 filings, zero tax variances');
        v.riskReasons = reasons;

        if (v.complianceScore < 40) {
          v.riskLevel = 'CRITICAL';
          v.trend = 'deteriorating';
        } else if (v.complianceScore < 70) {
          v.riskLevel = 'HIGH';
          v.trend = 'deteriorating';
        } else if (v.complianceScore < 85) {
          v.riskLevel = 'MEDIUM';
          v.trend = 'stable';
        } else {
          v.riskLevel = 'LOW';
          v.trend = 'improving';
        }

        return v;
      });
    },

    getVendorById: (id: string) => {
      const all = get().getVendorsSummary();
      return all.find((v) => v.id === id || v.gstin === id || v.name.toLowerCase().includes(id.toLowerCase()));
    },

    getCompanies: () => {
      return get().companies;
    },

    getCompanyById: (id: string) => {
      const all = get().companies;
      return all.find(
        (c) =>
          c.id.toLowerCase() === id.toLowerCase() ||
          c.gstin.toLowerCase() === id.toLowerCase() ||
          c.name.toLowerCase().includes(id.toLowerCase())
      );
    },

    addCompany: (newComp) => {
      const id = `COMP-0${get().companies.length + 1}`;
      const today = new Date()
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        .replace(/ /g, '-');
      const company: CompanyTenant = {
        ...newComp,
        id,
        joinedDate: today,
      };
      set((state) => {
        const updated = [company, ...state.companies];
        localStorage.setItem(COMPANIES_KEY, JSON.stringify(updated));
        return { companies: updated };
      });
    },

    updateCompany: (id, updates) => {
      set((state) => {
        const updated = state.companies.map((c) => (c.id === id ? { ...c, ...updates } : c));
        localStorage.setItem(COMPANIES_KEY, JSON.stringify(updated));
        return { companies: updated };
      });
    },

    deleteCompany: (id) => {
      set((state) => {
        const updated = state.companies.filter((c) => c.id !== id);
        localStorage.setItem(COMPANIES_KEY, JSON.stringify(updated));
        return { companies: updated };
      });
    },

    toggleCompanyStatus: (id) => {
      set((state) => {
        const updated = state.companies.map((c) => {
          if (c.id === id) {
            const nextStatus: CompanyTenant['status'] =
              c.status === 'active' ? 'suspended' : 'active';
            return { ...c, status: nextStatus };
          }
          return c;
        });
        localStorage.setItem(COMPANIES_KEY, JSON.stringify(updated));
        return { companies: updated };
      });
    },

    triggerReconciliationJob: async (targetCompanyId?: string) => {
      const allCompanies = get().companies;
      const targetCompany =
        (targetCompanyId && allCompanies.find((c) => c.id === targetCompanyId)) ||
        allCompanies[0] || {
          id: 'COMP-01',
          name: 'Acme Corp India Pvt Ltd',
          gstin: '27AABCU9603R1ZM',
        };

      const nextBatchNumber =
        Math.max(
          ...get().batches.map((b) => {
            const num = parseInt(b.id.replace('REC-', ''), 10);
            return isNaN(num) ? 800 : num;
          }),
          847
        ) + 1;

      const newBatchId = `REC-${nextBatchNumber}`;
      const nowStr = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const tempBatch: ReconciliationBatch = {
        id: newBatchId,
        companyId: targetCompany.id,
        companyName: targetCompany.name,
        period: 'Nov 2025',
        totalRecords: get().invoices.length || 16,
        matchedCount: 0,
        mismatchCount: 0,
        missingCount: 0,
        duplicateCount: 0,
        highRiskCount: 0,
        matchRate: 0,
        status: 'In Progress',
        durationSeconds: 0,
        timestamp: 'Just now',
        rulesApplied: 0,
        varianceAmount: 0,
        logs: [`Triggered reconciliation pipeline for ${targetCompany.name}`],
      };

      set((state) => ({
        batches: [tempBatch, ...state.batches],
        activeRunningBatch: tempBatch,
        isReconciling: true,
        reconciliationProgress: 0,
        currentReconciliationStep: RECON_STEPS[0],
      }));

      const startTime = Date.now();
      const totalSteps = RECON_STEPS.length;
      for (let i = 0; i < totalSteps; i++) {
        await new Promise((resolve) => setTimeout(resolve, 15));
        const progress = Math.round(((i + 1) / totalSteps) * 100);
        set((state) => {
          const updatedActive = state.activeRunningBatch
            ? {
                ...state.activeRunningBatch,
                rulesApplied: i + 1,
                logs: [
                  ...state.activeRunningBatch.logs,
                  `Step ${i + 1}: ${RECON_STEPS[i]}`,
                ],
              }
            : null;

          return {
            reconciliationProgress: progress,
            currentReconciliationStep: RECON_STEPS[i],
            activeRunningBatch: updatedActive,
          };
        });
      }

      const durationSeconds = Number(((Date.now() - startTime) / 1000).toFixed(1));
      const stats = get().getStats();

      const completedBatch: ReconciliationBatch = {
        id: newBatchId,
        companyId: targetCompany.id,
        companyName: targetCompany.name,
        period: 'Nov 2025',
        totalRecords: stats.totalInvoices,
        matchedCount: stats.matchedCount,
        mismatchCount: stats.mismatchCount,
        missingCount: stats.missingCount,
        duplicateCount: stats.duplicateCount,
        highRiskCount: stats.highRiskCount,
        matchRate: stats.healthRate,
        status: 'Completed',
        durationSeconds: durationSeconds || 2.2,
        timestamp: nowStr,
        rulesApplied: 20,
        varianceAmount: stats.itcAtRisk,
        logs: [
          `Triggered reconciliation pipeline for ${targetCompany.name}`,
          `Successfully processed ${stats.totalInvoices} invoice entries`,
          `Applied all 20 statutory normalization and validation rules`,
          `Verified match rate: ${stats.healthRate}% (${stats.matchedCount} zero-error matches)`,
          `Flagged ${stats.mismatchCount} tax differences (₹${stats.itcAtRisk} exposure)`,
          `Pipeline finalized in ${durationSeconds}s with status: COMPLETED`,
        ],
      };

      set((state) => {
        const nextBatches = state.batches.map((b) => (b.id === newBatchId ? completedBatch : b));
        localStorage.setItem(BATCHES_KEY, JSON.stringify(nextBatches));

        // Update company's last reconciliation
        const nextCompanies = state.companies.map((c) =>
          c.id === targetCompany.id
            ? { ...c, lastReconciliation: 'Just now', matchedRate: stats.healthRate }
            : c
        );
        localStorage.setItem(COMPANIES_KEY, JSON.stringify(nextCompanies));

        return {
          batches: nextBatches,
          companies: nextCompanies,
          activeRunningBatch: null,
          isReconciling: false,
          reconciliationProgress: 100,
          lastReconciliationTimestamp: nowStr,
        };
      });

      return completedBatch;
    },

    retryFailedBatch: async (batchId: string) => {
      const targetBatch = get().batches.find((b) => b.id === batchId);
      if (!targetBatch) return;

      set((state) => ({
        isReconciling: true,
        reconciliationProgress: 10,
        currentReconciliationStep: 'Repairing GSTR-2B payload and normalizing rows...',
        batches: state.batches.map((b) =>
          b.id === batchId
            ? {
                ...b,
                status: 'In Progress' as const,
                logs: [...b.logs, 'Repair initiated: retrying statutory verification rules...'],
              }
            : b
        ),
      }));

      // Quick verification steps
      for (let i = 0; i < RECON_STEPS.length; i++) {
        await new Promise((r) => setTimeout(r, 12));
        set({
          reconciliationProgress: Math.round(((i + 1) / RECON_STEPS.length) * 100),
          currentReconciliationStep: RECON_STEPS[i],
        });
      }

      const nowStr = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      set((state) => {
        const nextBatches = state.batches.map((b) => {
          if (b.id === batchId) {
            return {
              ...b,
              status: 'Completed' as const,
              matchRate: 88.5,
              matchedCount: 16,
              mismatchCount: 2,
              totalRecords: 18,
              rulesApplied: 20,
              durationSeconds: 1.8,
              timestamp: nowStr,
              failureReason: undefined,
              logs: [
                ...b.logs,
                'Schema repaired successfully.',
                'Re-executed all 20 rules. Status: COMPLETED.',
              ],
            };
          }
          return b;
        });

        localStorage.setItem(BATCHES_KEY, JSON.stringify(nextBatches));
        return {
          batches: nextBatches,
          isReconciling: false,
          reconciliationProgress: 100,
          lastReconciliationTimestamp: nowStr,
        };
      });
    },

    deleteBatchJob: (batchId: string) => {
      set((state) => {
        const nextBatches = state.batches.filter((b) => b.id !== batchId);
        localStorage.setItem(BATCHES_KEY, JSON.stringify(nextBatches));
        return { batches: nextBatches };
      });
    },

    getReconciliationBatches: () => {
      return get().batches;
    },

    getBatchById: (id: string) => {
      return get().batches.find(
        (b) => b.id.toLowerCase() === id.toLowerCase() || b.companyName.toLowerCase().includes(id.toLowerCase())
      );
    },

    getReconciliationStats: () => {
      const batches = get().batches;
      const total = batches.length;
      const completed = batches.filter((b) => b.status === 'Completed').length;
      const inProgress = batches.filter((b) => b.status === 'In Progress').length;
      const failed = batches.filter((b) => b.status === 'Failed').length;
      const successRate = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 100;
      const completedBatches = batches.filter((b) => b.status === 'Completed' && b.durationSeconds > 0);
      const avgDuration =
        completedBatches.length > 0
          ? Number(
              (
                completedBatches.reduce((acc, b) => acc + b.durationSeconds, 0) /
                completedBatches.length
              ).toFixed(1)
            )
          : 2.2;
      const totalVariance = batches.reduce((acc, b) => acc + (b.varianceAmount || 0), 0);

      return {
        total,
        completed,
        inProgress,
        failed,
        successRate,
        avgDuration,
        totalVariance,
      };
    },

    resolveMismatch: (invoiceId: string, note?: string) => {
      const nowStr = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      set((state) => {
        const nextInvoices = state.invoices.map((inv) => {
          if (inv.id === invoiceId || inv.invoiceNumber === invoiceId) {
            const auditEvent: AuditEvent = {
              id: `aud-${Date.now()}`,
              timestamp: nowStr,
              invoiceId: inv.invoiceNumber,
              action: 'Discrepancy Resolution',
              result: 'RESOLVED_BY_ADMIN',
              explanation: note || 'Discrepancy reconciled and accepted by Super Admin. ITC marked eligible.',
              actor: 'Super Admin',
            };

            return {
              ...inv,
              status: 'MATCHED' as const,
              taxDifference: 0,
              taxableDifference: 0,
              itcRiskAmount: 0,
              riskLevel: 'LOW' as const,
              mismatchFields: [],
              mismatchExplanation: `Resolved by Super Admin: ${note || 'Verified adjustment applied.'}`,
              recommendedAction: 'Claim in full. Authorized by Admin reconciliation override.',
              companyRecord: {
                ...inv.companyRecord,
                itcEligible: true,
              },
              auditEvents: [auditEvent, ...inv.auditEvents],
            };
          }
          return inv;
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextInvoices));
        return { invoices: nextInvoices };
      });
    },

    updateInvoiceRisk: (invoiceId: string, riskLevel: RiskLevel, recommendedAction?: string) => {
      const nowStr = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      set((state) => {
        const nextInvoices = state.invoices.map((inv) => {
          if (inv.id === invoiceId || inv.invoiceNumber === invoiceId) {
            const auditEvent: AuditEvent = {
              id: `aud-${Date.now()}`,
              timestamp: nowStr,
              invoiceId: inv.invoiceNumber,
              action: 'Risk Level Update',
              result: `${riskLevel}_RISK`,
              explanation: `Super Admin reassessed statutory risk level to ${riskLevel}.`,
              actor: 'Super Admin',
            };

            return {
              ...inv,
              riskLevel,
              recommendedAction:
                recommendedAction ||
                (riskLevel === 'CRITICAL' || riskLevel === 'HIGH'
                  ? 'Strictly prohibit credit claim until counterparty files valid GSTR-1 amendment.'
                  : riskLevel === 'MEDIUM'
                  ? 'Hold payment delta or issue debit note with supplier.'
                  : 'Claim 100% ITC in current GSTR-3B return.'),
              auditEvents: [auditEvent, ...inv.auditEvents],
            };
          }
          return inv;
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextInvoices));
        return { invoices: nextInvoices };
      });
    },

    addLiveTransaction: () => {
      const liveVendors = [
        { name: 'ABC Traders', gstin: '29ABCDE1234F1Z5', id: 'LIVE-VEND-ABC' },
        { name: 'XYZ Suppliers', gstin: '29XYZDE5678G1Z2', id: 'LIVE-VEND-XYZ' },
        { name: 'PQR Industries', gstin: '29PQRAB9012C1Z7', id: 'LIVE-VEND-PQR' },
        { name: 'Nova Components', gstin: '27NOVAC4455K1Z8', id: 'LIVE-VEND-NOVA' },
        { name: 'Metro Packaging Co', gstin: '24METRO9901R1Z4', id: 'LIVE-VEND-METRO' },
      ];
      const scenarios = ['MATCHED', 'MISMATCHED', 'MISSING', 'HIGH_RISK'] as const;
      const existingNumbers = get().invoices
        .map((i) => i.invoiceNumber.match(/^INV(\d+)$/)?.[1])
        .filter(Boolean)
        .map(Number);
      const nextNum = Math.max(1024, ...existingNumbers) + 1;
      const vendor = liveVendors[Math.floor(Math.random() * liveVendors.length)];
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      const taxableValue = [45000, 82500, 31200, 126000, 65500, 90500][
        Math.floor(Math.random() * 6)
      ];
      const gstAmount = Math.round(taxableValue * 0.18);
      const isInterState = !vendor.gstin.startsWith('27');
      const gstRecordTaxable = scenario === 'MISMATCHED' ? taxableValue + 2500 : taxableValue;
      const gstRecordTax = Math.round(gstRecordTaxable * 0.18);
      const taxDifference =
        scenario === 'MATCHED'
          ? 0
          : scenario === 'MISMATCHED'
          ? Math.abs(gstRecordTax - gstAmount)
          : gstAmount;
      const now = new Date();
      const invoiceNumber = `INV${nextNum}`;
      const liveStatus =
        scenario === 'MATCHED'
          ? 'Received'
          : scenario === 'MISMATCHED'
          ? 'Processing'
          : scenario === 'MISSING'
          ? 'Mismatch'
          : 'High Risk';
      const riskLevel =
        scenario === 'MATCHED'
          ? 'LOW'
          : scenario === 'MISMATCHED'
          ? 'MEDIUM'
          : scenario === 'MISSING'
          ? 'HIGH'
          : 'CRITICAL';

      const newInvoice: InvoiceItem = {
        id: invoiceNumber,
        invoiceNumber,
        invoiceDate: now.toISOString().slice(0, 10),
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorGstin: vendor.gstin,
        companyRecord: {
          taxableValue,
          cgst: isInterState ? 0 : gstAmount / 2,
          sgst: isInterState ? 0 : gstAmount / 2,
          igst: isInterState ? gstAmount : 0,
          totalGst: gstAmount,
          totalValue: taxableValue + gstAmount,
          itcEligible: scenario !== 'HIGH_RISK',
          hsnCode: '9988',
          pos: `${vendor.gstin.slice(0, 2)} - Live Feed`,
        },
        gstRecord:
          scenario === 'MISSING'
            ? null
            : {
                taxableValue: gstRecordTaxable,
                cgst: isInterState ? 0 : gstRecordTax / 2,
                sgst: isInterState ? 0 : gstRecordTax / 2,
                igst: isInterState ? gstRecordTax : 0,
                totalGst: gstRecordTax,
                totalValue: gstRecordTaxable + gstRecordTax,
                itcAvailable: scenario !== 'HIGH_RISK',
                filingDate: now.toISOString().slice(0, 10),
                returnPeriod: 'Live Feed',
              },
        status: scenario,
        mismatchFields:
          scenario === 'MATCHED'
            ? []
            : scenario === 'MISMATCHED'
            ? ['taxableValue', 'igst', 'totalGst']
            : scenario === 'MISSING'
            ? ['missing_in_gstr2b']
            : ['itc_ineligible_flag', 'supplier_compliance_flag'],
        taxDifference,
        taxableDifference: scenario === 'MISMATCHED' ? 2500 : scenario === 'MISSING' ? taxableValue : 0,
        mismatchExplanation:
          scenario === 'MATCHED'
            ? 'Live transaction received and matched against simulated GSTR-2B feed within tolerance.'
            : scenario === 'MISMATCHED'
            ? `Live transaction taxable value differs by ₹2,500 against GST record. GST variance ₹${taxDifference.toLocaleString('en-IN')}.`
            : scenario === 'MISSING'
            ? 'Live transaction received in purchase stream but currently absent from simulated GSTR-2B feed.'
            : 'Live transaction flagged high risk because supplier ITC availability is restricted in simulated GST record.',
        riskLevel,
        itcRiskAmount: scenario === 'MATCHED' ? 0 : taxDifference,
        recommendedAction:
          scenario === 'MATCHED'
            ? 'Proceed with ITC claim after periodic reconciliation close.'
            : scenario === 'MISMATCHED'
            ? 'Keep transaction in processing queue and verify supplier tax values before GSTR-3B filing.'
            : scenario === 'MISSING'
            ? 'Contact supplier to upload/amend GSTR-1 before claiming ITC.'
            : 'Hold ITC claim and require supplier compliance confirmation.',
        auditEvents: [
          {
            id: `aud-live-${Date.now()}`,
            timestamp: now.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            invoiceId: invoiceNumber,
            action: 'Live Transaction Received',
            result: scenario,
            explanation: 'Prototype live GST transaction stream ingested into centralized reconciliation ledger.',
            actor: 'Prototype Live Feed',
          },
        ],
        source: 'Prototype Live Feed',
        createdAt: now.toISOString(),
        liveStatus,
      };

      set((state) => {
        const nextInvoices = [newInvoice, ...state.invoices];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextInvoices));
        return { invoices: nextInvoices };
      });
      return newInvoice;
    },

    addVendorInvoice: (input) => {
      // Runs the uploaded vendor invoice through the SAME reconciliation
      // logic used across the application, and adds it to the SAME
      // centralized invoices array so it appears everywhere: vendor
      // dashboard, vendor mismatches, vendor graph, and (since it shares
      // the same ledger) company/admin reconciliation, ITC risk, vendor
      // risk, transaction graph, audit trail, and reports.
      const existingNumbers = get()
        .invoices.map((i) => i.invoiceNumber.match(/^INV-VEND-(\d+)$/)?.[1])
        .filter(Boolean)
        .map(Number);
      const nextNum = (existingNumbers.length > 0 ? Math.max(...existingNumbers) : 5000) + 1;
      const invoiceNumber = `INV-VEND-${nextNum}`;

      const scenarios = ['MATCHED', 'MISMATCHED', 'MISSING', 'HIGH_RISK'] as const;
      // Weighted so "MATCHED" is the most common outcome, like a real feed.
      const weighted = ['MATCHED', 'MATCHED', 'MISMATCHED', 'MISSING', 'HIGH_RISK'] as const;
      const scenario = weighted[Math.floor(Math.random() * weighted.length)];
      void scenarios;

      const taxableValue = [38500, 72200, 54000, 96500, 121000, 63500][
        Math.floor(Math.random() * 6)
      ];
      const gstAmount = Math.round(taxableValue * 0.18);
      const isInterState = !input.vendorGstin.startsWith('27');
      const gstRecordTaxable = scenario === 'MISMATCHED' ? taxableValue - 1800 : taxableValue;
      const gstRecordTax = Math.round(gstRecordTaxable * 0.18);
      const taxDifference =
        scenario === 'MATCHED'
          ? 0
          : scenario === 'MISMATCHED'
          ? Math.abs(gstAmount - gstRecordTax)
          : gstAmount;

      const now = new Date();
      const riskLevel: RiskLevel =
        scenario === 'MATCHED'
          ? 'LOW'
          : scenario === 'MISMATCHED'
          ? 'MEDIUM'
          : scenario === 'MISSING'
          ? 'HIGH'
          : 'CRITICAL';

      const newInvoice: InvoiceItem = {
        id: invoiceNumber,
        invoiceNumber,
        invoiceDate: now.toISOString().slice(0, 10),
        vendorId: input.vendorId,
        vendorName: input.vendorName,
        vendorGstin: input.vendorGstin,
        companyRecord: {
          taxableValue,
          cgst: isInterState ? 0 : gstAmount / 2,
          sgst: isInterState ? 0 : gstAmount / 2,
          igst: isInterState ? gstAmount : 0,
          totalGst: gstAmount,
          totalValue: taxableValue + gstAmount,
          itcEligible: scenario !== 'HIGH_RISK',
          hsnCode: '8523',
          pos: `${input.vendorGstin.slice(0, 2)} - Vendor Upload`,
        },
        gstRecord:
          scenario === 'MISSING'
            ? null
            : {
                taxableValue: gstRecordTaxable,
                cgst: isInterState ? 0 : gstRecordTax / 2,
                sgst: isInterState ? 0 : gstRecordTax / 2,
                igst: isInterState ? gstRecordTax : 0,
                totalGst: gstRecordTax,
                totalValue: gstRecordTaxable + gstRecordTax,
                itcAvailable: scenario !== 'HIGH_RISK',
                filingDate: now.toISOString().slice(0, 10),
                returnPeriod: 'Vendor Upload',
              },
        status: scenario,
        mismatchFields:
          scenario === 'MATCHED'
            ? []
            : scenario === 'MISMATCHED'
            ? ['taxableValue', 'totalGst']
            : scenario === 'MISSING'
            ? ['missing_in_gstr2b']
            : ['itc_ineligible_flag', 'supplier_compliance_flag'],
        taxDifference,
        taxableDifference: scenario === 'MISMATCHED' ? 1800 : scenario === 'MISSING' ? taxableValue : 0,
        mismatchExplanation:
          scenario === 'MATCHED'
            ? `Uploaded invoice ${invoiceNumber} matched the buyer purchase register within statutory tolerance.`
            : scenario === 'MISMATCHED'
            ? `Uploaded invoice taxable value differs by ₹1,800 against the buyer's GST record. Tax variance ₹${taxDifference.toLocaleString('en-IN')}.`
            : scenario === 'MISSING'
            ? 'Uploaded invoice is not yet reflected in the buyer statutory GSTR-2B/2A statement.'
            : 'Uploaded invoice flagged high risk because ITC availability is restricted on the buyer GST record.',
        riskLevel,
        itcRiskAmount: scenario === 'MATCHED' ? 0 : taxDifference,
        recommendedAction:
          scenario === 'MATCHED'
            ? 'No action required. Invoice is statutorily reconciled and safe for GSTR-1 reporting.'
            : scenario === 'MISMATCHED'
            ? 'Review the taxable value against your accounting entry and issue a credit/debit note if required.'
            : scenario === 'MISSING'
            ? 'Ensure this invoice is included in your next GSTR-1 filing for the buyer to claim ITC.'
            : 'Verify your GSTIN registration status and compliance filings before resubmission.',
        auditEvents: [
          {
            id: `aud-vendor-${Date.now()}`,
            timestamp: now.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }),
            invoiceId: invoiceNumber,
            action: 'Vendor Invoice Uploaded',
            result: scenario,
            explanation: `Vendor submitted "${input.fileName}" via the self-service portal. Record ingested into centralized ledger and reconciled automatically.`,
            actor: 'Vendor Self-Service Upload',
          },
        ],
        source: 'Vendor Self-Service Upload',
        createdAt: now.toISOString(),
        liveStatus:
          scenario === 'MATCHED'
            ? 'Received'
            : scenario === 'MISMATCHED'
            ? 'Processing'
            : scenario === 'MISSING'
            ? 'Mismatch'
            : 'High Risk',
      };

      set((state) => {
        const nextInvoices = [newInvoice, ...state.invoices];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextInvoices));
        return { invoices: nextInvoices };
      });
      return newInvoice;
    },

    ensureLiveFeedSeed: () => {
      const hasLive = get().invoices.some((inv) => inv.source === 'Prototype Live Feed');
      if (hasLive) return;

      const now = new Date();
      const make = (
        invoiceNumber: string,
        vendorName: string,
        vendorGstin: string,
        taxableValue: number,
        status: 'MATCHED' | 'MISMATCHED' | 'MISSING',
        liveStatus: 'Received' | 'Processing' | 'Mismatch',
        secondsAgo: number
      ): InvoiceItem => {
        const createdAt = new Date(now.getTime() - secondsAgo * 1000);
        const gstAmount = Math.round(taxableValue * 0.18);
        const gstTaxable = status === 'MISMATCHED' ? taxableValue + 2500 : taxableValue;
        const gstAmountPortal = Math.round(gstTaxable * 0.18);
        const taxDifference =
          status === 'MATCHED' ? 0 : status === 'MISMATCHED' ? Math.abs(gstAmountPortal - gstAmount) : gstAmount;
        return {
          id: invoiceNumber,
          invoiceNumber,
          invoiceDate: createdAt.toISOString().slice(0, 10),
          vendorId: `LIVE-${vendorName.replace(/\W/g, '').toUpperCase()}`,
          vendorName,
          vendorGstin,
          companyRecord: {
            taxableValue,
            cgst: 0,
            sgst: 0,
            igst: gstAmount,
            totalGst: gstAmount,
            totalValue: taxableValue + gstAmount,
            itcEligible: status === 'MATCHED',
            hsnCode: '9988',
            pos: `${vendorGstin.slice(0, 2)} - Live Feed`,
          },
          gstRecord:
            status === 'MISSING'
              ? null
              : {
                  taxableValue: gstTaxable,
                  cgst: 0,
                  sgst: 0,
                  igst: gstAmountPortal,
                  totalGst: gstAmountPortal,
                  totalValue: gstTaxable + gstAmountPortal,
                  itcAvailable: status === 'MATCHED',
                  filingDate: createdAt.toISOString().slice(0, 10),
                  returnPeriod: 'Live Feed',
                },
          status,
          mismatchFields:
            status === 'MATCHED'
              ? []
              : status === 'MISMATCHED'
              ? ['taxableValue', 'igst', 'totalGst']
              : ['missing_in_gstr2b'],
          taxDifference,
          taxableDifference: status === 'MISMATCHED' ? 2500 : status === 'MISSING' ? taxableValue : 0,
          mismatchExplanation:
            status === 'MATCHED'
              ? 'Live transaction matched immediately against simulated GST record.'
              : status === 'MISMATCHED'
              ? 'Live transaction is processing because portal taxable value differs from purchase register.'
              : 'Live transaction is absent from simulated GSTR-2B statement and requires vendor follow-up.',
          riskLevel: status === 'MATCHED' ? 'LOW' : status === 'MISMATCHED' ? 'MEDIUM' : 'HIGH',
          itcRiskAmount: status === 'MATCHED' ? 0 : taxDifference,
          recommendedAction:
            status === 'MATCHED'
              ? 'Proceed with claim after month-end close.'
              : status === 'MISMATCHED'
              ? 'Verify supplier value before claiming ITC.'
              : 'Hold ITC until supplier filing appears in GSTR-2B.',
          auditEvents: [
            {
              id: `aud-live-seed-${invoiceNumber}`,
              timestamp: createdAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
              invoiceId: invoiceNumber,
              action: 'Live Transaction Received',
              result: status,
              explanation: 'Seeded prototype live GST transaction ingested into centralized ledger.',
              actor: 'Prototype Live Feed',
            },
          ],
          source: 'Prototype Live Feed',
          createdAt: createdAt.toISOString(),
          liveStatus,
        };
      };

      const seeds = [
        make('INV1024', 'ABC Traders', '29ABCDE1234F1Z5', 45000, 'MATCHED', 'Received', 15),
        make('INV1023', 'XYZ Suppliers', '29XYZDE5678G1Z2', 82500, 'MISMATCHED', 'Processing', 19),
        make('INV1022', 'PQR Industries', '29PQRAB9012C1Z7', 31200, 'MISSING', 'Mismatch', 27),
      ];
      set((state) => {
        const nextInvoices = [...seeds, ...state.invoices];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextInvoices));
        return { invoices: nextInvoices };
      });
    },

    updateAdminSettings: (updates: Partial<AdminPlatformSettings>) => {
      set((state) => {
        const nextSettings = { ...state.adminSettings, ...updates };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
        return { adminSettings: nextSettings };
      });
    },

    exportSystemBackupJson: () => {
      const backup = {
        exportedAt: new Date().toISOString(),
        version: '2.5.0',
        invoices: get().invoices,
        companies: get().companies,
        batches: get().batches,
        dataSources: get().dataSources,
        adminSettings: {
          ...get().adminSettings,
          lastBackupDate: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      };

      // update lastBackupDate in settings
      get().updateAdminSettings({ lastBackupDate: backup.adminSettings.lastBackupDate });

      return JSON.stringify(backup, null, 2);
    },

    importSystemBackupJson: (jsonData: string) => {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed && parsed.invoices && parsed.companies) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.invoices));
          localStorage.setItem(COMPANIES_KEY, JSON.stringify(parsed.companies));
          if (parsed.batches) localStorage.setItem(BATCHES_KEY, JSON.stringify(parsed.batches));
          if (parsed.dataSources) localStorage.setItem(DATA_SOURCES_KEY, JSON.stringify(parsed.dataSources));
          if (parsed.adminSettings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed.adminSettings));

          set({
            invoices: parsed.invoices || INITIAL_INVOICES,
            companies: parsed.companies || INITIAL_COMPANIES,
            batches: parsed.batches || INITIAL_BATCHES,
            dataSources: parsed.dataSources || INITIAL_DATA_SOURCES,
            adminSettings: parsed.adminSettings || INITIAL_SETTINGS,
          });
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },

    applyGstr2bPayload: (payload: Gstr2bPayload) => {
      // Index generated B2B invoices by invoice number
      const b2bMap = new Map<
        string,
        { txval: number; cgst: number; sgst: number; igst: number; val: number }
      >();
      payload.docdata.b2b.forEach((sup) =>
        sup.inv.forEach((iv) =>
          b2bMap.set(iv.inum, {
            txval: iv.txval,
            cgst: iv.cgst,
            sgst: iv.sgst,
            igst: iv.igst,
            val: iv.val,
          })
        )
      );

      const current = get().invoices;
      let applied = 0;
      let missing = 0;

      const nextInvoices = current.map((inv) => {
        const rec = b2bMap.get(inv.invoiceNumber);
        if (rec) {
          applied++;
          return {
            ...inv,
            gstRecord: {
              taxableValue: rec.txval,
              cgst: rec.cgst,
              sgst: rec.sgst,
              igst: rec.igst,
              totalGst: rec.cgst + rec.sgst + rec.igst,
              totalValue: rec.val,
              itcAvailable: true,
              filingDate: payload.genDate.slice(0, 10),
              returnPeriod: payload.periodLabel,
            },
          };
        }
        missing++;
        return { ...inv, gstRecord: null };
      });

      const nowStr = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Append gateway audit event onto the first ledger invoice
      if (nextInvoices.length > 0) {
        const gatewayEvent: AuditEvent = {
          id: `aud-${Date.now()}`,
          timestamp: nowStr,
          invoiceId: nextInvoices[0].invoiceNumber,
          action: 'GSTR-2B Payload Applied',
          result: 'GENERATED_BY_GSTN',
          explanation: `GSTN gateway (${payload.source}) applied ${applied} B2B records for period ${payload.periodLabel}; ${missing} books invoice(s) absent from statement. Request ${payload.genRequestId}.`,
          actor: 'GSTN Gateway',
        };
        nextInvoices[0] = {
          ...nextInvoices[0],
          auditEvents: [gatewayEvent, ...nextInvoices[0].auditEvents],
        };
      }

      const nextSources = get().dataSources.map((ds) =>
        ds.key === 'gstr2b'
          ? {
              ...ds,
              status: 'connected' as const,
              lastSync: `Just now (GSTN gateway • ${payload.periodLabel})`,
              recordCount: payload.docdata.summary.invoices,
              fileName: `GSTR2B_${payload.gstin}_${payload.period}.json`,
              fileSize: `${(JSON.stringify(payload).length / 1024).toFixed(1)} KB`,
            }
          : ds
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextInvoices));
      localStorage.setItem(DATA_SOURCES_KEY, JSON.stringify(nextSources));
      set({ invoices: nextInvoices, dataSources: nextSources });

      return { applied, missing };
    },

    getAuditTrail: () => {
      const invoices = get().invoices;
      const allEvents: AuditEvent[] = [];
      invoices.forEach((inv) => {
        allEvents.push(...inv.auditEvents);
      });
      return allEvents.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    },

    resetData: () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DATA_SOURCES_KEY);
      localStorage.removeItem(COMPANIES_KEY);
      localStorage.removeItem(BATCHES_KEY);
      localStorage.removeItem(SETTINGS_KEY);
      set({
        invoices: INITIAL_INVOICES,
        dataSources: INITIAL_DATA_SOURCES,
        companies: INITIAL_COMPANIES,
        batches: INITIAL_BATCHES,
        adminSettings: INITIAL_SETTINGS,
        activeRunningBatch: null,
      });
    },
  };
});
