import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, MapPin, Globe, Star, Building2 } from 'lucide-react';
import {
  fetchCompanyById, fetchCompanyReviews, createReview, normalizeJob, type Job,
} from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CompanyLogo } from '@/components/ui/company-logo';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/spinner';
import { JobCard } from '@/components/job-card';
import { timeAgo, cn } from '@/lib/utils';

interface ReviewData {
  companyName: string;
  averageRating: number;
  totalReviews: number;
  reviews: any[];
}

export function CompanyDetailPage() {
  const { companyId = '' } = useParams();
  const { token, role } = useAuth();

  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviews, setReviews] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [anon, setAnon] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Phân trang tin tuyển dụng (6 / trang)
  const JOBS_PER_PAGE = 6;
  const [jobPage, setJobPage] = useState(1);
  const jobsTopRef = useRef<HTMLHeadingElement>(null);
  const jobTotalPages = Math.max(1, Math.ceil(jobs.length / JOBS_PER_PAGE));
  const jobSafePage = Math.min(jobPage, jobTotalPages);
  const pagedJobs = jobs.slice((jobSafePage - 1) * JOBS_PER_PAGE, jobSafePage * JOBS_PER_PAGE);
  const goJobPage = (p: number) => {
    setJobPage(p);
    jobsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Phân trang đánh giá (3 / trang)
  const REVIEWS_PER_PAGE = 3;
  const [reviewPage, setReviewPage] = useState(1);
  const reviewsTopRef = useRef<HTMLHeadingElement>(null);
  const allReviews = reviews?.reviews ?? [];
  const reviewTotalPages = Math.max(1, Math.ceil(allReviews.length / REVIEWS_PER_PAGE));
  const reviewSafePage = Math.min(reviewPage, reviewTotalPages);
  const pagedReviews = allReviews.slice((reviewSafePage - 1) * REVIEWS_PER_PAGE, reviewSafePage * REVIEWS_PER_PAGE);
  const goReviewPage = (p: number) => {
    setReviewPage(p);
    reviewsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const loadReviews = () => fetchCompanyReviews(companyId).then(setReviews).catch(() => {});

  useEffect(() => {
    setLoading(true);
    fetchCompanyById(companyId)
      .then((c) => {
        setCompany(c);
        const list = c.jobPostings ?? c.job_postings ?? [];
        setJobs(list.map(normalizeJob));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Không tìm thấy công ty'))
      .finally(() => setLoading(false));
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const submitReview = async () => {
    if (!token) return;
    setSubmitting(true);
    setReviewError('');
    try {
      await createReview({ companyId, rating, reviewText, isAnonymous: anon }, token);
      setReviewText('');
      setReviewPage(1);
      await loadReviews();
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Gửi đánh giá thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Section><Container><LoadingBlock /></Container></Section>;
  if (error || !company) {
    return (
      <Section><Container>
        <EmptyState icon={<Building2 />} title="Không tìm thấy công ty" description={error}
          action={<Link to="/companies"><Button>Về danh bạ công ty</Button></Link>} />
      </Container></Section>
    );
  }

  const name = company.companyName ?? company.company_name;
  const koreanName = company.koreanCompanyName ?? company.korean_company_name;
  const logoUrl = company.logoUrl ?? company.logo_url;
  const website = company.website;
  const verified = company.isVerified ?? company.is_verified;

  return (
    <Section className="py-10">
      <Container>
        <Link to="/companies" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Danh bạ công ty
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center">
          <CompanyLogo name={name} logoUrl={logoUrl} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
              {name}
              {verified && <BadgeCheck className="h-5 w-5 text-primary" />}
            </h1>
            {koreanName && <p className="bilingual-kr mt-0.5 text-sm" lang="ko">{koreanName}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {company.industry && <Badge variant="outline">{company.industry}</Badge>}
              {company.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {company.location}</span>}
              {website && (
                <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                  <Globe className="h-3.5 w-3.5" /> Website
                </a>
              )}
            </div>
          </div>
          {reviews && reviews.totalReviews > 0 && (
            <div className="flex flex-col items-center rounded-md bg-accent px-5 py-3 text-accent-foreground">
              <span className="signage-num text-2xl font-bold">{reviews.averageRating.toFixed(1)}</span>
              <Stars value={Math.round(reviews.averageRating)} />
              <span className="mt-0.5 text-xs">{reviews.totalReviews} đánh giá</span>
            </div>
          )}
        </div>

        {company.description && (
          <div className="mt-8">
            <h2 className="font-display text-lg font-bold">Giới thiệu</h2>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-foreground/90">{company.description}</p>
          </div>
        )}

        {/* Việc làm */}
        <div className="mt-10">
          <h2 ref={jobsTopRef} className="scroll-mt-24 font-display text-lg font-bold">
            Tin tuyển dụng {jobs.length > 0 && <span className="signage-num text-muted-foreground">({jobs.length})</span>}
          </h2>
          {jobs.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Hiện chưa có tin tuyển dụng đang mở.</p>
          ) : (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pagedJobs.map((j) => <JobCard key={j.id} job={j} />)}
              </div>
              {jobTotalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Button variant="outline" disabled={jobSafePage <= 1} onClick={() => goJobPage(jobSafePage - 1)}>Trước</Button>
                  <span className="signage-num text-sm text-muted-foreground">Trang {jobSafePage} / {jobTotalPages}</span>
                  <Button variant="outline" disabled={jobSafePage >= jobTotalPages} onClick={() => goJobPage(jobSafePage + 1)}>Sau</Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Đánh giá */}
        <div className="mt-12">
          <h2 ref={reviewsTopRef} className="scroll-mt-24 font-display text-lg font-bold">
            Đánh giá từ ứng viên {allReviews.length > 0 && <span className="signage-num text-muted-foreground">({allReviews.length})</span>}
          </h2>

          {role === 'candidate' && (
            <div className="mt-4 rounded-lg border border-border bg-card p-5">
              <p className="text-sm font-medium">Viết đánh giá của bạn</p>
              {reviewError && <p className="mt-2 text-sm text-destructive">{reviewError}</p>}
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} sao`}>
                    <Star className={cn('h-6 w-6 transition-colors', n <= rating ? 'fill-star text-star' : 'text-muted-foreground')} />
                  </button>
                ))}
              </div>
              <Textarea className="mt-3" value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Chia sẻ trải nghiệm phỏng vấn / làm việc…" />
              <div className="mt-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                  Ẩn danh
                </label>
                <Button disabled={submitting || !reviewText.trim()} onClick={submitReview}>
                  {submitting ? 'Đang gửi…' : 'Gửi đánh giá'}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-4">
            {allReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
            ) : (
              <>
                {pagedReviews.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {r.isAnonymous ? 'Ẩn danh' : (r.candidate?.fullName ?? 'Ứng viên')}
                      </span>
                      <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                    </div>
                    <Stars value={r.rating} className="mt-1.5" />
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">{r.reviewText}</p>
                  </div>
                ))}
                {reviewTotalPages > 1 && (
                  <div className="mt-2 flex items-center justify-center gap-4">
                    <Button variant="outline" disabled={reviewSafePage <= 1} onClick={() => goReviewPage(reviewSafePage - 1)}>Trước</Button>
                    <span className="signage-num text-sm text-muted-foreground">Trang {reviewSafePage} / {reviewTotalPages}</span>
                    <Button variant="outline" disabled={reviewSafePage >= reviewTotalPages} onClick={() => goReviewPage(reviewSafePage + 1)}>Sau</Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`${value}/5 sao`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn('h-3.5 w-3.5', n <= value ? 'fill-star text-star' : 'text-muted-foreground/40')} />
      ))}
    </div>
  );
}
