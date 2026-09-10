import type { InvoiceItem, CompanyTenant, VendorSummary } from '@/types/gst';

/* =========================================================================
 * ADMIN DATA PRIVACY / ACCESS RESTRICTION LAYER
 * -----------------------------------------------------------------------
 * The platform Admin role is a system operator, not the data owner of any
 * individual Company or Vendor account. To reflect real-world data-access
 * governance, the Admin surface is restricted from viewing the exact
 * authenticated identity (full GSTIN, personal contact details) and the
 * precise statutory figures (purchase register / GST return line values)
 * that belong to a specific tenant. Admin retains full visibility into
 * system-wide oversight data: risk levels, compliance scores, statuses,
 * counts, and recent activity — everything needed to monitor the platform
 * without exposing another party's private financial/authentication data.
 *
 * This module is purely a read-side redaction layer. It does not alter the
 * underlying centralized data, any Company/Vendor functionality, or any
 * page layout — it only limits what the Admin's own queries resolve to.
 * ======================================================================= */

/** Masks a GSTIN, keeping the state code (first 2) and last 3 characters visible. */
export function maskGstin(gstin?: string | null): string {
  if (!gstin || gstin.length < 8) return gstin || '—';
  const start = gstin.slice(0, 2);
  const end = gstin.slice(-3);
  const stars = '•'.repeat(Math.max(4, gstin.length - 5));
  return `${start}${stars}${end}`;
}

/** Masks an email, keeping the first character and the domain. */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '—';
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 1);
  return `${visible}${'•'.repeat(Math.max(3, local.length - 1))}@${domain}`;
}

/** Masks a phone number, keeping the country code and last 2 digits. */
export function maskPhone(phone?: string | null): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '••••••';
  const visibleEnd = digits.slice(-2);
  const prefix = phone.trim().startsWith('+') ? phone.trim().slice(0, 3) : '';
  return `${prefix} ••• ••• ${visibleEnd}`.trim();
}

/** Masks a person's name, keeping only the first name. */
export function maskPersonName(name?: string | null): string {
  if (!name) return '—';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${'•'.repeat(Math.max(3, parts[parts.length - 1].length))}`;
}

/**
 * Rounds a statutory currency figure to the nearest ₹1,000 band.
 * Returns a number (not a string) so every existing `.toLocaleString()`
 * render call across the Admin UI continues to work with zero changes —
 * only the precision of the exact authenticated figure is restricted.
 */
export function bandAmount(amount?: number | null): number {
  if (!amount) return 0;
  return Math.round(amount / 1000) * 1000;
}

/** Redacts a single invoice's tenant-identifying and exact statutory figures for Admin views. */
export function redactInvoiceForAdmin(invoice: InvoiceItem): InvoiceItem {
  return {
    ...invoice,
    vendorGstin: maskGstin(invoice.vendorGstin),
    companyRecord: {
      ...invoice.companyRecord,
      taxableValue: bandAmount(invoice.companyRecord.taxableValue),
      cgst: bandAmount(invoice.companyRecord.cgst),
      sgst: bandAmount(invoice.companyRecord.sgst),
      igst: bandAmount(invoice.companyRecord.igst),
      totalGst: bandAmount(invoice.companyRecord.totalGst),
      totalValue: bandAmount(invoice.companyRecord.totalValue),
    },
    gstRecord: invoice.gstRecord
      ? {
          ...invoice.gstRecord,
          taxableValue: bandAmount(invoice.gstRecord.taxableValue),
          cgst: bandAmount(invoice.gstRecord.cgst),
          sgst: bandAmount(invoice.gstRecord.sgst),
          igst: bandAmount(invoice.gstRecord.igst),
          totalGst: bandAmount(invoice.gstRecord.totalGst),
          totalValue: bandAmount(invoice.gstRecord.totalValue),
        }
      : null,
    taxDifference: bandAmount(invoice.taxDifference),
    taxableDifference: bandAmount(invoice.taxableDifference),
    itcRiskAmount: bandAmount(invoice.itcRiskAmount),
  };
}

/** Redacts a company tenant's authenticated identity and exact statutory figures for Admin views. */
export function redactCompanyForAdmin(company: CompanyTenant): CompanyTenant {
  return {
    ...company,
    gstin: maskGstin(company.gstin),
    adminEmail: maskEmail(company.adminEmail),
    contactPerson: maskPersonName(company.contactPerson),
    phone: maskPhone(company.phone),
    itcClaimed: bandAmount(company.itcClaimed),
    itcAtRisk: bandAmount(company.itcAtRisk),
  };
}

/** Redacts a vendor's authenticated identity and exact statutory figures for Admin views. */
export function redactVendorForAdmin(vendor: VendorSummary): VendorSummary {
  return {
    ...vendor,
    gstin: maskGstin(vendor.gstin),
    totalTaxClaimed: bandAmount(vendor.totalTaxClaimed),
    itcAtRisk: bandAmount(vendor.itcAtRisk),
  };
}
