import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { setLenis, getLenis } from '@/lib/lenis-store';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * Cuộn mượt toàn site bằng Lenis (KHÔNG import GSAP → giữ bundle chính nhẹ).
 * Landing tự đồng bộ Lenis với ScrollTrigger qua lib/gsap.ts.
 * Tôn trọng prefers-reduced-motion: không khởi tạo Lenis.
 */
export function SmoothScroll() {
  const reduced = useReducedMotion();
  const location = useLocation();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    setLenis(lenis);

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      setLenis(null);
    };
  }, [reduced]);

  // Cuộn lên đầu khi đổi route
  useEffect(() => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}
