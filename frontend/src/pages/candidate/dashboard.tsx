import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CalendarClock, Bookmark, Flame, ArrowRight } from 'lucide-react';
import {
  fetchMyApplications, fetchMyInterviews, fetchMySavedJobs, fetchMyJobUserProfile,
} from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { computeReadiness } from '@/lib/readiness';
import { DashboardShell, candidateNav } from '@/components/layout/dashboard-shell';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { LoadingBlock } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { buttonVariants } from '@/components/ui/button';
import { appStatus, timeAgo, cn } from '@/lib/utils';

export function CandidateDashboardPage() {
  const { token, displayName } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [readiness, setReadiness] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.allSettled([
      fetchMyApplications(token),
      fetchMyInterviews(token),
      fetchMySavedJobs(token),
      fetchMyJobUserProfile(token),
    ]).then(([a, i, s, p]) => {
      if (a.status === 'fulfilled') setApps(a.value);
      if (i.status === 'fulfilled') setInterviews(i.value);
      if (s.status === 'fulfilled') setSavedCount(s.value.length);
      if (p.status === 'fulfilled' && p.value) {
        const prof = p.value;
        setReadiness(
          computeReadiness({
            topikLevel: prof.topikLevel,
            skillCount: (prof.skillsExtracted ?? []).length,
            yearsExperience: prof.yearsExperience,
            isBrSE: prof.isBrSE,
            hasKoreanRole: !!prof.targetKoreanRole,
          }).score,
        );
      }
      setLoading(false);
    });
  }, [token]);

  const upcoming = interviews.filter((iv) => iv.status === 'scheduled');

  return (
    <DashboardShell nav={candidateNav}>
      {loading ? (
        <LoadingBlock />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard kr="지원" icon={<FileText />} label="Đơn ứng tuyển" value={apps.length} />
            <StatCard kr="인터뷰" icon={<CalendarClock />} label="Phỏng vấn sắp tới" value={upcoming.length} />
            <StatCard kr="저장" icon={<Bookmark />} label="Tin đã lưu" value={savedCount} />
            <StatCard kr="준비도" icon={<Flame />} label="Độ sẵn sàng" value={`${readiness}%`} />
          </div>

          {/* Đơn ứng tuyển gần đây */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Đơn ứng tuyển gần đây</h2>
            </div>
            {apps.length === 0 ? (
              <EmptyState
                icon={<FileText />}
                title="Chưa có đơn ứng tuyển"
                description="Tìm việc phù hợp và ứng tuyển ngay."
                action={<Link to="/jobs" className={cn(buttonVariants())}>Xem việc làm</Link>}
              />
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                {apps.slice(0, 6).map((a, i) => {
                  const st = appStatus(a.status);
                  return (
                    <div key={a.applicationId ?? a.id ?? i} className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 last:border-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{a.job?.title ?? a.jobTitle ?? 'Vị trí'}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.job?.company?.companyName ?? ''} · {timeAgo(a.createdAt ?? a.appliedAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {typeof a.matchScore === 'number' && (
                          <span className="signage-num text-xs text-muted-foreground">{Math.round(a.matchScore * 100)}%</span>
                        )}
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Phỏng vấn sắp tới */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-bold">Phỏng vấn sắp tới</h2>
              <div className="flex flex-col gap-3">
                {upcoming.map((iv) => (
                  <div key={iv.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{iv.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(iv.scheduledAt).toLocaleString('vi-VN')}</p>
                    </div>
                    {iv.meetingLink && (
                      <a href={iv.meetingLink} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline">
                        Vào phòng <ArrowRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
