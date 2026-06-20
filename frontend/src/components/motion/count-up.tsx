import * as React from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

/** Đếm số tăng dần khi cuộn vào viewport. */
export function CountUp({
  to,
  suffix = '',
  duration = 1.4,
}: {
  to: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduce = useReducedMotion();
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, reduce, duration]);

  return (
    <span ref={ref}>
      {value.toLocaleString('vi-VN')}
      {suffix}
    </span>
  );
}
