import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import Chatbot from '@/components/chatbot/Chatbot';
import GstnGateway from '@/components/gstn/GstnGateway';
import HistoryGuide from '@/components/guide/HistoryGuide';
import NotifyCenter from '@/components/notify/NotifyCenter';
import Gstr2bReportGate from '@/components/gstr2b/Gstr2bReportGate';
import DashboardDock from '@/components/dock/DashboardDock';

// Layouts
import CompanyLayout from '@/components/layouts/CompanyLayout';
import VendorLayout from '@/components/layouts/VendorLayout';
import AdminLayout from '@/components/layouts/AdminLayout';

// Guards
import ProtectedRoute from '@/components/guards/ProtectedRoute';

// Public pages
import LoginPage from '@/pages/login/LoginPage';
import CreateAccount from '@/pages/login/CreateAccount';
import NotFound from '@/pages/NotFound';

// Company pages
import CompanyDashboard from '@/pages/company/CompanyDashboard';
import DataSources from '@/pages/company/DataSources';
import Invoices from '@/pages/company/Invoices';
import Reconciliation from '@/pages/company/Reconciliation';
import ReconciliationResults from '@/pages/company/ReconciliationResults';
import MismatchesPage from '@/pages/company/MismatchesPage';
import InvoiceDetail from '@/pages/company/InvoiceDetail';
import ITCRisk from '@/pages/company/ITCRisk';
import VendorRisk from '@/pages/company/VendorRisk';
import VendorDetail from '@/pages/company/VendorDetail';
import TransactionGraph from '@/pages/company/TransactionGraph';
import AuditTrail from '@/pages/company/AuditTrail';
import CompanyReports from '@/pages/company/CompanyReports';
import CompanySettings from '@/pages/company/CompanySettings';

// Vendor pages
import VendorDashboard from '@/pages/vendor/VendorDashboard';
import VendorInvoices from '@/pages/vendor/VendorInvoices';
import Mismatches from '@/pages/vendor/Mismatches';
import Compliance from '@/pages/vendor/Compliance';
import Issues from '@/pages/vendor/Issues';
import VendorReports from '@/pages/vendor/VendorReports';
import VendorSettings from '@/pages/vendor/VendorSettings';
import VendorUpload from '@/pages/vendor/VendorUpload';
import VendorTransactionGraph from '@/pages/vendor/VendorTransactionGraph';

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminCompanies from '@/pages/admin/AdminCompanies';
import AdminCompanyDetail from '@/pages/admin/AdminCompanyDetail';
import AdminVendors from '@/pages/admin/AdminVendors';
import AdminVendorDetail from '@/pages/admin/AdminVendorDetail';
import AdminInvoices from '@/pages/admin/AdminInvoices';
import AdminInvoiceDetail from '@/pages/admin/AdminInvoiceDetail';
import AdminReconciliation from '@/pages/admin/AdminReconciliation';
import AdminMismatches from '@/pages/admin/AdminMismatches';
import AdminITCRisk from '@/pages/admin/AdminITCRisk';
import AdminTransactionGraph from '@/pages/admin/AdminTransactionGraph';
import AdminAuditTrail from '@/pages/admin/AdminAuditTrail';
import AdminReports from '@/pages/admin/AdminReports';
import AdminSettings from '@/pages/admin/AdminSettings';

function AppRoutes() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/create-account" element={<CreateAccount />} />

      {/* Legacy role-login URLs now use the same single login screen. */}
      <Route path="/login/company" element={<LoginPage />} />
      <Route path="/login/vendor" element={<LoginPage />} />
      <Route path="/login/admin" element={<LoginPage />} />

      {/* Company protected routes */}
      <Route element={<ProtectedRoute allowedRole="company" />}>
        <Route element={<CompanyLayout />}>
          <Route
            path="/company/dashboard"
            element={
              <DashboardDock>
                <CompanyDashboard />
              </DashboardDock>
            }
          />
          <Route path="/company/data-sources" element={<DataSources />} />
          <Route path="/company/invoices" element={<Invoices />} />
          <Route path="/company/reconciliation" element={<Reconciliation />} />
          <Route path="/company/reconciliation/results" element={<ReconciliationResults />} />
          <Route path="/company/mismatches" element={<MismatchesPage />} />
          <Route path="/company/invoice/:id" element={<InvoiceDetail />} />
          <Route path="/company/itc-risk" element={<ITCRisk />} />
          <Route path="/company/vendor-risk" element={<VendorRisk />} />
          <Route path="/company/vendor-risk/:id" element={<VendorDetail />} />
          <Route path="/company/transaction-graph" element={<TransactionGraph />} />
          <Route path="/company/audit-trail" element={<AuditTrail />} />
          <Route path="/company/reports" element={<CompanyReports />} />
          <Route path="/company/settings" element={<CompanySettings />} />
        </Route>
      </Route>

      {/* Vendor protected routes */}
      <Route element={<ProtectedRoute allowedRole="vendor" />}>
        <Route element={<VendorLayout />}>
          <Route
            path="/vendor/dashboard"
            element={
              <DashboardDock showGateway={false}>
                <VendorDashboard />
              </DashboardDock>
            }
          />
          <Route path="/vendor/invoices" element={<VendorInvoices />} />
          <Route path="/vendor/upload" element={<VendorUpload />} />
          <Route path="/vendor/mismatches" element={<Mismatches />} />
          <Route path="/vendor/compliance" element={<Compliance />} />
          <Route path="/vendor/issues" element={<Issues />} />
          <Route path="/vendor/transaction-graph" element={<VendorTransactionGraph />} />
          <Route path="/vendor/reports" element={<VendorReports />} />
          <Route path="/vendor/settings" element={<VendorSettings />} />
        </Route>
      </Route>

      {/* Admin protected routes */}
      <Route element={<ProtectedRoute allowedRole="admin" />}>
        <Route element={<AdminLayout />}>
          <Route
            path="/admin/dashboard"
            element={
              <DashboardDock>
                <AdminDashboard />
              </DashboardDock>
            }
          />
          <Route path="/admin/companies" element={<AdminCompanies />} />
          <Route path="/admin/companies/:id" element={<AdminCompanyDetail />} />
          <Route path="/admin/vendors" element={<AdminVendors />} />
          <Route path="/admin/vendors/:id" element={<AdminVendorDetail />} />
          <Route path="/admin/invoices" element={<AdminInvoices />} />
          <Route path="/admin/invoices/:id" element={<AdminInvoiceDetail />} />
          <Route path="/admin/reconciliation" element={<AdminReconciliation />} />
          <Route path="/admin/mismatches" element={<AdminMismatches />} />
          <Route path="/admin/itc-risk" element={<AdminITCRisk />} />
          <Route path="/admin/transaction-graph" element={<AdminTransactionGraph />} />
          <Route path="/admin/audit-trail" element={<AdminAuditTrail />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      {/* Global floating assistant — available on every page without touching page designs */}
      <Chatbot />
      {/* Global GSTN live API gateway console — GSTR-2B generation, mounted app-wide */}
      <GstnGateway />
      {/* Global History & Guidance coach — role-aware tour + session history, app-wide */}
      <HistoryGuide />
      {/* Global notifications center — live event bus with toasts, app-wide */}
      <NotifyCenter />
      {/* GSTR-2B report gate — OTP verification + statement report after uploads */}
      <Gstr2bReportGate />
    </BrowserRouter>
  );
}
