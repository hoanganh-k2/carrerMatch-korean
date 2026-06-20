import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { fetchMySavedJobs, type Job } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, candidateNav } from '@/components/layout/dashboard-shell';
import { JobCard } from '@/components/job-card';
import { LoadingBlock } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { Pagination, paginate } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

const PER_PAGE = 9;

export function SavedJobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(jobs.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (!token) return;
    fetchMySavedJobs(token)
      .then(setJobs)
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải tin đã lưu'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <DashboardShell
      nav={candidateNav}
      kr="저장한 채용"
      eyebrow="Tin đã lưu"
      title="Việc làm đã lưu"
      description="Những tin bạn đã đánh dấu để xem lại."
    >
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <EmptyState icon={<Bookmark />} title="Có lỗi xảy ra" description={error} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Bookmark />}
          title="Chưa lưu tin nào"
          description="Bấm 'Lưu tin' ở trang chi tiết việc làm để xem lại sau."
          action={<Link to="/jobs" className={cn(buttonVariants())}>Khám phá việc làm</Link>}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {paginate(jobs, safePage, PER_PAGE).map((j) => <JobCard key={j.id} job={j} />)}
          </div>
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </DashboardShell>
  );
}
