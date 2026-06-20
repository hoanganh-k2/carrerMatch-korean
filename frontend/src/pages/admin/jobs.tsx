import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Briefcase, ExternalLink } from 'lucide-react';
import { fetchJobsPaged, adminDeleteJob, type Job, type Paged } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, adminNav } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingBlock } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { topikLabel, formatSalary } from '@/lib/utils';

const LIMIT = 6;

export function AdminJobsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Paged<Job> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchJobsPaged({ page, limit: LIMIT }).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!token || !confirm('Xóa tin tuyển dụng này khỏi hệ thống?')) return;
    await adminDeleteJob(id, token);
    load();
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <DashboardShell nav={adminNav} kr="채용 관리" eyebrow="Quản trị" title="Kiểm duyệt tin tuyển dụng"
      description={data ? `Tổng ${data.total} tin trong hệ thống.` : undefined}>
      {loading ? (
        <LoadingBlock />
      ) : !data || data.data.length === 0 ? (
        <EmptyState icon={<Briefcase />} title="Không có tin tuyển dụng" />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            {data.data.map((j, i) => (
              <div key={j.id} className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 last:border-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="signage-num w-7 shrink-0 text-center text-sm font-semibold text-muted-foreground">{(page - 1) * LIMIT + i + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{j.title}</p>
                    <p className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                      {j.company?.companyName ?? '—'}
                      <Badge variant="outline">{topikLabel(j.minTopikRequired)}</Badge>
                      <span className="signage-num">{formatSalary(j.salaryMin, j.salaryMax)}</span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link to={`/jobs/${j.id}`} className="rounded-md p-2 text-muted-foreground hover:bg-accent" aria-label="Xem"><ExternalLink className="h-4 w-4" /></Link>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(j.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
              <span className="signage-num text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau</Button>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
