import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const blockVariants = cva('relative flex flex-col p-6 sm:p-7', {
  variants: {
    variant: {
      default: 'text-foreground',
      cobalt: 'bg-primary text-primary-foreground',
      star: 'bg-star text-star-foreground',
      muted: 'bg-secondary text-secondary-foreground',
      ink: 'bg-foreground text-background',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BlockProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof blockVariants> {}

/** Một ô trong BlockGrid (hoặc đứng riêng). */
export function Block({ className, variant, ...props }: BlockProps) {
  return <div className={cn(blockVariants({ variant }), className)} {...props} />;
}
