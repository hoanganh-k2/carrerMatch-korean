import { useState } from 'react';
import { Share2, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShareButtonsProps {
  url: string;
  title?: string;
  text?: string;
  className?: string;
}

/** Chia sẻ: Web Share API (mobile) + fallback Facebook / Zalo / copy link. */
export function ShareButtons({ url, title = 'KBRIDGE', text, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* người dùng hủy */
      }
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard bị chặn */
    }
  };

  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const zalo = `https://zalo.me/share/url?url=${encodeURIComponent(url)}`;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {typeof navigator !== 'undefined' && 'share' in navigator && (
        <Button variant="outline" size="sm" onClick={nativeShare}>
          <Share2 className="h-4 w-4" /> Chia sẻ
        </Button>
      )}
      <a href={fb} target="_blank" rel="noopener noreferrer" aria-label="Chia sẻ Facebook">
        <Button variant="outline" size="sm" type="button" tabIndex={-1}>Facebook</Button>
      </a>
      <a href={zalo} target="_blank" rel="noopener noreferrer" aria-label="Chia sẻ Zalo">
        <Button variant="outline" size="sm" type="button" tabIndex={-1}>Zalo</Button>
      </a>
      <Button variant="outline" size="sm" onClick={copy}>
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
        {copied ? 'Đã chép' : 'Chép link'}
      </Button>
    </div>
  );
}
