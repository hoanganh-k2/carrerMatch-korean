import type { Variants, Transition } from 'motion/react';

/** Spring êm — hover, layout, tiến trình */
export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 30 };
/** Spring nảy hơn — FAB pop, nhấn */
export const springBouncy: Transition = { type: 'spring', stiffness: 420, damping: 22 };

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Chuyển trang toàn cục */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: 'easeIn' } },
};

/** Hiện lên + trượt — biên độ nhỏ, điềm */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

/** Khối "lắp" vào lưới như ghép jamo — dùng cho hero composition */
export const blockSnap: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: easeOut } },
};

/** Container điều phối các khối hero lộ dần */
export const heroSequence: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
};

/** Container stagger cho danh sách */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

/** Item con trong stagger */
export const staggerItem: Variants = fadeInUp;
