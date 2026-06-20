import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Sparkles,
  Building2,
  Users,
  Briefcase,
  ArrowRight,
  Globe,
  Brain,
  Star,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { CompanyLogo } from '@/components/ui/company-logo';
import { QuickMatch } from '@/components/quick-match';
import { JobCard } from '@/components/job-card';
import { Reveal } from '@/components/motion/reveal';
import { StaggerGroup, StaggerItem } from '@/components/motion/stagger';
import { CountUp } from '@/components/motion/count-up';
import { fadeInUp, heroSequence, heroItem } from '@/lib/motion';
import { useAuth } from '@/context/auth-context';
import { fetchJobsPaged, fetchCompanies, Job } from '@/lib/api';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Semantic Search',
    desc: 'Tìm kiếm ngữ nghĩa thông minh bằng tiếng Việt — AI hiểu ý định, không chỉ từ khóa. Vector search pgvector + NLP.',
  },
  {
    icon: Sparkles,
    title: 'AI Matching cá nhân hóa',
    desc: 'Gợi ý việc làm phù hợp dựa trên hồ sơ, kỹ năng tiếng Hàn (TOPIK), kinh nghiệm và hành vi tìm kiếm của bạn.',
  },
  {
    icon: Globe,
    title: 'Thị trường Việt – Hàn',
    desc: 'Chuyên biệt cho BrSE, IT Comtor, Dev tiếng Hàn. Việc làm tại Hà Nội, TP.HCM, Seoul, Remote và toàn quốc.',
  },
];

const STATS = [
  { to: 500, suffix: '+', label: 'Tin tuyển dụng' },
  { to: 120, suffix: '+', label: 'Doanh nghiệp' },
  { to: 3000, suffix: '+', label: 'Ứng viên đăng ký' },
];

const CATEGORIES = [
  { label: 'BrSE / Kỹ sư cầu nối', count: '120+' },
  { label: 'IT Comtor', count: '80+' },
  { label: 'Backend Developer', count: '200+' },
  { label: 'Frontend / Mobile', count: '150+' },
];

interface CompanyLite {
  companyId: string;
  companyName: string;
  logoUrl?: string | null;
  industry?: string;
  location?: string;
  isVerified?: boolean;
}

