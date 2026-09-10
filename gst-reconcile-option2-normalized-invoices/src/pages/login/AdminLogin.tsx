import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ShieldCheck, Zap, Eye, EyeOff, ArrowLeft, Lock, Info } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(email, password, 'admin');
      if (success) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError('Invalid admin credentials');
      }
    } catch {
      setError('Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#ebf4fc] via-[#e2eefa] to-[#d6e7f8] p-4 text-slate-800">
      {/* Light Ambient Glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-cyan-300/30 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-300/25 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-sky-200/30 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(rgba(14,165,233,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.3) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back to Role Selection */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-cyan-700"
        >
          <ArrowLeft className="h-4 w-4" /> ← Back to Role Selection
        </Link>

        {/* Light Glassmorphic Card */}
        <div className="rounded-2xl border border-sky-200/80 bg-white/95 p-8 backdrop-blur-md shadow-[0_12px_40px_rgba(28,57,110,0.08)]">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 shadow-md shadow-cyan-500/25 ring-2 ring-white">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">GST RECONCILE</h1>
            <p className="mt-0.5 text-xs font-bold tracking-widest text-cyan-600 uppercase">
              ADMIN PORTAL
            </p>
            <p className="mt-1 text-xs text-slate-500">
              System Administration & Global Reconciliation Monitoring
            </p>
          </div>

          {/* Demo Credentials Helper */}
          <div className="mb-5 rounded-xl border border-sky-200 bg-sky-50/70 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
                <Zap className="h-3.5 w-3.5 text-cyan-600" /> Prototype Demo Credentials
              </span>
              <span className="text-[10px] font-bold text-cyan-800 bg-cyan-100/70 px-2 py-0.5 rounded border border-cyan-200">
                Super Admin
              </span>
            </div>
            <div className="mt-2 space-y-0.5 font-mono text-[11px] text-slate-600">
              <div>
                Admin ID: <span className="font-bold text-slate-900">admin@demo.com</span>
              </div>
              <div>
                Password: <span className="font-bold text-slate-900">admin123</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Email / Admin ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-xs"
                  placeholder="admin@demo.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => alert('Demo Mode: Prototype password reset simulation.')}
                  className="text-[11px] font-medium text-cyan-600 hover:text-cyan-700 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 bg-white px-3.5 py-2.5 pr-10 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-xs"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full !from-cyan-500 !via-blue-600 !to-indigo-600 !shadow-cyan-500/20 hover:!shadow-cyan-500/30"
              size="md"
              loading={loading}
            >
              <Lock className="h-3.5 w-3.5" /> Login as Admin
            </Button>
          </form>

          {/* Prototype Notice */}
          <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50/50 p-3 text-[11px] text-slate-500 flex items-start gap-2">
            <Info className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
            <span>
              Prototype demonstration portal. This interface is for system administrators and does
              not claim direct government GST system access.
            </span>
          </div>

          {/* Other Portal Links */}
          <div className="mt-6 flex items-center justify-between border-t border-sky-100 pt-4 text-xs text-slate-500 font-medium">
            <Link to="/login/company" className="hover:text-sky-700 transition-colors">
              Company Portal →
            </Link>
            <Link to="/login/vendor" className="hover:text-indigo-700 transition-colors">
              Vendor Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
