import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Eye, Users, Plus } from 'lucide-react';
import { fetchMyCompany, normalizeJob, type Job } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, recruiterNav } from '@/components/layout/dashboard-shell';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingBlock } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { topikLabel, formatSalary, cn } from '@/lib/utils';

export function RecruiterDashboardPage() {
  const { token } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchMyCompany(token)
      .then((c) => {
        if (c && (c.companyId || c.id)) {
          setCompany(c);
          setJobs((c.jobPostings ?? c.job_postings ?? []).map(normalizeJob));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const views = jobs.reduce((s, j) => s + (j.viewsCount ?? 0), 0);
  const applies = jobs.reduce((s, j) => s + (j.applyCount ?? 0), 0);

  return (
    <DashboardShell
      nav={recruiterNav}
      actions={company ? <Link to="/recruiter/jobs" className={cn(buttonVariants())}><Plus className="h-4 w-4" /> Đăng tin</Link> : undefined}
    >
      {loading ? (
        <LoadingBlock />
      ) : !company ? (
        <EmptyState
          icon={<Briefcase />}
          title="Bắt đầu tuyển dụng trên KBRIDGE"
          description="Tạo hồ sơ công ty để đăng tin và tiếp cận ứng viên IT biết tiếng Hàn."
          action={<Link to="/recruiter/company" className={cn(buttonVariants())}>Tạo hồ sơ công ty</Link>}
        />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard kr="채용" icon={<Briefcase />} label="Tin đang đăng" value={jobs.length} />
            <StatCard kr="조회" icon={<Eye />} label="Tổng lượt xem" value={views} />
            <StatCard kr="지원" icon={<Users />} label="Tổng lượt ứng tuyển" value={applies} />
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Tin tuyển dụng</h2>
              <Link to="/recruiter/jobs" className="text-sm font-medium text-primary hover:underline">Quản lý tất cả →</Link>
            </div>
            {jobs.length === 0 ? (
              <EmptyState icon={<Briefcase />} title="Chưa có tin nào" description="Đăng tin đầu tiên." action={<Link to="/recruiter/jobs" className={cn(buttonVariants())}>Đăng tin</Link>} />
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                {jobs.slice(0, 6).map((j) => (
                  <Link key={j.id} to={`/recruiter/jobs/${j.id}`} className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 last:border-0 hover:bg-accent">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{j.title}</p>
                      <p className="text-xs text-muted-foreground">{topikLabel(j.minTopikRequired)} · <span className="signage-num">{formatSalary(j.salaryMin, j.salaryMax)}</span></p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {j.viewsCount ?? 0}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {j.applyCount ?? 0}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
