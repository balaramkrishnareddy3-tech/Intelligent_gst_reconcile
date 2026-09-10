import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Database,
  FileText,
  GitCompare,
  AlertTriangle,
  ShieldAlert,
  Users,
  Network,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Zap,
  User,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

const navItems = [
  { to: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/company/data-sources', label: 'Data Sources', icon: Database },
  { to: '/company/invoices', label: 'Invoices', icon: FileText },
  { to: '/company/reconciliation', label: 'Reconciliation', icon: GitCompare },
  { to: '/company/mismatches', label: 'Mismatches', icon: AlertTriangle, badge: 'Active' },
  { to: '/company/itc-risk', label: 'ITC Risk', icon: ShieldAlert },
  { to: '/company/vendor-risk', label: 'Vendor Risk', icon: Users },
  { to: '/company/transaction-graph', label: 'Transaction Graph', icon: Network, highlight: true },
  { to: '/company/audit-trail', label: 'Audit Trail', icon: ClipboardList },
  { to: '/company/reports', label: 'Reports', icon: BarChart3 },
  { to: '/company/settings', label: 'Settings', icon: Settings },
];

export default function CompanyLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login/company');
  };

  return (
    <div className="flex h-screen bg-[#edf4fb] text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sky-200/80 bg-white/95 backdrop-blur-xl transition-all duration-300 shadow-[2px_0_12px_rgba(30,58,138,0.04)]',
          sidebarCollapsed ? 'w-[74px]' : 'w-64',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sky-100 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-500/25">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                GST RECONCILE
              </h1>
              <p className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider">
                Enterprise Portal
              </p>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sky-500 text-white font-semibold shadow-md shadow-sky-500/25'
                    : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                )
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </div>
              {!sidebarCollapsed && item.highlight && (
                <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-600 group-hover:bg-white/20 group-hover:text-white">
                  <Sparkles className="h-2.5 w-2.5" /> Core
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Profile & Logout */}
        <div className="border-t border-sky-100 p-3 space-y-1 bg-sky-50/50">
          <NavLink
            to="/company/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-sky-100 text-sky-700 font-semibold'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              )
            }
          >
            <User className="h-4 w-4 shrink-0 text-slate-500" />
            {!sidebarCollapsed && <span>Company Profile</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 transition-all duration-200 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4 shrink-0 text-rose-500" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <div className="hidden border-t border-sky-100 p-2 lg:block">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-1.5 text-xs text-slate-500 transition-colors hover:bg-sky-100/70 hover:text-slate-700"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')}
            />
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content viewport */}
      <div
        className={cn(
          'flex flex-1 flex-col min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-[74px]' : 'lg:ml-64'
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-sky-200/80 bg-white/85 px-4 backdrop-blur-md lg:px-8 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-sky-50 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <Breadcrumbs />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 md:flex bg-sky-50/80 border border-sky-200/60 rounded-xl px-3 py-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">GSTIN:</span>
              <code className="text-xs font-bold text-sky-700 font-mono">
                {user?.gstin || '27AABCU9603R1ZM'}
              </code>
            </div>

            <button
              className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-sky-100 hover:text-slate-800"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>

            <div className="h-6 w-px bg-sky-200 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'Finance Admin'}</p>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">{user?.companyName || 'Acme Corp India'}</p>
              </div>
              <div
                onClick={() => navigate('/company/settings')}
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white cursor-pointer hover:scale-105 transition-transform"
                title="View Profile Settings"
              >
                {user?.name?.charAt(0) || 'C'}
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main page content area */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
