import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ children, className, hover = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-sky-200/60 bg-white/85 p-6 backdrop-blur-md',
        'shadow-[0_4px_20px_rgba(28,57,110,0.06)] transition-all duration-200',
        hover && 'cursor-pointer hover:border-sky-400 hover:bg-white hover:shadow-[0_8px_30px_rgba(14,165,233,0.12)] hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}
