import * as React from 'react';
import { cn } from '@/lib/utils';
import { Eyebrow } from './eyebrow';

interface PageHeaderProps {
  eyebrow?: string;
  /** Nhãn tiếng Hàn nhỏ phía trên tiêu đề */
  kr?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, kr, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-2xl">
        {kr && (
          <span className="bilingual-kr mb-1 text-sm" lang="ko" aria-hidden="true">
            {kr}
          </span>
        )}
        {eyebrow && <Eyebrow className="mb-2 block">{eyebrow}</Eyebrow>}
        <h1 className="text-3xl font-bold leading-[1.05] tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
