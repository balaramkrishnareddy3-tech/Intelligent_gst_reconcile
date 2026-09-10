import GlassCard from './GlassCard';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: ReactNode;
  onClick?: () => void;
  accentColor?: string;
}

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  onClick,
  accentColor = 'sky',
}: StatCardProps) {
  const changeColors = {
    positive: 'text-emerald-700 bg-emerald-50 border border-emerald-200/60',
    negative: 'text-rose-700 bg-rose-50 border border-rose-200/60',
    neutral: 'text-slate-600 bg-slate-50 border border-slate-200/60',
  };

  const iconBgs: Record<string, string> = {
    sky: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sky-500/20',
    emerald: 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-emerald-500/20',
    amber: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/20',
    rose: 'bg-gradient-to-br from-rose-400 to-red-600 text-white shadow-rose-500/20',
    purple: 'bg-gradient-to-br from-purple-400 to-indigo-600 text-white shadow-purple-500/20',
  };

  return (
    <GlassCard
      hover={!!onClick}
      onClick={onClick}
      className={onClick ? 'cursor-pointer group' : ''}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
            {value}
          </p>
          {change && (
            <div className="pt-1">
              <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-md ${changeColors[changeType]}`}>
                {change}
              </span>
            </div>
          )}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-md ${iconBgs[accentColor] || iconBgs.sky} transition-transform group-hover:scale-105`}
        >
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}
