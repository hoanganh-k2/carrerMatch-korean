import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Lưới khối modular kiểu Hangul — các ô cách nhau bằng đường hairline (line)
 * lộ qua khe gap 1px. Truyền số cột qua className (vd "sm:grid-cols-2 lg:grid-cols-3").
 */
export function BlockGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('block-grid grid-cols-1', className)} {...props} />;
}
