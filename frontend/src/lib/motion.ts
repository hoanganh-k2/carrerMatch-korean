import type { Variants, Transition } from 'motion/react';

/** Spring êm — dùng cho hover, layout, tiến trình */
export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 30 };
/** Spring nảy hơn — dùng cho FAB pop, nhấn */
export const springBouncy: Transition = { type: 'spring', stiffness: 420, damping: 22 };

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Chuyển trang toàn cục */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOut } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: 'easeIn' } },
};

/** Hiện lên + trượt lên — nhịp editorial điềm, biên độ nhỏ */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

/** Hero page-load sequence — container điều phối các phần tử lộ dần */
export const heroSequence: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

/** Phần tử trong hero — lộ dần kèm trượt nhẹ */
export const heroItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
};

/** Phóng nhẹ */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: springSoft },
};

/** Container stagger cho danh sách */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

/** Item con trong stagger */
export const staggerItem: Variants = fadeInUp;
