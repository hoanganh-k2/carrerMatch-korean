interface GridMarkProps {
  size?: number;
  className?: string;
}

/**
 * Logo KBRIDGE — khối vuông chia 2×2 (cấu trúc khối Hangul/jamo).
 * Ô cobalt (Hàn) + ô vàng-sao (Việt) = cây cầu hai văn hoá.
 */
export function GridMark({ size = 28, className }: GridMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="KBRIDGE"
    >
      <rect x="0.75" y="0.75" width="22.5" height="22.5" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      {/* ô cobalt — góc trên-trái (Hàn) */}
      <rect x="2.5" y="2.5" width="8.4" height="8.4" rx="1.4" style={{ fill: 'var(--cobalt)' }} />
      {/* ô vàng-sao — góc dưới-phải (Việt) */}
      <rect x="13.1" y="13.1" width="8.4" height="8.4" rx="1.4" style={{ fill: 'var(--star)' }} />
      {/* hai ô còn lại — outline nhạt */}
      <rect x="13.1" y="2.5" width="8.4" height="8.4" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
      <rect x="2.5" y="13.1" width="8.4" height="8.4" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}
