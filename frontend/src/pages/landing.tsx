import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, GraduationCap, Cpu, Handshake, Plane } from 'lucide-react';
import { fetchJobsPaged, type Job } from '@/lib/api';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button, buttonVariants } from '@/components/ui/button';
import { MediaFrame } from '@/components/ui/media-frame';
import { JobCard } from '@/components/job-card';
import { CountUp } from '@/components/motion/count-up';
import { Reveal } from '@/components/motion/reveal';
import { Stagger, StaggerItem } from '@/components/motion/stagger';
import { HeroScene } from '@/components/landing/hero-scene';
import { cn } from '@/lib/utils';

const STATS = [
  { to: 1200, suffix: '+', label: 'Việc làm IT tiếng Hàn', kr: '채용' },
  { to: 180, suffix: '+', label: 'Công ty Hàn Quốc', kr: '기업' },
  { to: 6, suffix: '', label: 'Cấp độ TOPIK hỗ trợ', kr: 'TOPIK' },
  { to: 5000, suffix: '+', label: 'Ứng viên đã kết nối', kr: '구직자' },
];

const JOURNEY = [
  { icon: GraduationCap, title: 'Đo trình độ', kr: '준비도', desc: 'Kiểm tra TOPIK & kỹ năng, biết mình đang ở đâu.' },
  { icon: Cpu, title: 'AI khớp việc', kr: '매칭', desc: 'Semantic Search gợi ý việc đúng vai trò, đúng lương.' },
  { icon: Handshake, title: 'Kết nối NTD', kr: '인터뷰', desc: 'Ứng tuyển & phỏng vấn với doanh nghiệp Hàn.' },
  { icon: Plane, title: 'Lên đường', kr: '출발', desc: 'Nhận offer — sang Hàn hoặc làm remote từ Việt Nam.' },
];

export default function LandingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState<number>(1200);

  useEffect(() => {
    fetchJobsPaged({ page: 1, limit: 6, sort: 'createdAt:desc' })
      .then((r) => {
        setJobs(r.data);
        if (r.total) setTotal(r.total);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <HeroScene jobCount={total} />

      {/* Trust / stat strip — nhịp calm, không ảnh */}
      <Section className="py-12 sm:py-14">
        <Container>
          <div className="block-grid sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col gap-1 p-6">
                <span className="bilingual-kr" lang="ko" aria-hidden="true">{s.kr}</span>
                <span className="flex items-baseline gap-0.5">
                  <CountUp to={s.to} className="signage-num text-3xl font-bold text-primary" />
                  <span className="signage-num text-2xl font-bold text-primary">{s.suffix}</span>
                </span>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Featured jobs */}
      <Section className="py-12 sm:py-16">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <Eyebrow>Việc nổi bật · 추천 채용</Eyebrow>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Mới đăng tuyển</h2>
            </div>
            <Link to="/jobs" className="hidden items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:flex">
              Tất cả việc làm <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {jobs.length > 0 ? (
            <Stagger className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((j) => (
                <StaggerItem key={j.id}><JobCard job={j} /></StaggerItem>
              ))}
            </Stagger>
          ) : (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-52 animate-pulse rounded-lg border border-border bg-card" />
              ))}
            </div>
          )}

          <div className="mt-8 sm:hidden">
            <Link to="/jobs" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>Tất cả việc làm</Link>
          </div>
        </Container>
      </Section>

      {/* Journey — Từ Hà Nội đến Seoul (editorial side-image) */}
      <Section className="py-12 sm:py-16">
        <Container>
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <MediaFrame
                src="/images/journey.jpg"
                alt="Hành trình sang Hàn Quốc"
                scrim="bottom"
                star
                className="aspect-[4/5] w-full"
              >
                <div className="mt-auto p-6">
                  <span className="bilingual-kr text-white/80" lang="ko" aria-hidden="true">출발</span>
                  <p className="font-display text-2xl font-bold text-white">Hà Nội → Seoul</p>
                </div>
              </MediaFrame>
            </Reveal>

            <div>
              <Eyebrow>Hành trình · 여정</Eyebrow>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Bốn bước, một cây cầu
              </h2>
              <p className="mt-3 text-muted-foreground">Từ lúc đo độ sẵn sàng đến khi đặt chân tới Hàn — KBRIDGE đi cùng bạn.</p>

              <ol className="mt-7 flex flex-col">
                {JOURNEY.map((w, i) => (
                  <Reveal as="li" key={w.title} delay={i * 0.05} className="flex gap-4 border-l border-border pb-7 pl-5 last:pb-0">
                    <div className="relative -ml-[1.65rem] flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <w.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="signage-num text-xs text-muted-foreground">0{i + 1}</span>
                        <span className="bilingual-kr" lang="ko" aria-hidden="true">{w.kr}</span>
                      </div>
                      <p className="font-semibold">{w.title}</p>
                      <p className="text-sm text-muted-foreground">{w.desc}</p>
                    </div>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </Section>

      {/* Readiness teaser */}
      <Section className="py-12 sm:py-16">
        <Container>
          <Reveal className="flex flex-col items-center gap-4 rounded-xl border border-border bg-secondary px-6 py-12 text-center">
            <span className="text-3xl">🔥</span>
            <h2 className="max-w-xl font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Bạn đã sẵn sàng đi Hàn tới đâu?
            </h2>
            <p className="max-w-md text-muted-foreground">Trả lời vài câu, nhận điểm sẵn sàng & danh hiệu vui để khoe với hội bạn.</p>
            <Link to="/readiness" className={cn(buttonVariants({ variant: 'star' }), 'mt-2')}>
              <Sparkles className="h-4 w-4" /> Đo độ sẵn sàng
            </Link>
          </Reveal>
        </Container>
      </Section>

      {/* Final CTA — full-bleed image */}
      <Section className="pb-20 pt-4">
        <Container>
          <MediaFrame src="/images/cta-connect.jpg" alt="Kết nối với doanh nghiệp Hàn Quốc" scrim="full" className="overflow-hidden">
            <div className="flex flex-col items-center px-6 py-20 text-center text-white">
              <span className="bilingual-kr text-white/80" lang="ko" aria-hidden="true">지금 시작하세요</span>
              <h2 className="mt-2 max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Cây cầu đến sự nghiệp tại Hàn đã sẵn sàng
              </h2>
              <p className="mt-3 max-w-md text-white/85">Tạo tài khoản miễn phí, để AI tìm việc khớp với bạn ngay hôm nay.</p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link to="/register" className={cn(buttonVariants({ variant: 'star', size: 'lg' }))}>Đăng ký miễn phí</Link>
                <Link to="/quick-match" className="inline-flex h-13 items-center gap-2 rounded-md border border-white/30 px-7 font-medium text-white transition-colors hover:bg-white/10">
                  Thử Quick Match <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </MediaFrame>
        </Container>
      </Section>
    </>
  );
}
