import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

interface CountUpProps {
  to: number;
  duration?: number; // giây
  className?: string;
  /** Hàm format số (vd thêm dấu chấm hàng nghìn) */
  format?: (n: number) => string;
}

const defaultFormat = (n: number) => Math.round(n).toLocaleString('vi-VN');

/** Đếm số tăng dần khi vào viewport. Reduced-motion → hiện ngay giá trị cuối. */
export function CountUp({ to, duration = 1.4, className, format = defaultFormat }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setValue(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, to, duration]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
