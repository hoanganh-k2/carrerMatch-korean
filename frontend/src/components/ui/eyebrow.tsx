import * as React from 'react';
import { cn } from '@/lib/utils';

/** Nhãn nhỏ kiểu biển báo phía trên tiêu đề. */
export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('eyebrow', className)} {...props} />;
}
