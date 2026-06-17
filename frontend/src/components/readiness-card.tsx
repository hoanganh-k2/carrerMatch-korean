import React from 'react';
import { Sparkles } from 'lucide-react';
import { ShareButtons } from '@/components/share-buttons';
import { ReadinessResult } from '@/lib/readiness';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/**
 * Thẻ "Mức độ sẵn sàng thị trường Hàn" — trendy, dí dỏm, chia sẻ được.
 * Link chia sẻ trỏ tới backend /share/readiness (OG preview chữ).
 */
export function ReadinessCard({
  result,
  name,
  footer,
}: {
  result: ReadinessResult;
  name?: string;
  footer?: React.ReactNode;
}) {
  const shareUrl =
    `${API_URL}/share/readiness?score=${result.score}` +
    (name ? `&name=${encodeURIComponent(name)}` : '');

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-accent/60 via-card to-background p-6 md:p-8 shadow-lg shadow-primary/5">
      {/* Đốm trang trí */}
      <div className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Mức độ sẵn sàng thị trường Hàn
          </span>
          <span className="text-4xl leading-none">{result.emoji}</span>
        </div>

        {/* Điểm số */}
        <div className="mt-2 flex items-end gap-1">
          <span className="text-6xl md:text-7xl font-black text-primary leading-none">
            {result.score}
          </span>
          <span className="text-2xl font-extrabold text-primary/70 mb-1.5">%</span>
        </div>

        {/* Danh hiệu */}
        <div className="mt-3 inline-block px-3 py-1.5 rounded-full bg-foreground text-background text-sm font-extrabold">
          {result.title}
        </div>

        {/* Breakdown */}
        <div className="mt-6 space-y-3">
          {result.breakdown.map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-[11px] font-semibold text-muted-foreground mb-1">
                <span>{b.label}</span>
                <span>{b.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Tip cà khịa */}
        <p className="mt-5 text-sm italic text-foreground/80">💡 {result.tip}</p>

        {/* Chia sẻ */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs font-semibold text-muted-foreground">
            Khoe điểm với bạn bè nào 👇
          </span>
          <ShareButtons
            title={`Tôi sẵn sàng ${result.score}% cho thị trường Hàn! ${result.emoji}`}
            shareUrl={shareUrl}
          />
        </div>

        {footer}
      </div>
    </div>
  );
}
