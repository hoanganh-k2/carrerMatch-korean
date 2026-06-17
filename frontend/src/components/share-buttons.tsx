import React, { useState } from 'react';
import { Share2, Link2, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type ShareKind = 'jobs' | 'companies';

/**
 * Nút chia sẻ việc làm / công ty.
 * Link đem đi share trỏ tới endpoint backend `/share/:kind/:id` để bot Facebook/Zalo
 * đọc được Open Graph (preview riêng theo từng tin), rồi tự redirect người dùng về SPA.
 */
export function ShareButtons({
  kind,
  id,
  title,
}: {
  kind: ShareKind;
  id: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${API_URL}/share/${kind}/${id}`;

  const nativeShare = async () => {
    // Web Share API: trên mobile mở sẵn Zalo / KakaoTalk / Messenger của máy
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // user huỷ -> bỏ qua
        return;
      }
    }
    // Desktop: mở menu fallback
    setOpen((v) => !v);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Sao chép link:', shareUrl);
    }
  };

  const openWindow = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=640,height=560');
    setOpen(false);
  };

  const enc = encodeURIComponent(shareUrl);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={nativeShare}
        title="Chia sẻ"
        className="w-10 h-10 rounded-xl border border-border shrink-0 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-secondary transition-all"
      >
        <Share2 className="w-5 h-5" />
      </button>

      {open && (
        <>
          {/* Lớp nền để bấm ra ngoài đóng menu */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-40 w-48 p-1.5 bg-card border border-border rounded-xl shadow-lg shadow-black/5">
            <button
              type="button"
              onClick={() => openWindow(`https://www.facebook.com/sharer/sharer.php?u=${enc}`)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <span className="w-4 h-4 flex items-center justify-center rounded bg-[#1877F2] text-white text-[10px] font-black shrink-0">
                f
              </span>
              Facebook
            </button>
            <button
              type="button"
              onClick={() => openWindow(`https://zalo.me/share?u=${enc}`)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <span className="w-4 h-4 flex items-center justify-center rounded bg-[#0068FF] text-white text-[8px] font-black shrink-0">
                Za
              </span>
              Zalo
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  Đã sao chép!
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  Sao chép link
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
