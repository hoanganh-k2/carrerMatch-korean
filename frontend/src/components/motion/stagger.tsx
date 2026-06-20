import * as React from 'react';
import { motion } from 'motion/react';
import { staggerContainer, staggerItem } from '@/lib/motion';

interface StaggerProps extends React.HTMLAttributes<HTMLDivElement> {
  once?: boolean;
}

/** Container lộ dần các con theo nhịp (stagger) khi cuộn vào viewport. */
export function Stagger({ once = true, className, children, ...props }: StaggerProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: '0px 0px -10% 0px' }}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
}

/** Item con trong <Stagger>. */
export function StaggerItem({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <motion.div className={className} variants={staggerItem} {...(props as any)}>
      {children}
    </motion.div>
  );
}
