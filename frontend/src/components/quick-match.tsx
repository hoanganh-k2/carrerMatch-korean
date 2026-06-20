import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Search,
  RotateCcw,
  UserPlus,
  AlertCircle,
  Cable,
  Languages,
  Server,
  Smartphone,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { SkillPicker } from '@/components/skill-picker';
import { JobCard } from '@/components/job-card';
import { searchAdvancedJobsPaged, Job } from '@/lib/api';

/** Các vai trò gợi ý — map sang câu truy vấn ngữ nghĩa cho AI search */
const ROLE_OPTIONS = [
  { label: 'BrSE / Kỹ sư cầu nối', icon: Cable, query: 'BrSE kỹ sư cầu nối tiếng Hàn' },
  { label: 'IT Comtor', icon: Languages, query: 'IT Comtor phiên dịch tiếng Hàn' },
  { label: 'Backend Developer', icon: Server, query: 'Backend Developer' },
  { label: 'Frontend / Mobile', icon: Smartphone, query: 'Frontend Mobile Developer' },
  { label: 'Tất cả vị trí', icon: LayoutGrid, query: '' },
];

/** Trình độ tiếng Hàn — map sang enum TopikLevel cao nhất trong nhóm */
const TOPIK_OPTIONS = [
  { label: 'Chưa học / Không chắc', value: 'NONE' },
  { label: 'Sơ cấp (TOPIK 1–2)', value: 'TOPIK_I_LEVEL_2' },
  { label: 'Trung cấp (TOPIK 3–4)', value: 'TOPIK_II_LEVEL_4' },
  { label: 'Cao cấp (TOPIK 5–6)', value: 'TOPIK_II_LEVEL_6' },
];

const TOTAL_STEPS = 3;

/**
 * Quick Match — wizard 3 bước cho khách chưa đăng nhập.
 * Gọi POST /search/jobs (public, không cần token) và hiển thị việc phù hợp ngay,
 * sau đó mời tạo tài khoản. Tăng khả năng tiếp cận cho người dùng mới.
 */
export function QuickMatch({
  variant = 'section',
}: { variant?: 'section' | 'bare' } = {}) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [roleIdx, setRoleIdx] = useState<number | null>(null);
  const [topik, setTopik] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Job[] | null>(null);

  const canNext =
    (step === 1 && roleIdx !== null) ||
    (step === 2 && topik !== null) ||
    step === 3;

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const role = roleIdx !== null ? ROLE_OPTIONS[roleIdx] : null;
      const paged = await searchAdvancedJobsPaged({
        query: role?.query || undefined,
        topikLevel: topik && topik !== 'NONE' ? topik : undefined,
        skills: skills.length ? skills : undefined,
        limit: 6,
      });
      setResults(paged.data);
    } catch (e: any) {
      setError(e?.message || 'Không tải được kết quả, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setRoleIdx(null);
    setTopik(null);
    setSkills([]);
    setResults(null);
    setError(null);
  };

  const card = (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          {!results ? (
            <div className="p-6 md:p-8">
              {/* Thanh tiến trình */}
              <div className="flex items-center gap-2 mb-6">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i + 1 <= step ? 'bg-primary' : 'bg-secondary'
                    }`}
                  />
                ))}
              </div>

              {/* Bước 1: Vai trò */}
              {step === 1 && (
                <div>
                  <h3 className="font-bold text-foreground mb-4">
                    1. Bạn muốn làm vị trí nào?
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ROLE_OPTIONS.map((r, i) => {
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.label}
                          type="button"
                          onClick={() => setRoleIdx(i)}
                          className={`p-4 rounded-md border text-left transition-all ${
                            roleIdx === i
                              ? 'border-primary bg-accent/60'
                              : 'border-border bg-background hover:border-primary/40'
                          }`}
                        >
                          <Icon className={`mb-2 size-5 ${roleIdx === i ? 'text-primary' : 'text-muted-foreground'}`} />
                          <div className="font-bold text-xs text-foreground leading-snug">
                            {r.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bước 2: TOPIK */}
              {step === 2 && (
                <div>
                  <h3 className="font-bold text-foreground mb-4">
                    2. Trình độ tiếng Hàn của bạn?
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {TOPIK_OPTIONS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTopik(t.value)}
                        className={`p-4 rounded-md border text-center font-bold text-sm transition-all ${
                          topik === t.value
                            ? 'border-primary bg-accent/60 text-primary'
                            : 'border-border bg-background text-foreground hover:border-primary/40'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bước 3: Kỹ năng */}
              {step === 3 && (
                <div>
                  <h3 className="font-bold text-foreground mb-1">
                    3. Bạn có những kỹ năng nào?
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Chọn vài kỹ năng nổi bật (có thể bỏ qua).
                  </p>
                  <SkillPicker selected={skills} onChange={setSkills} label="Kỹ năng của bạn" />
                </div>
              )}

              {error && (
                <div className="mt-5 p-3 bg-destructive/5 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Điều hướng */}
              <div className="flex items-center justify-between mt-7">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={step === 1}
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  className="rounded-lg text-xs gap-1.5 disabled:opacity-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại
                </Button>

                {step < TOTAL_STEPS ? (
                  <Button
                    size="sm"
                    disabled={!canNext}
                    onClick={() => setStep((s) => s + 1)}
                    className="rounded-lg text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Tiếp tục
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={loading}
                    onClick={runSearch}
                    className="rounded-lg text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang tìm...
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        Tìm việc phù hợp
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Kết quả */
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {results.length > 0
                    ? `${results.length} việc phù hợp với bạn`
                    : 'Chưa tìm thấy việc khớp'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="rounded-lg text-xs gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Làm lại
                </Button>
              </div>

              {results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {results.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  Hãy thử bớt bộ lọc hoặc xem toàn bộ việc làm.
                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm" className="rounded-xl text-xs">
                      <Link to="/jobs">Xem tất cả việc làm</Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* CTA tạo tài khoản */}
              <div className="mt-7 p-5 rounded-lg bg-accent/50 border border-primary/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="font-bold text-sm text-foreground">
                    Tạo tài khoản miễn phí để lưu việc & nhận thêm gợi ý
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload CV, ứng tuyển nhanh và để AI matching cá nhân hóa cho bạn.
                  </p>
                </div>
                <Button
                  asChild
                  className="rounded-xl font-bold text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
                >
                  <Link to="/register">
                    <UserPlus className="w-3.5 h-3.5" />
                    Đăng ký miễn phí
                  </Link>
                </Button>
              </div>
            </div>
          )}
    </div>
  );

  if (variant === 'bare') return card;

  return (
    <section className="py-14 border-b border-border">
      <Container size="content">
        <div className="mb-8 max-w-2xl space-y-2">
          <p className="eyebrow">Tìm nhanh — không cần đăng ký</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Việc nào hợp với bạn?
          </h2>
          <p className="text-muted-foreground text-sm">
            Trả lời vài câu hỏi nhanh, AI sẽ gợi ý việc phù hợp ngay lập tức.
          </p>
        </div>
        {card}
      </Container>
    </section>
  );
}
