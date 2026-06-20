import { useEffect, useRef } from 'react';
import SplitType from 'split-type';
import { gsap } from 'gsap';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { cn } from '@/lib/utils';

interface SplitTextProps {
  text: string;
  className?: string;
  /** Tách theo ký tự hay từ */
  by?: 'chars' | 'words';
  delay?: number;
  lang?: string;
}

/**
 * Tiêu đề reveal theo ký tự/từ (split-type + GSAP) cho khoảnh khắc page-load.
 * Reduced-motion → render văn bản tĩnh, không tách.
 */
export function SplitText({ text, className, by = 'chars', delay = 0, lang }: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !ref.current) return;
    const split = new SplitType(ref.current, { types: by === 'chars' ? 'chars' : 'words' });
    const targets = by === 'chars' ? split.chars : split.words;
    const tween = gsap.from(targets, {
      yPercent: 115,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      stagger: 0.025,
      delay,
    });
    return () => {
      tween.kill();
      split.revert();
    };
  }, [text, by, delay, reduced]);

  return (
    <span ref={ref} lang={lang} className={cn('inline-block [&_.char]:inline-block [&_.word]:inline-block', className)}>
      {text}
    </span>
  );
}
