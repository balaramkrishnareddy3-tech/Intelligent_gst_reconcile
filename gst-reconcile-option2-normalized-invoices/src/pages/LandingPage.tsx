import { useNavigate } from 'react-router-dom';
import { Zap, Shield, GitCompare, BarChart3, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#ebf4fc] via-[#e2eefa] to-[#d6e7f8] text-slate-800">
      {/* Subtle light mesh background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-300/30 blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-80 w-80 rounded-full bg-blue-300/25 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-200/30 blur-[100px]" />

        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(rgba(14,165,233,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.3) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Content Viewport */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Navigation */}
        <header className="flex items-center justify-between px-6 py-5 lg:px-12 border-b border-sky-200/50 bg-white/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-500/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">GST RECONCILE</h1>
              <p className="text-[10px] tracking-widest text-sky-700 uppercase font-semibold">
                Enterprise Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="#roles"
              className="text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors hidden sm:inline"
            >
              Select Portal
            </a>
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl border border-sky-300 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-white hover:text-cyan-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-600" /> Sign In
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl bg-sky-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition-all cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center lg:px-12">
          {/* Status Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-300 bg-white/80 px-4 py-1.5 backdrop-blur-sm shadow-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-700">
              System Online — Statutory 20-Step Matching Engine Operational
            </span>
          </div>

          <h2 className="max-w-4xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Intelligent GST{' '}
            <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Reconciliation
            </span>
            <br />& ITC Risk Analysis
          </h2>

          <p className="mt-5 max-w-2xl text-sm font-medium text-slate-600 sm:text-base leading-relaxed">
            Automate GSTR-2A/2B reconciliation against ERP books in real-time, trace complete
            knowledge graph relationships, calculate supplier risk scores, and safeguard Input Tax Credit.
          </p>

          {/* Feature Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {[
              { icon: GitCompare, label: 'Auto-Reconciliation' },
              { icon: Shield, label: 'ITC Cashflow Protection' },
              { icon: BarChart3, label: 'Relational Graph Engine' },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs backdrop-blur-sm"
              >
                <f.icon className="h-3.5 w-3.5 text-sky-600" />
                {f.label}
              </div>
            ))}
          </div>

          {/* Single sign-in CTA */}
          <div id="roles" className="mt-12 w-full max-w-md">
            <button
              onClick={() => navigate('/login')}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Sign in to GST Reconcile <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-3 text-xs text-slate-500">One login for Company, Vendor and Admin accounts.</p>
          </div>

          {/* Footer Security Badges */}
          <div className="mt-12 text-xs font-medium text-slate-500">
            256-bit Enterprise Encryption • GSTR-2B Verified Normalization • Statutory Rule 36(4) Compliant
          </div>
        </main>
      </div>
    </div>
  );
}
