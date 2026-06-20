import * as React from 'react';
import { motion, type Variants } from 'motion/react';

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number;
  as?: 'div' | 'section' | 'li' | 'article';
}

/** Lộ dần khi cuộn vào viewport (Motion whileInView). Tôn trọng reduced-motion qua media query CSS. */
export function Reveal({ delay = 0, as = 'div', className, children, ...props }: RevealProps) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      variants={defaultVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ delay }}
      {...(props as any)}
    >
      {children}
    </Comp>
  );
}
