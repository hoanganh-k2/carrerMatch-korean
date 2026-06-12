import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Wallet, AlertCircle, GraduationCap, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { fetchRecommendations } from '@/lib/api';

function formatSalary(min: number | null, max: number | null) {
  if (min && max) return `${(min / 1000000).toFixed(0)}M - ${(max / 1000000).toFixed(0)}M VND`;
  if (min) return `Từ ${(min / 1000000).toFixed(0)}M VND`;
  if (max) return `Lên đến ${(max / 1000000).toFixed(0)}M VND`;
  return 'Thỏa thuận';
}

/** Thanh điểm phần trăm */
function ScoreBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${
          pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-primary/60'
        }`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export default function RecommendationsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchRecommendations(token)
      .then(setItems)
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Lỗi tải gợi ý việc làm');
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 w-full space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Việc làm dành cho bạn
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI so khớp hồ sơ của bạn (kỹ năng, TOPIK, kinh nghiệm) với từng tin tuyển dụng và giải
          thích lý do gợi ý.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
          <Lightbulb className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-extrabold text-lg text-foreground mb-2">Chưa có gợi ý nào</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-xs leading-relaxed">
            Hãy cập nhật kỹ năng và trình độ TOPIK trong{' '}
            <Link to="/candidate/profile" className="text-primary font-semibold hover:underline">
              hồ sơ của bạn
            </Link>{' '}
            để AI hiểu bạn hơn nhé. 화이팅!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {items.map((rec) => {
            const pct = Math.round((rec.recommendScore ?? 0) * 100);
            const breakdown = rec.breakdown || {};
            return (
              <div
                key={rec.jobId}
                className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:border-primary/40 transition-colors"
              >
                {/* Title + score */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">
                      {rec.company?.companyName || 'Công ty'}
                    </span>
                    <h3 className="font-extrabold text-base text-foreground leading-snug">
                      {rec.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {rec.location}
                      </span>
                      <span className="flex items-center gap-1 text-primary font-bold">
                        <Wallet className="w-3.5 h-3.5" />
                        {formatSalary(rec.salaryMin, rec.salaryMax)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 text-center bg-accent rounded-xl px-4 py-3">
                    <span className="block text-2xl font-black text-primary">{pct}%</span>
                    <span className="text-[10px] font-bold text-accent-foreground uppercase tracking-wide">
                      Độ phù hợp
                    </span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border">
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground font-semibold">Tương đồng ngữ nghĩa</span>
                        <span className="font-bold text-foreground">{breakdown.semanticMatch}</span>
                      </div>
                      <ScoreBar pct={parseInt(breakdown.semanticMatch) || 0} />
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                      <span>{breakdown.koreanLevelMatch}</span>
                    </div>
                    <div className="text-muted-foreground">
                      Kỹ năng khớp: <strong className="text-foreground">{breakdown.skillMatch}</strong>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-foreground/80 leading-relaxed bg-secondary/60 rounded-lg p-3">
                      <Lightbulb className="w-3.5 h-3.5 text-primary inline mr-1 -mt-0.5" />
                      {breakdown.explanation}
                    </p>
                    {breakdown.missingSkills?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-muted-foreground font-semibold">Cần bổ sung:</span>
                        {breakdown.missingSkills.map((s: string) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px] rounded-md"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Link
                    to={`/?job=${rec.jobId}`}
                    className="text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg px-4 py-2 transition-colors"
                  >
                    Xem chi tiết và ứng tuyển
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
