import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Truck, Zap, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function VendorLogin() {
  const [email, setEmail] = useState('vendor@demo.com');
  const [password, setPassword] = useState('vendor123');
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
      const success = await login(email, password, 'vendor');
      if (success) {
        navigate('/vendor/dashboard', { replace: true });
      } else {
        setError('Invalid credentials. Please use vendor@demo.com / vendor123.');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#ebf4fc] via-[#e2eefa] to-[#d6e7f8] p-4 text-slate-800">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-indigo-300/30 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-purple-300/20 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Link */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Role Selection
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-indigo-200/80 bg-white/90 p-8 backdrop-blur-md shadow-[0_12px_40px_rgba(28,57,110,0.08)]">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
              <Truck className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Vendor / Supplier Portal</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Sign in to manage invoices, compliance score, and mismatches
            </p>
          </div>

          {/* Demo Credentials Box */}
          <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-800">
                <Zap className="h-3.5 w-3.5 text-indigo-600" /> Demo Credentials
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Ready to Sign In
              </span>
            </div>
            <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-600 font-mono">
              <div>
                Email: <span className="font-bold text-slate-900">vendor@demo.com</span>
              </div>
              <div>
                Password: <span className="font-bold text-slate-900">vendor123</span>
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
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none shadow-xs"
                placeholder="vendor@demo.com"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => alert('Demo Mode: Password reset simulation.')}
                  className="text-[11px] font-medium text-indigo-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 pr-10 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none shadow-xs"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Remember session</span>
              </label>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" /> 256-bit Secure
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Sign in to Vendor Portal'}
            </button>
          </form>

          {/* Switch Role Footer */}
          <div className="mt-6 text-center border-t border-indigo-100 pt-4">
            <p className="text-xs text-slate-500">
              Are you a company buyer?{' '}
              <Link to="/login/company" className="font-bold text-sky-700 hover:underline">
                Sign in to Company Portal →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
