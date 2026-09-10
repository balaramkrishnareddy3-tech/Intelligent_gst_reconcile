import { useGstStore, type GstStoreState } from '@/store/gstStore';
import { useAuthStore } from '@/store/authStore';
import {
  redactInvoiceForAdmin,
  redactCompanyForAdmin,
  redactVendorForAdmin,
} from '@/utils/adminPrivacy';

/* =========================================================================
 * ADMIN-SAFE DATA ACCESS HOOK
 * -----------------------------------------------------------------------
 * Drop-in replacement for `useGstStore()` used only by Admin pages. It
 * returns the exact same store shape (all actions and getters continue to
 * work unchanged), but for a logged-in Admin session it transparently
 * redacts:
 *   - Company/Vendor GSTIN (authenticated tax identity)          -> masked
 *   - Company admin email / contact person / phone (personal)    -> masked
 *   - Exact purchase register & GST return figures (CGST/SGST/
 *     IGST/taxable/total values, tax variance, ITC exposure)     -> banded
 *
 * Company and Vendor sessions are completely unaffected — this hook only
 * changes behaviour when `user.role === 'admin'`, and it does not modify
 * the centralized store, any other role's data, or any page layout.
 * ======================================================================= */
export function useAdminSafeGstStore(): GstStoreState {
  const store = useGstStore();
  const { user } = useAuthStore();

  if (user?.role !== 'admin') {
    return store;
  }

  return {
    ...store,
    invoices: store.invoices.map(redactInvoiceForAdmin),
    companies: store.companies.map(redactCompanyForAdmin),
    getInvoiceById: (id: string) => {
      const invoice = store.getInvoiceById(id);
      return invoice ? redactInvoiceForAdmin(invoice) : invoice;
    },
    getCompanyById: (id: string) => {
      const company = store.getCompanyById(id);
      return company ? redactCompanyForAdmin(company) : company;
    },
    getCompanies: () => store.getCompanies().map(redactCompanyForAdmin),
    getVendorsSummary: () => store.getVendorsSummary().map(redactVendorForAdmin),
    getVendorById: (id: string) => {
      const vendor = store.getVendorById(id);
      return vendor ? redactVendorForAdmin(vendor) : vendor;
    },
  };
}
