import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, ShieldCheck, Truck, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/auth';
import Button from '@/components/ui/Button';

export default function CreateAccount() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('company');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 6) return setError('Password must contain at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const result = await register({ name, email, role, companyName: role === 'company' ? companyName : '', password });
      if (!result.success) {
        setError(result.message);
        return;
      }
      // Registration creates the account but deliberately does not log the user in.
      // This lets the user verify the selected role through the normal login screen.
      logout();
      setSuccess('Account created successfully. Please sign in with your new email and password.');
      setTimeout(() => navigate('/login', { replace: true }), 900);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#ebf4fc] via-[#e2eefa] to-[#d6e7f8] p-4 text-slate-800">
      <div className="pointer-events-none absolute inset-0"><div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-sky-300/30 blur-[120px]" /><div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-indigo-300/25 blur-[120px]" /></div>
      <div className="relative z-10 w-full max-w-lg">
        <div className="rounded-3xl border border-sky-200/80 bg-white/95 p-7 shadow-[0_20px_60px_rgba(28,57,110,0.12)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 text-center"><div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg"><UserPlus className="h-7 w-7" /></div><h1 className="text-2xl font-extrabold text-slate-950">Create your account</h1><p className="mt-1 text-xs text-slate-500">Choose your role and create your login credentials.</p></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">{error}</div>}
            {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700">{success}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Full name</label><input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-xl border border-sky-200 px-3 py-3 text-sm outline-none focus:border-sky-500" placeholder="Your name" required /></div>
              <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Gmail / Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-xl border border-sky-200 px-3 py-3 text-sm outline-none focus:border-sky-500" placeholder="you@gmail.com" required /></div>
            </div>
            <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Account type</label><div className="grid gap-2 sm:grid-cols-3">{([['company','Company',Building2],['vendor','Vendor',Truck],['admin','Admin',ShieldCheck]] as const).map(([value,label,Icon])=><button type="button" key={value} onClick={()=>{setRole(value);setError('');}} className={`rounded-xl border px-3 py-3 text-left transition ${role===value?'border-sky-500 bg-sky-50 ring-2 ring-sky-500/10':'border-slate-200 bg-white hover:border-sky-300'}`}><Icon className="mb-1 h-4 w-4 text-sky-600"/><span className="text-xs font-bold">{label}</span></button>)}</div></div>
            {role === 'company' && <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Company name</label><input value={companyName} onChange={e=>setCompanyName(e.target.value)} className="w-full rounded-xl border border-sky-200 px-3 py-3 text-sm outline-none focus:border-sky-500" placeholder="Company / organisation" required /></div>}
            <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Password</label><div className="relative"><input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-sky-200 px-3 py-3 pr-10 text-sm outline-none focus:border-sky-500" placeholder="At least 6 characters" required /><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPassword?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div></div>
            <div><label className="mb-1.5 block text-xs font-semibold text-slate-700">Confirm password</label><input type={showPassword?'text':'password'} value={confirm} onChange={e=>setConfirm(e.target.value)} className="w-full rounded-xl border border-sky-200 px-3 py-3 text-sm outline-none focus:border-sky-500" placeholder="Re-enter password" required /></div>
            <Button type="submit" className="w-full !from-sky-500 !via-blue-600 !to-indigo-600" size="md" loading={loading}><UserPlus className="h-4 w-4"/> Create account</Button>
          </form>
          <p className="mt-5 text-center text-xs text-slate-500">Already have an account? <Link to="/login" className="font-bold text-sky-700 hover:underline">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
