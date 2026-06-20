import { cn } from '@/lib/utils';

interface MatchBadgeProps {
  /** 0–1 (similarityScore) hoặc 0–100 (%) */
  score: number;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Con số "độ phù hợp" hiển thị như số biển báo, trong khối tô vàng-sao.
 * Đây là nơi spark (star) xuất hiện — dùng tiết chế.
 */
export function MatchBadge({ score, className, size = 'md' }: MatchBadgeProps) {
  const pct = Math.round(score <= 1 ? score * 100 : score);
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-0.5 rounded-sm bg-star px-2 py-1 text-star-foreground',
        size === 'sm' ? 'text-xs' : 'text-sm',
        className,
      )}
      title="Độ phù hợp ước tính (AI)"
    >
      <span className="signage-num font-semibold">{pct}</span>
      <span className="text-[0.7em] opacity-80">% hợp</span>
    </span>
  );
}
