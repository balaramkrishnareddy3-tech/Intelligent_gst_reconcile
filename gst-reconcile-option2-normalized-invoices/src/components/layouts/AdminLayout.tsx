import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  GitCompare,
  AlertTriangle,
  ShieldAlert,
  Network,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Bell,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/vendors', label: 'Vendors', icon: Users },
  { to: '/admin/invoices', label: 'Invoices', icon: FileText },
  { to: '/admin/reconciliation', label: 'Reconciliation Monitoring', icon: GitCompare },
  { to: '/admin/mismatches', label: 'Mismatch Monitoring', icon: AlertTriangle },
  { to: '/admin/itc-risk', label: 'ITC Risk Monitoring', icon: ShieldAlert },
  { to: '/admin/transaction-graph', label: 'Transaction Graph', icon: Network, highlight: true },
  { to: '/admin/audit-trail', label: 'Audit Trail', icon: ClipboardList },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'System Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login/admin');
  };

  return (
    <div className="flex h-screen bg-[#edf4fb] text-slate-800 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Admin Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sky-200/80 bg-white/95 backdrop-blur-xl transition-all duration-300 shadow-[2px_0_16px_rgba(14,165,233,0.06)]',
          sidebarCollapsed ? 'w-[74px]' : 'w-64',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo / Admin Branding */}
        <div className="flex h-16 items-center gap-3 border-b border-sky-100 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 shadow-md shadow-cyan-500/25">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                GST RECONCILE
              </h1>
              <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest flex items-center gap-1">
                <Crown className="h-3 w-3 text-amber-500" /> ADMIN PORTAL
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
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-md shadow-cyan-500/20'
                    : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                )
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </div>
              {!sidebarCollapsed && item.highlight && (
                <span className="rounded-full bg-cyan-100 px-1.5 py-0.5 text-[9px] font-bold text-cyan-800">
                  Global
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Profile & Logout */}
        <div className="border-t border-sky-100 p-3 space-y-1 bg-sky-50/60">
          <div className={cn('flex items-center gap-2.5 px-2 py-1.5', sidebarCollapsed && 'justify-center')}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
              AD
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Super Admin'}</p>
                <p className="text-[10px] text-slate-500 font-semibold">System Ops</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 transition-all duration-200 hover:bg-rose-50 cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0 text-rose-500" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <div className="hidden border-t border-sky-100 p-2 lg:block">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-1.5 text-xs text-slate-500 transition-colors hover:bg-sky-100/70 hover:text-slate-700 cursor-pointer"
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
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content area */}
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
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs">
                <Crown className="h-3.5 w-3.5 text-amber-300" /> GST RECONCILE
              </div>
              <span className="text-xs font-bold text-slate-700 hidden sm:inline">
                Admin Portal • System-Wide Controller
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 md:flex bg-cyan-50 border border-cyan-200/80 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider">
                Node Status:
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> All Services Online
              </span>
            </div>

            {/* Notifications */}
            <button
              className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-sky-100 hover:text-slate-800"
              title="System Alerts & Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-white"></span>
            </button>

            <div className="h-6 w-px bg-sky-200 hidden sm:block" />

            {/* Admin Profile */}
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none">
                  {user?.name || 'System Administrator'}
                </p>
                <p className="text-[10px] text-cyan-600 mt-1 font-bold">
                  {user?.email || 'admin@demo.com'}
                </p>
              </div>
              <div
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white"
                title="Super Admin Profile"
              >
                SA
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
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
