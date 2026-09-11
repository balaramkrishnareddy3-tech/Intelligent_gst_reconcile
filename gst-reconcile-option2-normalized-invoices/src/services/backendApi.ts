
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://intelligent-gst-reconcile.onrender.com/api';

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = data?.detail || data?.message || `API request failed (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export interface BackendInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  vendor_id: string;
  vendor_name: string;
  vendor_gstin: string;
  taxable_value: number;
  cgst: number;
  sgst: number;
  igst: number;
  total_gst: number;
  total_value: number;
  status: string;
  risk_level: string;
  itc_risk_amount: number;
  mismatch_fields?: string[];
  mismatch_explanation?: string;
  recommended_action?: string;
  source?: string;
  created_at?: string;
}

export interface InvoiceListResponse {
  count: number;
  items: BackendInvoice[];
}

export interface UploadResponse {
  success: boolean;
  filename: string;
  bytes: number;
  count: number;
  skipped_count: number;
  items: BackendInvoice[];
  skipped: { invoice_number: string; reason: string }[];
  message: string;
}

export interface Gstr2bResponse {
  gstin: string;
  period: string;
  period_label: string;
  generated_at: string;
  request_id: string;
  source: string;
  records: Array<{
    invoice_id: string;
    vendor_gstin: string;
    vendor_name: string;
    invoice_number: string;
    invoice_date: string;
    taxable_value: number;
    cgst: number;
    sgst: number;
    igst: number;
    total_gst: number;
    total_value: number;
    itc_available: boolean;
  }>;
  summary: {
    suppliers: number;
    invoices: number;
    total_taxable: number;
    total_cgst: number;
    total_sgst: number;
    total_igst: number;
    total_tax: number;
    total_value: number;
  };
}

export async function uploadInvoiceFile(file: File, user: { id: string; companyName: string; gstin: string }): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const query = new URLSearchParams({
    vendor_id: user.id,
    vendor_name: user.companyName,
    vendor_gstin: user.gstin || 'DEMO-GSTIN',
  });
  return apiRequest<UploadResponse>(`/invoices/upload?${query.toString()}`, {
    method: 'POST',
    body: form,
  });
}

export async function fetchVendorInvoices(vendorId: string): Promise<InvoiceListResponse> {
  return apiRequest<InvoiceListResponse>(`/invoices?vendor_id=${encodeURIComponent(vendorId)}&limit=500`);
}

export async function generateGstr2b(period = '112025', vendorId?: string): Promise<Gstr2bResponse> {
  const params = new URLSearchParams({ period, gstin: 'DEMO-GSTIN' });
  if (vendorId) params.set('vendor_id', vendorId);
  return apiRequest<Gstr2bResponse>(`/gst/gstr2b?${params.toString()}`);
}

export function downloadGstr2bCsv(report: Gstr2bResponse) {
  const header = ['Invoice No','Invoice Date','Supplier GSTIN','Supplier Name','Taxable Value','CGST','SGST','IGST','Total GST','Invoice Value'];
  const rows = report.records.map(r => [
    r.invoice_number, r.invoice_date, r.vendor_gstin, `"${(r.vendor_name || '').replaceAll('"','""')}"`,
    r.taxable_value, r.cgst, r.sgst, r.igst, r.total_gst, r.total_value
  ]);
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `GSTR2B_${report.period}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export { API_BASE_URL };

