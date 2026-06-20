import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-11 w-full rounded-md border border-input bg-card px-3.5 text-[0.95rem] text-foreground',
        'placeholder:text-muted-foreground/70 transition-colors',
        'focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
