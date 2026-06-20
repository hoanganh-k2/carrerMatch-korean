import * as React from 'react';
import { cn } from '@/lib/utils';

interface BilingualLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Văn bản tiếng Hàn hiển thị nhỏ phía trên — chữ ký song ngữ Việt↔Hàn */
  kr: string;
}

/**
 * Cặp nhãn song ngữ: tiếng Hàn (nhỏ, mờ) đặt trên phần tiếng Việt (children).
 * Là chữ ký ngôn ngữ của thương hiệu KBRIDGE.
 */
export function BilingualLabel({ kr, className, children, ...props }: BilingualLabelProps) {
  return (
    <span className={cn('inline-flex flex-col leading-tight', className)} {...props}>
      <span className="bilingual-kr" lang="ko" aria-hidden="true">{kr}</span>
      <span>{children}</span>
    </span>
  );
}
