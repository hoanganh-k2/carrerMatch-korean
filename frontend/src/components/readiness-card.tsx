import type { ReadinessResult } from '@/lib/readiness';
import { ShareButtons } from '@/components/share-buttons';
import { cn } from '@/lib/utils';

interface ReadinessCardProps {
  result: ReadinessResult;
  name?: string;
  shareUrl?: string;
}

/** Thẻ "Độ sẵn sàng thị trường Hàn" — điểm lớn + danh hiệu + breakdown + chia sẻ. */
export function ReadinessCard({ result, name, shareUrl }: ReadinessCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Đầu thẻ — khối cobalt với điểm to */}
      <div className="relative bg-primary px-6 py-8 text-center text-primary-foreground">
        <span className="bilingual-kr text-sm text-primary-foreground/70" lang="ko" aria-hidden="true">준비도</span>
        <div className="mt-1 flex items-end justify-center gap-1">
          <span className="signage-num text-6xl font-bold leading-none">{result.score}</span>
          <span className="mb-1.5 text-xl font-semibold">%</span>
        </div>
        <p className="mt-3 text-2xl">{result.emoji}</p>
        <p className="mt-1 font-display text-lg font-bold">{result.title}</p>
        {name && <p className="mt-1 text-sm text-primary-foreground/70">— {name}</p>}
      </div>

      <div className="p-6">
        <p className="rounded-md bg-accent px-3 py-2.5 text-sm text-accent-foreground">{result.tip}</p>

        <div className="mt-5 space-y-3">
          {result.breakdown.map((b) => (
            <div key={b.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="signage-num font-medium">{b.pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn('h-full rounded-full', b.pct >= 60 ? 'bg-primary' : b.pct >= 30 ? 'bg-star' : 'bg-muted-foreground')}
                  style={{ width: `${b.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {shareUrl && (
          <div className="mt-6 border-t border-border pt-4">
            <p className="eyebrow mb-2">Khoe với hội bạn</p>
            <ShareButtons url={shareUrl} title="Độ sẵn sàng đi Hàn của tôi" text={`${result.score}% — ${result.title}`} />
          </div>
        )}
      </div>
    </div>
  );
}
