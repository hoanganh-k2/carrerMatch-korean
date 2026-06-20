import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MediaFrameProps {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  /** Hero/above-the-fold → tải sớm, ưu tiên cao */
  priority?: boolean;
  rounded?: boolean;
  /** Xử lý duotone cobalt (grayscale + tint) cho hoà tông palette */
  duotone?: boolean;
  /** Lớp tối hoá để chữ đè lên đọc rõ */
  scrim?: 'none' | 'bottom' | 'full';
  /** Điểm nhấn vuông vàng-sao (second-read moment) */
  star?: boolean;
  /** Nội dung đè lên ảnh (safe area) */
  children?: React.ReactNode;
}

const SCRIM: Record<string, string> = {
  none: '',
  bottom: 'bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent',
  full: 'bg-foreground/45',
};

/**
 * Khung ảnh treated cho landing: ảnh Unsplash + duotone cobalt + scrim đọc chữ + fallback gradient.
 * Nếu ảnh lỗi (404/offline) → tự hiện khối gradient cobalt, không bao giờ vỡ layout.
 */
export function MediaFrame({
  src, alt = '', className, imgClassName, priority, rounded = true, duotone = true, scrim = 'none', star, children,
}: MediaFrameProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn('relative isolate overflow-hidden bg-primary', rounded && 'rounded-lg', className)}>
      {!failed ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : undefined}
          onError={() => setFailed(true)}
          className={cn('absolute inset-0 h-full w-full object-cover', duotone && 'grayscale-[0.85] contrast-[1.05]', imgClassName)}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-foreground" />
      )}

      {/* Duotone cobalt — phủ màu lên ảnh xám */}
      {duotone && !failed && <div aria-hidden className="absolute inset-0 bg-cobalt opacity-60 mix-blend-color" />}
      {/* Scrim cho độ đọc chữ */}
      {scrim !== 'none' && <div aria-hidden className={cn('absolute inset-0', SCRIM[scrim])} />}
      {/* Điểm nhấn star */}
      {star && <div aria-hidden className="absolute right-0 top-0 h-9 w-9 bg-star" />}

      {children && <div className="relative z-10 flex h-full flex-col">{children}</div>}
    </div>
  );
}
