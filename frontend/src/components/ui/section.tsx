import * as React from 'react';
import { cn } from '@/lib/utils';

/** Khoảng đệm dọc nhất quán giữa các section. */
export function Section({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn('py-16 sm:py-20', className)} {...props} />;
}
