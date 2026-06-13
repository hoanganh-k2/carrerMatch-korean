import React, { useEffect, useState } from 'react';
import { Star, Loader2, Trash2, MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchAllReviewsAdmin, deleteReview } from '@/lib/api';

export default function AdminReviewsPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    try {
      setReviews(await fetchAllReviewsAdmin(token));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!confirm('Xóa đánh giá này?')) return;
    setBusyId(id);
    try {
      await deleteReview(id, token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Xóa đánh giá thất bại');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-24 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Kiểm duyệt đánh giá công ty
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Tổng {reviews.length} đánh giá. Gỡ các đánh giá vi phạm.</p>
      </div>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl px-4 py-10 text-center text-muted-foreground italic text-xs">
            Chưa có đánh giá nào
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-foreground">{r.companyName}</span>
                  <span className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-500' : 'text-muted'}`} />
                    ))}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{r.reviewText}</p>
                <span className="text-[10px] text-muted-foreground block mt-1.5">
                  {r.isAnonymous ? 'Ẩn danh' : r.reviewerName} • {r.reviewerEmail} •{' '}
                  {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                disabled={busyId === r.id}
                className="px-3 py-2 border border-destructive/40 text-destructive font-semibold text-xs rounded-lg hover:bg-destructive/10 flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {busyId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Xóa
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
