import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: ReactNode;
  kr?: string;
  icon?: ReactNode;
  className?: string;
}

/** Ô thống kê cho dashboard: số liệu kiểu signage + nhãn. */
export function StatCard({ label, value, kr, icon, className }: StatCardProps) {
  return (
    <div className={cn('flex flex-col gap-1 rounded-lg border border-border bg-card p-5', className)}>
      <div className="flex items-center justify-between">
        {kr ? <span className="bilingual-kr" lang="ko" aria-hidden="true">{kr}</span> : <span />}
        {icon && <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
      </div>
      <span className="signage-num text-3xl font-bold text-primary">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
