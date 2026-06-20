import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapPin, Wallet, GraduationCap, Briefcase, Clock, Bookmark, BookmarkCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import {
  fetchJobById, applyJob, saveJob, unsaveJob, checkIsSaved, logCareerEvent,
  getUploadedFileUrl, type Job,
} from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CompanyLogo } from '@/components/ui/company-logo';
import { MatchBadge } from '@/components/ui/match-badge';
import { LoadingBlock } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { ShareButtons } from '@/components/share-buttons';
import { formatSalary, topikLabel, jobTypeLabel, cn } from '@/lib/utils';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function JobDetailPage() {
  const { jobId = '' } = useParams();
  const navigate = useNavigate();
  const { token, role, userId } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [saved, setSaved] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applied, setApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchJobById(jobId)
      .then((j) => {
        setJob(j);
        if (userId) logCareerEvent({ userId, eventType: 'view_job', jobId, deviceType: 'web' });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Không tìm thấy tin'))
      .finally(() => setLoading(false));
  }, [jobId, userId]);

  useEffect(() => {
    if (token && role === 'candidate') {
      checkIsSaved(jobId, token).then((r) => setSaved(r.isSaved)).catch(() => {});
    }
  }, [jobId, token, role]);

  const toggleSave = async () => {
    if (!token) return navigate('/login', { state: { from: `/jobs/${jobId}` } });
    try {
      if (saved) {
        await unsaveJob(jobId, token);
        setSaved(false);
      } else {
        await saveJob(jobId, token);
        setSaved(true);
      }
    } catch {
      /* bỏ qua */
    }
  };

  const submitApply = async () => {
    if (!token) return navigate('/login', { state: { from: `/jobs/${jobId}` } });
    setSubmitting(true);
    setActionError('');
    try {
      await applyJob({ jobId, coverLetter: coverLetter.trim() || undefined }, token);
      setApplied(true);
      setApplyOpen(false);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Nộp đơn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Section><Container><LoadingBlock /></Container></Section>;
  if (error || !job) {
    return (
      <Section>
        <Container>
          <EmptyState icon={<Briefcase />} title="Không tìm thấy tin tuyển dụng" description={error}
            action={<Link to="/jobs"><Button>Về danh sách việc làm</Button></Link>} />
        </Container>
      </Section>
    );
  }

  const shareUrl = `${BASE_URL}/share/jobs/${job.id}`;
  const canApply = !token || role === 'candidate';

  return (
    <Section className="py-10">
      <Container>
        <Link to="/jobs" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tất cả việc làm
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Nội dung chính */}
          <div>
            <div className="flex items-start gap-4">
              <CompanyLogo name={job.company?.companyName} logoUrl={job.company?.logoUrl} size={56} />
              <div className="min-w-0">
                {job.companyId ? (
                  <Link to={`/companies/${job.companyId}`} className="text-sm font-medium text-primary hover:underline">
                    {job.company?.companyName ?? 'Công ty Hàn Quốc'}
                  </Link>
                ) : (
                  <span className="text-sm font-medium">{job.company?.companyName}</span>
                )}
                <h1 className="mt-1 font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{job.title}</h1>
              </div>
              {typeof job.similarityScore === 'number' && <MatchBadge score={job.similarityScore} />}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="cobalt">{topikLabel(job.minTopikRequired)}</Badge>
              {job.jobType && <Badge variant="outline">{jobTypeLabel(job.jobType)}</Badge>}
              {job.requiredSkills.map((s) => <Badge key={s}>{s}</Badge>)}
            </div>

            <div className="mt-8">
              <h2 className="font-display text-lg font-bold">Mô tả công việc</h2>
              <div className="mt-3 whitespace-pre-wrap leading-relaxed text-foreground/90">{job.description}</div>
            </div>

            {job.jdFileUrl && (
              <a href={getUploadedFileUrl(job.jdFileUrl)} target="_blank" rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                Tải mô tả công việc (JD) →
              </a>
            )}
          </div>

          {/* Sidebar ứng tuyển */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-border bg-card p-6">
              <dl className="space-y-3 text-sm">
                <Fact icon={<Wallet className="h-4 w-4" />} label="Lương" value={<span className="signage-num font-semibold">{formatSalary(job.salaryMin, job.salaryMax)}</span>} />
                <Fact icon={<MapPin className="h-4 w-4" />} label="Địa điểm" value={job.location} />
                <Fact icon={<GraduationCap className="h-4 w-4" />} label="Tiếng Hàn" value={topikLabel(job.minTopikRequired)} />
                {typeof job.experienceYearsMin === 'number' && (
                  <Fact icon={<Briefcase className="h-4 w-4" />} label="Kinh nghiệm" value={`${job.experienceYearsMin}+ năm`} />
                )}
                {job.applicationDeadline && (
                  <Fact icon={<Clock className="h-4 w-4" />} label="Hạn nộp" value={new Date(job.applicationDeadline).toLocaleDateString('vi-VN')} />
                )}
              </dl>

              {actionError && <p className="mt-4 text-sm text-destructive">{actionError}</p>}

              {applied ? (
                <div className="mt-5 flex items-center gap-2 rounded-md bg-accent px-3 py-2.5 text-sm font-medium text-accent-foreground">
                  <CheckCircle2 className="h-4 w-4" /> Đã nộp đơn ứng tuyển!
                </div>
              ) : applyOpen ? (
                <div className="mt-5 flex flex-col gap-2">
                  <Textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Thư giới thiệu ngắn (không bắt buộc)…" />
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={submitting} onClick={submitApply}>
                      {submitting ? 'Đang gửi…' : 'Gửi đơn'}
                    </Button>
                    <Button variant="outline" onClick={() => setApplyOpen(false)}>Hủy</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex flex-col gap-2">
                  {canApply ? (
                    <Button className="w-full" onClick={() => (token ? setApplyOpen(true) : navigate('/login', { state: { from: `/jobs/${jobId}` } }))}>
                      {token ? 'Ứng tuyển ngay' : 'Đăng nhập để ứng tuyển'}
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">Đăng nhập bằng tài khoản ứng viên để ứng tuyển.</p>
                  )}
                  <Button variant="outline" className="w-full" onClick={toggleSave}>
                    {saved ? <><BookmarkCheck className="h-4 w-4" /> Đã lưu</> : <><Bookmark className="h-4 w-4" /> Lưu tin</>}
                  </Button>
                </div>
              )}

              <div className="mt-5 border-t border-border pt-4">
                <p className="eyebrow mb-2">Chia sẻ</p>
                <ShareButtons url={shareUrl} title={job.title} text={`Việc làm tại ${job.company?.companyName ?? 'công ty Hàn Quốc'}`} />
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted-foreground">{icon} {label}</dt>
      <dd className={cn('text-right font-medium')}>{value}</dd>
    </div>
  );
}
