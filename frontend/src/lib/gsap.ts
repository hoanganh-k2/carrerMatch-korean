import { useEffect, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from '@/lib/lenis-store';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * GSAP + ScrollTrigger — CHỈ được import bởi landing (qua React.lazy) nên GSAP
 * nằm gọn trong chunk landing, không vào bundle chính.
 */

let registered = false;

/** Đăng ký plugin + đồng bộ ScrollTrigger với Lenis (idempotent). */
export function ensureGsap() {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger);
  const lenis = getLenis();
  // Lenis đã tự chạy rAF (trong SmoothScroll); ở đây chỉ cần đồng bộ update.
  if (lenis) lenis.on('scroll', ScrollTrigger.update);
  registered = true;
}

/**
 * Dựng một "scene" GSAP trong phạm vi scopeRef, tự cleanup khi unmount/đổi deps.
 * Tắt hoàn toàn khi prefers-reduced-motion.
 */
export function useGsapScene(
  scopeRef: RefObject<HTMLElement | null>,
  setup: (ctx: { gsap: typeof gsap; ScrollTrigger: typeof ScrollTrigger }) => void,
  deps: unknown[] = [],
) {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !scopeRef.current) return;
    ensureGsap();
    const ctx = gsap.context(() => setup({ gsap, ScrollTrigger }), scopeRef);
    ScrollTrigger.refresh();
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, ...deps]);
}

export { gsap, ScrollTrigger };
