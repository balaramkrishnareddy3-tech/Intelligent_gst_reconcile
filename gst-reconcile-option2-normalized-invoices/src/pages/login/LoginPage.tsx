import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Truck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/auth';
import Button from '@/components/ui/Button';

const ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  Icon: typeof Building2;
  email: string;
  password: string;
}[] = [
  { value: 'company', label: 'Company', Icon: Building2, email: 'company@demo.com', password: 'company123' },
  { value: 'vendor', label: 'Vendor', Icon: Truck, email: 'vendor@demo.com', password: 'vendor123' },
  { value: 'admin', label: 'Admin', Icon: ShieldCheck, email: 'admin@demo.com', password: 'admin123' },
];

export default function LoginPage() {
  const [role, setRole] = useState<UserRole>('company');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRoleChange = (nextRole: UserRole) => {
    setRole(nextRole);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await useAuthStore.getState().login(email, password, role);
      if (!success) {
        setError(`Invalid ${role} email or password.`);
        return;
      }
      if (!remember) sessionStorage.setItem('gst_reconcile_session', '1');
      else sessionStorage.removeItem('gst_reconcile_session');
      const user = useAuthStore.getState().user;
      if (user) navigate(`/${user.role}/dashboard`, { replace: true });
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[46%_54%]">
        <section className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-[#05265b] via-[#073c96] to-[#0038b8] p-10 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(80,180,255,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(80,180,255,.22) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-xl"><ShieldCheck className="h-9 w-9" /></div>
            <div>
              <div className="text-4xl font-extrabold tracking-tight">GST <span className="text-sky-400">RECONCILE</span></div>
              <div className="mt-1 text-sm text-blue-200">Smart Reconciliation. Better Compliance.</div>
            </div>
          </div>
          <div className="relative z-10 mt-20 max-w-xl">
            <h2 className="text-4xl font-extrabold leading-tight">Simplify GST Reconciliation<br />for a <span className="text-sky-400">Smarter Tomorrow</span></h2>
            <p className="mt-7 max-w-lg text-lg leading-8 text-blue-100">Match, reconcile and analyze your GST data across multiple sources with confidence.</p>
            <div className="mt-8 space-y-5 text-lg text-blue-100">
              {['Multi-source Data Integration', 'Advanced Reconciliation', 'Risk Analysis & Insights', 'Comprehensive Reporting'].map((item) => (
                <div key={item} className="flex items-center gap-4"><CheckCircle2 className="h-6 w-6 text-sky-400" /><span>{item}</span></div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[46%] opacity-95">
            <div className="absolute bottom-14 left-16 h-56 w-72 -skew-y-3 rounded-3xl border border-sky-400/70 bg-blue-950/40 shadow-2xl shadow-sky-500/30" />
            <div className="absolute bottom-20 left-24 h-40 w-56 -skew-y-3 rounded-2xl border-2 border-sky-400/70 bg-slate-950/40" />
            <div className="absolute bottom-28 left-36 h-20 w-28 -skew-y-3 rounded-lg border border-sky-300/70 bg-blue-800/50" />
            {['GSTR-1', 'GSTR-2B', 'GSTR-3B', 'E-Invoice', 'E-Way Bill', 'Purchase'].map((item, index) => (
              <div key={item} className="absolute rounded-xl border border-sky-300/60 bg-blue-700/45 px-4 py-3 text-sm font-bold shadow-lg backdrop-blur" style={{ left: `${320 + (index % 2) * 125}px`, bottom: `${150 + Math.floor(index / 2) * 82}px` }}>{item}</div>
            ))}
            <div className="absolute bottom-24 right-14 h-20 w-24 rounded-2xl border border-sky-300/50 bg-blue-600/30" />
          </div>
        </section>

        <main className="flex min-h-screen items-center justify-center bg-white px-6 py-8 sm:px-12 lg:px-16">
          <div className="w-full max-w-2xl">
            <div className="mb-10 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20"><ShieldCheck className="h-10 w-10" /></div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">GST RECONCILE</h1>
              <div className="mt-2 text-sm font-extrabold tracking-[0.28em] text-sky-600">INTELLIGENT GST PLATFORM</div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {ROLE_OPTIONS.map(({ value, label, Icon, email: demoEmail, password: demoPassword }) => (
                <button key={value} type="button" onClick={() => handleRoleChange(value)} aria-pressed={role === value} className={`rounded-xl border-2 p-5 text-center transition-all ${role === value ? 'border-sky-500 bg-sky-50 shadow-md' : 'border-slate-200 bg-white hover:border-sky-300'}`}>
                  <div className="flex items-center justify-center gap-2">
                    <Icon className={`h-6 w-6 ${role === value ? 'text-sky-600' : 'text-slate-500'}`} />
                    <span className={`text-base font-extrabold ${role === value ? 'text-blue-900' : 'text-slate-800'}`}>{label}</span>
                  </div>
                  <div className="mt-5 space-y-2">
                    <div className="break-all text-sm font-semibold text-slate-700">{demoEmail}</div>
                    <div className="text-sm font-semibold text-slate-700">{demoPassword}</div>
                  </div>
                </button>
              ))}
            </div>

            {error && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block font-semibold text-slate-700">{role === 'company' ? 'Email / Company ID' : role === 'vendor' ? 'Email / Vendor ID' : 'Email / Admin ID'}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={role === 'company' ? 'you@company.com' : role === 'vendor' ? 'you@vendor.com' : 'you@admin.com'} required autoComplete="email" className="h-14 w-full rounded-xl border border-sky-300 pl-12 pr-4 text-base outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15" />
                </div>
              </div>
              <div>
                <label className="mb-2 block font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required autoComplete="current-password" className="h-14 w-full rounded-xl border border-sky-300 pl-12 pr-12 text-base outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15" />
                  <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((current) => !current)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded" />Remember this session</label>
                <button type="button" onClick={() => setError('Password reset is available through your configured authentication provider.')} className="text-sm font-semibold text-sky-600 hover:underline">Forgot password?</button>
              </div>
              <Button type="submit" size="md" loading={loading} className="h-14 w-full !from-sky-500 !via-blue-600 !to-indigo-600 !shadow-blue-500/20"><LockKeyhole className="h-5 w-5" />Sign In</Button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-7 text-center"><span className="text-sm text-slate-500">Don&apos;t have an account?</span>{' '}<Link to="/create-account" className="text-sm font-bold text-sky-700 hover:underline">Create account</Link></div>
          </div>
        </main>
      </div>
    </div>
  );
}
