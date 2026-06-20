import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, RotateCcw, Check } from 'lucide-react';
import { searchAdvancedJobsPaged, type Job } from '@/lib/api';
import { Container } from '@/components/ui/container';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Button, buttonVariants } from '@/components/ui/button';
import { SkillPicker } from '@/components/skill-picker';
import { JobCard } from '@/components/job-card';
import { LoadingBlock } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

const ROLES = [
  { value: 'BrSE', label: 'BrSE — Kỹ sư cầu nối', kr: '브릿지 SE' },
  { value: 'IT Comtor phiên dịch', label: 'IT Comtor — Phiên dịch IT', kr: 'IT 통역' },
  { value: 'lập trình viên developer', label: 'Lập trình viên', kr: '개발자' },
  { value: 'QA tester kiểm thử', label: 'QA / Tester', kr: 'QA' },
  { value: 'project manager PM BA', label: 'PM / BA', kr: 'PM · BA' },
];

const TOPIKS = [
  { value: 'NONE', label: 'Chưa có / mới học', kr: '없음' },
  { value: 'TOPIK_I_LEVEL_2', label: 'TOPIK 1–2 (sơ cấp)', kr: '초급' },
  { value: 'TOPIK_II_LEVEL_3', label: 'TOPIK 3–4 (trung cấp)', kr: '중급' },
  { value: 'TOPIK_II_LEVEL_5', label: 'TOPIK 5–6 (cao cấp)', kr: '고급' },
];

const STEPS = ['Vai trò', 'Tiếng Hàn', 'Kỹ năng'];

export function QuickMatchPage() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [topik, setTopik] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const [results, setResults] = useState<Job[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runMatch = async () => {
    setLoading(true);
    setError('');
    setStep(3);
    try {
      const data = await searchAdvancedJobsPaged({
        query: [role, ...skills].filter(Boolean).join(' '),
        topikLevel: topik && topik !== 'NONE' ? topik : undefined,
        skills: skills.length ? skills : undefined,
        page: 1,
        limit: 6,
      });
      setResults(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được kết quả');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0); setRole(''); setTopik(''); setSkills([]); setResults(null); setError('');
  };

  // Tóm tắt lựa chọn cho panel trái
  const summary = [
    role ? ROLES.find((r) => r.value === role)?.label : null,
    topik ? TOPIKS.find((t) => t.value === topik)?.label : null,
    skills.length ? `${skills.length} kỹ năng` : null,
  ];

  // ---- Kết quả: full-width, ít cuộn (lưới 3 cột) ----
  if (step === 3) {
    return (
      <section className="py-10">
        <Container className="max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Eyebrow>Kết quả · 결과</Eyebrow>
              <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Việc phù hợp với bạn
              </h1>
            </div>
            <Button variant="outline" onClick={reset}><RotateCcw className="h-4 w-4" /> Làm lại</Button>
          </div>

          <div className="mt-7">
            {loading ? (
              <LoadingBlock label="AI đang tìm việc khớp với bạn…" />
            ) : error ? (
              <EmptyState icon={<Sparkles />} title="Có lỗi xảy ra" description={error} action={<Button onClick={runMatch}>Thử lại</Button>} />
            ) : !results || results.length === 0 ? (
              <EmptyState
                icon={<Sparkles />}
                title="Chưa tìm thấy việc thật khớp"
                description="Thử nới yêu cầu hoặc duyệt toàn bộ việc làm."
                action={<Link to="/jobs" className={cn(buttonVariants())}>Xem tất cả việc làm</Link>}
              />
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  <Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary" />
                  <span className="font-medium text-foreground">{results.length}</span> việc phù hợp nhất
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((j) => <JobCard key={j.id} job={j} />)}
                </div>

                <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-lg border border-border bg-primary p-6 text-primary-foreground sm:flex-row sm:text-left">
                  <div>
                    <p className="font-display text-lg font-bold">Lưu kết quả & nhận việc mới mỗi tuần</p>
                    <p className="text-sm text-primary-foreground/80">Tạo tài khoản miễn phí để theo dõi và ứng tuyển nhanh.</p>
                  </div>
                  <Link to="/register" className={cn(buttonVariants({ variant: 'star' }), 'shrink-0')}>Đăng ký miễn phí</Link>
                </div>
              </>
            )}
          </div>
        </Container>
      </section>
    );
  }

  // ---- Wizard: 2 cột (panel trái + lựa chọn phải) ----
  return (
    <section className="py-10">
      <Container className="max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
          {/* Panel trái: tiêu đề + tiến trình + tóm tắt */}
          <aside className="lg:sticky lg:top-24">
            <Eyebrow>Quick Match · 매칭</Eyebrow>
            <h1 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
              Tìm việc trong 30 giây
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">Không cần đăng nhập. Trả lời 3 câu, AI gợi ý việc ngay.</p>

            <ol className="mt-6 flex flex-col gap-1">
              {STEPS.map((s, i) => {
                const done = i < step;
                const current = i === step;
                return (
                  <li key={s}>
                    <button
                      type="button"
                      disabled={i > step}
                      onClick={() => i <= step && setStep(i)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors',
                        i <= step ? 'hover:bg-accent' : 'cursor-default',
                      )}
                    >
                      <span className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold',
                        done ? 'bg-primary text-primary-foreground' : current ? 'bg-star text-star-foreground' : 'bg-secondary text-muted-foreground',
                      )}>
                        {done ? <Check className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className={cn('block text-sm font-medium', current ? 'text-foreground' : 'text-muted-foreground')}>{s}</span>
                        {summary[i] && <span className="block truncate text-xs text-muted-foreground">{summary[i]}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>

          {/* Cột phải: lựa chọn theo bước */}
          <div>
            {step === 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => { setRole(r.value); setStep(1); }}
                    className={cn(
                      'flex items-center justify-between rounded-lg border bg-card px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-sm',
                      role === r.value ? 'border-primary' : 'border-border',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="bilingual-kr" lang="ko" aria-hidden="true">{r.kr}</span>
                      <span className="block font-semibold">{r.label}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {TOPIKS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => { setTopik(t.value); setStep(2); }}
                    className={cn(
                      'flex flex-col items-start rounded-lg border bg-card px-4 py-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-sm',
                      topik === t.value ? 'border-primary' : 'border-border',
                    )}
                  >
                    <span className="bilingual-kr" lang="ko" aria-hidden="true">{t.kr}</span>
                    <span className="font-semibold">{t.label}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div>
                <p className="mb-4 text-sm text-muted-foreground">Chọn các kỹ năng chính của bạn (tối đa 6).</p>
                <SkillPicker value={skills} onChange={setSkills} max={6} columns />
              </div>
            )}

            {/* Điều hướng */}
            <div className="mt-8 flex items-center justify-between">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => setStep((s) => s - 1)}><ArrowLeft className="h-4 w-4" /> Quay lại</Button>
              ) : <span />}
              {step === 2 && (
                <Button onClick={runMatch}>Xem kết quả <ArrowRight className="h-4 w-4" /></Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
