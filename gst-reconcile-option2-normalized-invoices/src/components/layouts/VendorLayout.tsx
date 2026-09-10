import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  FileText,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Zap,
  Bell,
  Truck,
  Upload,
  Network,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';

const navItems = [
  { to: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vendor/invoices', label: 'Invoices', icon: FileText },
  { to: '/vendor/upload', label: 'Upload Invoice', icon: Upload },
  { to: '/vendor/mismatches', label: 'Mismatches', icon: AlertTriangle },
  { to: '/vendor/compliance', label: 'Compliance', icon: ShieldCheck },
  { to: '/vendor/issues', label: 'Issues', icon: MessageSquare },
  { to: '/vendor/transaction-graph', label: 'Transaction Graph', icon: Network },
  { to: '/vendor/reports', label: 'Reports', icon: BarChart3 },
  { to: '/vendor/settings', label: 'Settings', icon: Settings },
];

export default function VendorLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login/vendor');
  };

  return (
    <div className="flex h-screen bg-[#edf4fb] text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-indigo-100 bg-white/95 backdrop-blur-xl transition-all duration-300 shadow-[2px_0_12px_rgba(99,102,241,0.04)]',
          sidebarCollapsed ? 'w-[74px]' : 'w-64',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-indigo-100 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/25">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                GST RECONCILE
              </h1>
              <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                Vendor Portal
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200',
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Profile & Logout */}
        <div className="border-t border-indigo-100 p-3 space-y-1 bg-indigo-50/40">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 transition-all duration-200 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4 shrink-0 text-rose-500" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <div className="hidden border-t border-indigo-100 p-2 lg:block">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-1.5 text-xs text-slate-500 transition-colors hover:bg-indigo-100/70 hover:text-slate-700"
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

      {/* Main area */}
      <div
        className={cn(
          'flex flex-1 flex-col min-h-screen transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-[74px]' : 'lg:ml-64'
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-indigo-100 bg-white/85 px-4 backdrop-blur-md lg:px-8 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-indigo-50 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                Vendor Workspace • {user?.companyName || 'Vendor Supplies Co'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 md:flex bg-indigo-50 border border-indigo-200/60 rounded-xl px-3 py-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">GSTIN:</span>
              <code className="text-xs font-bold text-indigo-700 font-mono">
                {user?.gstin || '29GGGGG1314R9Z6'}
              </code>
            </div>

            <button
              className="relative rounded-xl p-2 text-slate-500 transition-colors hover:bg-indigo-100 hover:text-slate-800"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>

            <div className="h-6 w-px bg-indigo-200 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none">{user?.name || 'Priya Sharma'}</p>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">{user?.companyName || 'Vendor Co'}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white">
                {user?.name?.charAt(0) || 'V'}
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

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
