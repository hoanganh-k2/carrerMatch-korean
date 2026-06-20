import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { fetchRecommendations, normalizeJob } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, candidateNav } from '@/components/layout/dashboard-shell';
import { CompanyLogo } from '@/components/ui/company-logo';
import { Badge } from '@/components/ui/badge';
import { MatchBadge } from '@/components/ui/match-badge';
import { LoadingBlock } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { Pagination, paginate } from '@/components/ui/pagination';
import { formatSalary, topikLabel, cn } from '@/lib/utils';

const PER_PAGE = 6;

export function RecommendationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (!token) return;
    fetchRecommendations(token)
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải gợi ý'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <DashboardShell
      nav={candidateNav}
      kr="추천"
      eyebrow="Gợi ý cho bạn"
      title="Việc làm AI gợi ý"
      description="Dựa trên hồ sơ, kỹ năng và mục tiêu nghề nghiệp của bạn."
    >
      {loading ? (
        <LoadingBlock label="AI đang phân tích hồ sơ của bạn…" />
      ) : error ? (
        <EmptyState icon={<Sparkles />} title="Có lỗi xảy ra" description={error} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title="Chưa có gợi ý phù hợp"
          description="Hoàn thiện hồ sơ (TOPIK, kỹ năng, kinh nghiệm) để AI gợi ý chính xác hơn."
          action={<Link to="/candidate/profile" className={cn(buttonVariants())}>Cập nhật hồ sơ</Link>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {paginate(items, safePage, PER_PAGE).map((item, idx) => {
            const job = normalizeJob(item.job ?? item);
            const score = item.matchScore ?? item.score ?? item.similarity_score ?? job.similarityScore;
            const explanation = item.explanation ?? item.reason;
            const missing: string[] = item.missingSkills ?? item.missing_skills ?? [];
            return (
              <div key={job.id ?? idx} className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <CompanyLogo name={job.company?.companyName} logoUrl={job.company?.logoUrl} size={44} />
                    <div className="min-w-0">
                      <Link to={`/jobs/${job.id}`} className="block truncate font-display text-lg font-bold leading-snug hover:text-primary">
                        {job.title}
                      </Link>
                      <p className="truncate text-sm text-muted-foreground">{job.company?.companyName} · {job.location}</p>
                    </div>
                  </div>
                  {typeof score === 'number' && <MatchBadge score={score} />}
                </div>

                {explanation && (
                  <p className="mt-3 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
                    <Sparkles className="mr-1 inline h-3.5 w-3.5" /> {explanation}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge variant="cobalt">{topikLabel(job.minTopikRequired)}</Badge>
                  <span className="signage-num text-sm font-medium">{formatSalary(job.salaryMin, job.salaryMax)}</span>
                </div>

                {missing.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground">Kỹ năng nên bổ sung:</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {missing.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Link to={`/jobs/${job.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    Xem & ứng tuyển <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </DashboardShell>
  );
}
