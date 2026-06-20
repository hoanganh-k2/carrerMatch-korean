import type Lenis from 'lenis';

/**
 * Singleton giữ instance Lenis hiện hành.
 * Tách riêng để GSAP (chỉ dùng ở landing) có thể đồng bộ với Lenis mà KHÔNG
 * kéo GSAP vào bundle chính — landing import lib/gsap.ts, gọi getLenis() tại đây.
 */
let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis(): Lenis | null {
  return lenis;
}