/** Tiêu đề section dùng chung: eyebrow + tiêu đề + link "xem tất cả". */
function SectionHead({
  eyebrow,
  title,
  to,
  toLabel = 'Xem tất cả',
}: {
  eyebrow: string;
  title: string;
  to?: string;
  toLabel?: string;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div className="space-y-2">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h2>
      </div>
      {to ? (
        <Button asChild variant="ghost" size="sm" className="gap-1 text-xs font-semibold">
          <Link to={to}>
            {toLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

export default function LandingPage() {
  const { token, role } = useAuth();
  const navigate = useNavigate();

  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [featuredCompanies, setFeaturedCompanies] = useState<CompanyLite[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [paged, companies] = await Promise.all([
          fetchJobsPaged({ page: 1, limit: 6 }),
          fetchCompanies(),
        ]);
        if (!active) return;
        setFeaturedJobs(paged.data ?? []);
        const sorted = [...(companies ?? [])].sort(
          (a, b) => (b?.isVerified ? 1 : 0) - (a?.isVerified ? 1 : 0)
        );
        setFeaturedCompanies(sorted.slice(0, 8));
      } catch {
        /* nền tảng vẫn hiển thị dù lỗi tải dữ liệu nổi bật */
      } finally {
        if (active) setLoadingFeatured(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col">
      {/* ===== HERO: chữ ký = typography lớn + mô-típ cầu nối ===== */}
      <section className="relative overflow-hidden border-b border-border">
        <Container size="content">
          <div className="grid items-center gap-x-10 gap-y-10 py-14 md:py-20 lg:grid-cols-[1fr_minmax(0,26rem)]">
            <motion.div
              variants={heroSequence}
              initial="hidden"
              animate="show"
              className="flex flex-col justify-center gap-6"
            >
              <motion.div variants={heroItem}>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm">
                  <span className="font-semibold text-primary" lang="ko">안녕하세요!</span>
                  <span className="text-muted-foreground">Chào mừng đến với KBRIDGE</span>
                </span>
              </motion.div>

              <motion.h1
                variants={heroItem}
                className="text-4xl font-extrabold leading-[1.04] tracking-tight text-foreground md:text-6xl"
              >
                Cây cầu nối sự nghiệp IT
                <span className="mt-2 block text-primary">
                  Việt Nam <span className="text-spark">↔</span> Hàn Quốc
                </span>
              </motion.h1>

              <motion.p
                variants={heroItem}
                className="max-w-xl text-base leading-relaxed text-muted-foreground"
              >
                Kết nối kỹ sư BrSE, IT Comtor và lập trình viên tiếng Hàn đến các doanh nghiệp công
                nghệ hàng đầu thông qua cơ chế khớp ngữ nghĩa AI.
              </motion.p>

              <motion.div variants={heroItem} className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-11 gap-2 px-6 text-sm font-semibold">
                  <Link to="/jobs">
                    <Sparkles className="h-4 w-4" />
                    Khám phá việc làm
                  </Link>
                </Button>
                {!token && (
                  <Button asChild variant="outline" className="h-11 gap-2 px-6 text-sm font-semibold">
                    <Link to="/register">
                      Tạo tài khoản miễn phí
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {token && role === 'candidate' && (
                  <Button asChild variant="outline" className="h-11 gap-2 px-6 text-sm font-semibold">
                    <Link to="/candidate/recommendations">
                      Việc phù hợp với bạn
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </motion.div>

              <motion.div
                variants={heroItem}
                className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 font-mono text-xs text-muted-foreground"
              >
                {['BrSE', 'IT Comtor', 'Backend', 'DevOps', 'TOPIK 1–6'].map((t, i) => (
                  <span key={t} className="flex items-center gap-5">
                    {i > 0 && <span className="text-border">·</span>}
                    {t}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="show"
              className="flex flex-col justify-center"
            >
              <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Tìm việc trong 30 giây — không cần đăng ký
              </div>
              <QuickMatch variant="bare" />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ===== Stats ===== */}
      <Section spacing="default" className="border-b border-border bg-card">
        <Container size="content">
          <div className="grid grid-cols-3 divide-x divide-border">
            {STATS.map((s) => (
              <div key={s.label} className="px-4 text-center first:pl-0 last:pr-0">
                <div className="font-mono text-3xl font-bold text-foreground md:text-4xl">
                  <CountUp to={s.to} suffix={s.suffix} />
                </div>
                <div className="eyebrow mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* ===== Việc làm nổi bật ===== */}
      <Section spacing="lg" className="border-b border-border">
        <Container size="content">
          <SectionHead eyebrow="Mới cập nhật" title="Việc làm nổi bật" to="/jobs" />

          {loadingFeatured ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-lg border border-border bg-card" />
              ))}
            </div>
          ) : featuredJobs.length > 0 ? (
            <StaggerGroup className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredJobs.map((job) => (
                <StaggerItem key={job.id}>
                  <JobCard job={job} onClick={() => navigate(`/jobs/${job.id}`)} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có tin tuyển dụng để hiển thị.</p>
          )}
        </Container>
      </Section>

      {/* ===== Công ty nổi bật ===== */}
      <Section spacing="lg" className="border-b border-border bg-secondary/30">
        <Container size="content">
          <SectionHead eyebrow="Đối tác tuyển dụng" title="Công ty nổi bật" to="/companies" />

          {loadingFeatured ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />
              ))}
            </div>
          ) : featuredCompanies.length > 0 ? (
            <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCompanies.map((c) => (
                <StaggerItem key={c.companyId}>
                  <Link
                    to={`/companies/${c.companyId}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <CompanyLogo
                      logoUrl={c.logoUrl}
                      name={c.companyName}
                      className="size-12"
                      iconClassName="size-5"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h3 className="truncate text-sm font-bold text-foreground">{c.companyName}</h3>
                        {c.isVerified && (
                          <Check className="size-3.5 shrink-0 text-primary" />
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{c.industry || '—'}</p>
                      {c.location && (
                        <p className="truncate text-xs text-muted-foreground/80">{c.location}</p>
                      )}
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có công ty để hiển thị.</p>
          )}
        </Container>
      </Section>

      {/* ===== Features ===== */}
      <Section spacing="lg" className="border-b border-border">
        <Container size="content">
          <Reveal className="mb-10 max-w-2xl">
            <p className="eyebrow">Vì sao chọn KBRIDGE</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Nền tảng tuyển dụng IT chuyên biệt cho thị trường Việt – Hàn
            </h2>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <StaggerItem
                  key={f.title}
                  className="space-y-3 rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/40"
                >
                  <div className="flex size-11 items-center justify-center rounded-md border border-border text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-foreground">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </Container>
      </Section>

      {/* ===== Job categories ===== */}
      <Section spacing="lg" className="border-b border-border bg-secondary/30">
        <Container size="content">
          <Reveal className="mb-10 max-w-2xl">
            <p className="eyebrow">Ngành nghề</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Khám phá cơ hội theo lĩnh vực
            </h2>
          </Reveal>

          <StaggerGroup className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <StaggerItem key={cat.label}>
                <Link
                  to={`/jobs?q=${encodeURIComponent(cat.label)}`}
                  className="group flex h-full flex-col justify-between rounded-lg border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="font-mono text-3xl font-bold text-primary">{cat.count}</div>
                  <div className="mt-4">
                    <div className="text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {cat.label}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">vị trí đang tuyển</div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* ===== CTA ứng viên / nhà tuyển dụng ===== */}
      <Section spacing="lg">
        <Container size="content">
          <StaggerGroup className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <StaggerItem className="space-y-4 rounded-lg border border-border bg-card p-8">
              <div className="flex size-12 items-center justify-center rounded-md border border-border text-primary">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Dành cho Ứng viên</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tạo hồ sơ, upload CV, nhận gợi ý việc làm cá nhân hóa và ứng tuyển chỉ với vài click.
                Chatbot AI hỗ trợ 24/7.
              </p>
              <div className="flex gap-3">
                <Button asChild size="sm" className="gap-1.5 text-xs font-semibold">
                  <Link to="/register">
                    <ArrowRight className="h-3.5 w-3.5" />
                    Đăng ký ứng viên
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
                  <Link to="/jobs">Xem việc làm</Link>
                </Button>
              </div>
            </StaggerItem>

            <StaggerItem className="space-y-4 rounded-lg border border-border bg-card p-8">
              <div className="flex size-12 items-center justify-center rounded-md border border-border text-primary">
                <Briefcase className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Dành cho Nhà tuyển dụng</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Đăng tin tuyển dụng, nhận danh sách ứng viên phù hợp qua AI matching, quản lý hồ sơ và
                lịch phỏng vấn tập trung.
              </p>
              <div className="flex gap-3">
                <Button asChild size="sm" className="gap-1.5 text-xs font-semibold">
                  <Link to="/register">
                    <Building2 className="h-3.5 w-3.5" />
                    Đăng ký nhà tuyển dụng
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
                  <Link to="/companies">Xem công ty</Link>
                </Button>
              </div>
            </StaggerItem>
          </StaggerGroup>
        </Container>
      </Section>

      {/* ===== Testimonial / điểm nhấn Hàn ===== */}
      <Section spacing="lg" className="border-t border-border bg-card">
        <Container size="prose" className="text-center">
          <Reveal>
            <div className="mb-3 flex items-center justify-center gap-1 text-dancheong-gold">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-dancheong-gold" />
              ))}
            </div>
            <p className="mb-3 text-lg font-semibold leading-relaxed text-foreground md:text-xl">
              "KBRIDGE giúp tôi tìm được việc BrSE tại Seoul chỉ sau 2 tuần. AI matching cực kỳ chính
              xác!"
            </p>
            <span className="text-xs text-muted-foreground">
              — Nguyễn Văn A, BrSE tại Samsung SDS Seoul
            </span>
            <div className="mt-6 font-heading text-2xl font-bold tracking-tight text-primary" lang="ko">
              화이팅! 🇻🇳 × 🇰🇷
            </div>
          </Reveal>
        </Container>
      </Section>
    </div>
  );
}
