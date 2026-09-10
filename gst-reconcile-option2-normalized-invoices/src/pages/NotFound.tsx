import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#edf4fb] p-4 text-slate-800">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-sky-200/40 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-200/30 blur-[120px]" />
      </div>
      <div className="relative z-10 text-center max-w-md rounded-2xl border border-sky-200/80 bg-white/90 p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">404</h1>
        <p className="mt-1 text-sm text-slate-600">Page not found or you don't have access.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button size="sm" onClick={() => navigate('/')}>
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
