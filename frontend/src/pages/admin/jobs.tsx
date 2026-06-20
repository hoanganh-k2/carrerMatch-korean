import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Loader2, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchJobs, adminDeleteJob, type Job } from '@/lib/api';

export default function AdminJobsPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setJobs(await fetchJobs());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      jobs.filter(
        (j) =>
          !search ||
          j.title.toLowerCase().includes(search.toLowerCase()) ||
          (j.company?.companyName ?? '').toLowerCase().includes(search.toLowerCase()),
      ),
    [jobs, search],
  );

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('Xóa tin tuyển dụng này? Hành động không thể hoàn tác.')) return;
    setBusyId(id);
    try {
      await adminDeleteJob(id, token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Xóa tin thất bại');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-24 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 w-full space-y-6">
      <div className="space-y-2">
        <p className="eyebrow">Kiểm duyệt</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          Kiểm duyệt tin tuyển dụng
        </h1>
        <p className="text-sm text-muted-foreground">Tổng {jobs.length} tin. Xóa các tin vi phạm.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tiêu đề hoặc công ty..."
          className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-md text-xs focus:outline-none focus:border-primary"
        />
      </div>

      <div className="bg-card border border-border rounded-lg divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-muted-foreground italic text-xs">Không có tin nào</div>
        ) : (
          filtered.map((j) => (
            <div key={j.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <Link to={`/jobs/${j.id}`} className="block font-bold text-sm text-foreground hover:text-primary truncate">
                  {j.title}
                </Link>
                <span className="text-[11px] text-muted-foreground">
                  {j.company?.companyName || '—'} • {j.location} • {j.status || 'active'}
                </span>
              </div>
              <button
                onClick={() => handleDelete(j.id)}
                disabled={busyId === j.id}
                className="px-3 py-2 border border-destructive/40 text-destructive font-semibold text-xs rounded-lg hover:bg-destructive/10 flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {busyId === j.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Xóa
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
