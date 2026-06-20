import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { pageVariants } from '@/lib/motion';

/** Bọc nội dung 1 trang để có hiệu ứng vào/ra khi chuyển route. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}
