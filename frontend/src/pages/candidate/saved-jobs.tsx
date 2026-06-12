import React, { useEffect, useState } from 'react';
import { Bookmark, Loader2, AlertCircle } from 'lucide-react';
import { JobCard } from '@/components/job-card';
import { JobDrawer } from '@/components/job-drawer';
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
      <div>
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-primary" />
          Tin tuyển dụng đã lưu
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {jobs.length} tin bạn đã đánh dấu để xem lại sau.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
          <Bookmark className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-extrabold text-lg text-foreground mb-2">Chưa có tin nào được lưu</h3>
          <p className="text-muted-foreground text-xs">
            Bấm biểu tượng bookmark trong trang chi tiết việc làm để lưu lại tin hấp dẫn.
          </p>
        </div>
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
