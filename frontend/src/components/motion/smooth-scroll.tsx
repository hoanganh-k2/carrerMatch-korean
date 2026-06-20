import * as React from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from 'motion/react';

/**
 * Cuộn mượt toàn trang (Lenis). Tự tắt khi người dùng bật reduced-motion.
 * Các vùng cuộn riêng (modal/drawer) nên gắn `data-lenis-prevent` để không bị Lenis can thiệp.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  React.useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let rafId = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reduce]);

  return <>{children}</>;
}
