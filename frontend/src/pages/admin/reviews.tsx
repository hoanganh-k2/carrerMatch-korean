import { useEffect, useState } from 'react';
import { Trash2, Star, MessageSquare } from 'lucide-react';
import { fetchAllReviewsAdmin, deleteReview } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, adminNav } from '@/components/layout/dashboard-shell';
import { Button } from '@/components/ui/button';
import { LoadingBlock } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination, paginate } from '@/components/ui/pagination';
import { timeAgo, cn } from '@/lib/utils';

const PER_PAGE = 6;

export function AdminReviewsPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    fetchAllReviewsAdmin(token).then(setReviews).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const remove = async (id: string) => {
    if (!token || !confirm('Xóa đánh giá này?')) return;
    setReviews((xs) => xs.filter((r) => (r.id ?? r.reviewId) !== id));
    deleteReview(id, token).catch(() => {});
  };

  const totalPages = Math.max(1, Math.ceil(reviews.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = paginate(reviews, safePage, PER_PAGE);

  return (
    <DashboardShell nav={adminNav} kr="리뷰 관리" eyebrow="Quản trị" title="Kiểm duyệt đánh giá"
      description={`Tổng ${reviews.length} đánh giá công ty.`}>
      {loading ? (
        <LoadingBlock />
      ) : reviews.length === 0 ? (
        <EmptyState icon={<MessageSquare />} title="Chưa có đánh giá nào" />
      ) : (
        <div className="flex flex-col gap-3">
          {paged.map((r, i) => {
            const id = r.id ?? r.reviewId;
            return (
              <div key={id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="signage-num w-7 shrink-0 text-center text-sm font-semibold text-muted-foreground">{(safePage - 1) * PER_PAGE + i + 1}</span>
                    <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{r.companyName ?? r.company?.companyName ?? 'Công ty'}</span>
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={cn('h-3.5 w-3.5', n <= (r.rating ?? 0) ? 'fill-star text-star' : 'text-muted-foreground/40')} />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-foreground/90">{r.reviewText}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.isAnonymous ? 'Ẩn danh' : (r.reviewerName ?? r.candidate?.fullName ?? 'Ứng viên')} · {timeAgo(r.createdAt)}
                    </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 text-destructive" onClick={() => remove(id)}><Trash2 className="h-4 w-4" /></Button>
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
