import { cn } from '@/utils/cn';

type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string; border: string }> = {
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', border: 'border-amber-200' },
  danger: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-200' },
  info: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500', border: 'border-sky-200' },
  neutral: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500', border: 'border-slate-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200' },
};

export default function StatusBadge({ status, label, pulse = false, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.neutral;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border shadow-xs',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs',
        config.bg,
        config.text,
        config.border
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot, pulse && 'animate-ping')} />
      {label}
    </span>
  );
}
