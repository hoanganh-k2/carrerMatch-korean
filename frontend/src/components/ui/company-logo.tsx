import * as React from 'react';
import { Building2 } from 'lucide-react';
import { getUploadedFileUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

/**
 * Logo công ty: hiển thị ảnh thật (qua getUploadedFileUrl) hoặc fallback Building2.
 * Dùng chung ở job row, featured, các trang chi tiết.
 */
export function CompanyLogo({
  logoUrl,
  name,
  className,
  iconClassName,
}: {
  logoUrl?: string | null;
  name?: string;
  className?: string;
  iconClassName?: string;
}) {
  const [errored, setErrored] = React.useState(false);
  const showImg = logoUrl && !errored;

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card',
        className
      )}
    >
      {showImg ? (
        <img
          src={getUploadedFileUrl(logoUrl)}
          alt={name ? `Logo ${name}` : 'Logo công ty'}
          loading="lazy"
          onError={() => setErrored(true)}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        <Building2 className={cn('text-muted-foreground', iconClassName ?? 'size-1/2')} />
      )}
    </div>
  );
}
