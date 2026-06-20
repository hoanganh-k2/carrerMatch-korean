import React, { useEffect, useState } from 'react';
import { Bookmark, Loader2, AlertCircle } from 'lucide-react';
import { JobCard } from '@/components/job-card';
import { JobDrawer } from '@/components/job-drawer';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/context/auth-context';
import { Job, fetchMySavedJobs } from '@/lib/api';

export default function SavedJobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchMySavedJobs(token)
      .then(setJobs)
      .catch((err) => setError(err.message || 'Lỗi tải tin đã lưu'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 w-full space-y-8">
      <div className="space-y-2">
        <p className="eyebrow">Việc đã lưu</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-primary" />
          Tin tuyển dụng đã lưu
        </h1>
        <p className="text-sm text-muted-foreground">
          {jobs.length} tin bạn đã đánh dấu để xem lại sau.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-destructive/5 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-6" />}
          title="Chưa có tin nào được lưu"
          description="Bấm biểu tượng bookmark trong trang chi tiết việc làm để lưu lại tin hấp dẫn."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
          ))}
        </div>
      )}

      <JobDrawer
        job={selectedJob}
        isOpen={selectedJob !== null}
        onClose={() => {
          setSelectedJob(null);
          // refresh danh sách (user có thể vừa bỏ lưu trong drawer)
          if (token) {
            fetchMySavedJobs(token).then(setJobs).catch(console.error);
          }
        }}
        token={token}
      />
    </main>
  );
}
