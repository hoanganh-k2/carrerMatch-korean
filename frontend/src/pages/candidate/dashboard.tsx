import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Bookmark, FileText, Gauge, Sparkles } from 'lucide-react';
import { CandidateDashboard } from '@/components/candidate-dashboard';
import { ReadinessCard } from '@/components/readiness-card';
import { useAuth } from '@/context/auth-context';
import { fetchCandidateDashboard, fetchMyJobUserProfile } from '@/lib/api';
import { computeReadiness, ReadinessResult } from '@/lib/readiness';

/** Thẻ số liệu tổng quan */
function StatCard({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  to?: string;
}) {
  const body = (
    <div className="p-5 bg-card border border-border rounded-lg flex items-center gap-4 hover:border-primary/40 transition-colors h-full">
      <div className="size-11 rounded-md border border-border flex items-center justify-center shrink-0 text-primary">
        <Icon className="w-5 h-5" />
      </div>
      <div className="leading-tight">
        <span className="block font-mono text-xl font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function CandidateDashboardPage() {
  const { token, role, displayName } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchCandidateDashboard(token)
      .then(setStats)
      .catch((err) => console.error('Lỗi tải thống kê dashboard:', err));

    fetchMyJobUserProfile(token)
      .then((p) =>
        setReadiness(
          computeReadiness({
            topikLevel: p.topikLevel,
            skillCount: (p.skillsExtracted ?? []).length,
            yearsExperience: p.yearsExperience,
            isBrSE: p.isBrSE,
            hasKoreanRole: !!p.targetKoreanRole,
          }),
        ),
      )
      .catch((err) => console.error('Lỗi tải hồ sơ cho thẻ readiness:', err));
  }, [token]);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 w-full space-y-8">
      {/* Greeting */}
      <div className="space-y-2">
        <p className="eyebrow">Bảng điều khiển</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          <span lang="ko">안녕하세요</span>, {displayName || 'bạn'}!{' '}
          <span className="text-primary" lang="ko">화이팅!</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Bảng điều khiển cá nhân — theo dõi đơn ứng tuyển, lịch phỏng vấn và đăng ký nhận việc.
        </p>
      </div>

      {/* Stats từ /dashboard/candidate */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Briefcase}
            label="Đơn đã nộp"
            value={stats.overview?.totalApplications ?? 0}
          />
          <StatCard
            icon={Bookmark}
            label="Tin đã lưu"
            value={stats.overview?.savedJobs ?? 0}
            to="/candidate/saved"
          />
          <StatCard
            icon={FileText}
            label="CV của tôi"
            value={stats.overview?.resumes ?? 0}
            to="/candidate/resumes"
          />
          <StatCard
            icon={Gauge}
            label={`Hồ sơ hoàn thiện ${stats.profile?.completeness ?? '0%'}`}
            value={
              <span className="flex items-center gap-1.5">
                {stats.overview?.averageMatchScore ?? 'N/A'}
                <Sparkles className="w-4 h-4 text-primary" />
              </span>
            }
            to="/candidate/profile"
          />
        </div>
      )}

      {/* Thẻ "Mức độ sẵn sàng thị trường Hàn" — chia sẻ được */}
      {readiness && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <ReadinessCard result={readiness} name={displayName || undefined} />
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Tăng điểm sẵn sàng của bạn
            </h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Cập nhật trình độ TOPIK, bổ sung kỹ năng và kinh nghiệm để leo hạng — rồi khoe điểm với bạn bè!
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/candidate/profile"
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
              >
                Cập nhật hồ sơ
              </Link>
              <Link
                to="/readiness"
                className="px-4 py-2 rounded-md border border-border text-xs font-bold text-foreground hover:border-primary/40 transition-colors"
              >
                Xem trang đầy đủ
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Khối applications / interviews / subscriptions hiện có */}
      <CandidateDashboard token={token} role={role} />
    </main>
  );
}
