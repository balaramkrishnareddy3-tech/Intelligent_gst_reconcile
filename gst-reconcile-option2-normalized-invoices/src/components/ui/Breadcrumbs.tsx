import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const breadcrumbItems = pathnames.slice(1);

  return (
    <nav className="flex items-center gap-1.5 text-xs font-medium">
      <Link
        to="/company/dashboard"
        className="flex items-center gap-1 text-slate-500 hover:text-sky-600 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Dashboard</span>
      </Link>
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const to = `/company/${breadcrumbItems.slice(0, index + 1).join('/')}`;
        const label = item.charAt(0).toUpperCase() + item.slice(1).replace(/-/g, ' ');

        return (
          <div key={item} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-slate-400" />
            {isLast ? (
              <span className="font-semibold text-slate-900">{label}</span>
            ) : (
              <Link to={to} className={cn('text-slate-500 hover:text-sky-600 transition-colors')}>
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
