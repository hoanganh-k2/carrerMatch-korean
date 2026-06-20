import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useGsapScene } from '@/lib/gsap';
import { SplitText } from '@/components/motion/split-text';
import { CountUp } from '@/components/motion/count-up';
import { MediaFrame } from '@/components/ui/media-frame';
import { buttonVariants } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { cn } from '@/lib/utils';

const ROLES = ['BrSE', 'IT Comtor', 'Developer', 'QA', 'PM'];

/**
 * Hero cinematic: ảnh full-bleed treated + "jamo block composition" overlay.
 * GSAP: page-load assembly (khối lắp vào) + scroll parallax mượt (không pin → robust).
 * Lazy qua landing → GSAP nằm trong chunk landing.
 */
export function HeroScene({ jobCount = 1200 }: { jobCount?: number }) {
  const scope = useRef<HTMLDivElement>(null);

  useGsapScene(scope, ({ gsap }) => {
    gsap.from('.hero-block', {
      y: 30, opacity: 0, scale: 0.97, duration: 0.65, ease: 'power3.out', stagger: 0.09, delay: 0.12,
    });
    gsap.to('.hero-media-img', {
      yPercent: 12, ease: 'none',
      scrollTrigger: { trigger: scope.current, start: 'top top', end: 'bottom top', scrub: 0.5 },
    });
  });

  return (
    <section ref={scope} className="relative isolate flex min-h-[88vh] items-end overflow-hidden">
      {/* Ảnh nền full-bleed (treated) */}
      <MediaFrame
        src="/images/hero-seoul.jpg"
        alt="Đô thị công nghệ Hàn Quốc lúc hoàng hôn"
        priority
        rounded={false}
        scrim="full"
        className="absolute inset-0 -z-10"
        imgClassName="hero-media-img scale-110"
      />
      {/* Scrim phụ phía dưới-trái cho khối chữ */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-tr from-foreground/80 via-foreground/35 to-transparent" />

      <Container className="pb-16 pt-28 sm:pb-20">
        <div className="max-w-3xl text-white">
          <span className="hero-block eyebrow text-white/75">매칭 · Cầu nối IT Việt → Hàn</span>

          <h1 className="hero-block mt-4 font-display text-4xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
            <span className="bilingual-kr text-base text-white/70 sm:text-lg" lang="ko" aria-hidden="true">당신의 커리어</span>
            <SplitText text="Sự nghiệp IT của bạn," className="block" />
            <SplitText text="bắt đầu tại Hàn Quốc." className="block text-star" delay={0.3} />
          </h1>

          <p className="hero-block mt-5 max-w-xl text-base text-white/85 sm:text-lg">
            Việc làm BrSE, Comtor, Dev tiếng Hàn — khớp đúng người, đúng việc bằng AI Semantic Search.
          </p>

          {/* Hàng khối: CTA cobalt + stat vàng-sao */}
          <div className="hero-block mt-8 flex flex-wrap items-stretch gap-3">
            <Link to="/quick-match" className={cn(buttonVariants({ size: 'lg' }))}>
              <Sparkles className="h-4 w-4" /> Quick Match — không cần đăng nhập
            </Link>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 text-[0.95rem] font-medium text-white transition-colors hover:bg-white/10"
            >
              Duyệt việc làm <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Khối thống kê vàng-sao (spark, dùng 1 lần) + tags vai trò */}
          <div className="hero-block mt-8 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-baseline gap-1.5 rounded-md bg-star px-4 py-2.5 text-star-foreground">
              <CountUp to={jobCount} className="signage-num text-2xl font-bold" />
              <span className="text-sm font-medium">việc đang mở</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => (
                <span key={r} className="rounded-sm border border-white/25 px-2.5 py-1 text-xs font-medium text-white/85">{r}</span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
