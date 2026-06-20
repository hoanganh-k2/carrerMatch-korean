import { getUploadedFileUrl } from '@/lib/api';
import { cn } from '@/lib/utils';

interface CompanyLogoProps {
  name?: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}

/** Logo công ty, fallback về chữ cái đầu trên nền cobalt nhạt. */
export function CompanyLogo({ name = '', logoUrl, size = 48, className }: CompanyLogoProps) {
  const src = getUploadedFileUrl(logoUrl);
  const initial = name.trim().charAt(0).toUpperCase() || '·';

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-accent',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className="font-display font-bold text-accent-foreground" style={{ fontSize: size * 0.42 }}>
          {initial}
        </span>
      )}
    </div>
  );
}
