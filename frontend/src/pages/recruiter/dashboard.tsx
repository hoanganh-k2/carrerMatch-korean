import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Eye,
  Users,
  TrendingUp,
  Loader2,
  Building2,
  BadgeCheck,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { fetchRecruiterDashboard } from '@/lib/api';

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="p-5 bg-card border border-border rounded-2xl flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="leading-tight">
        <span className="block text-xl font-extrabold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
    </div>
  );
}

const APP_STATUS_LABELS: Record<string, string> = {
  applied: 'Đã nộp',
  screening: 'Đang xem xét',
  interview: 'Phỏng vấn',
  offer: 'Offer',
  rejected: 'Từ chối',
  accepted: 'Đã nhận',
};

export default function RecruiterDashboardPage() {
  const { token, displayName } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchRecruiterDashboard(token)
      .then(setData)
      .catch((err) => console.error('Lỗi tải dashboard:', err))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-24 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
      </main>
    );
  }

  // Chưa có company
  if (!data?.company) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-10 w-full">
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
          <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-extrabold text-lg text-foreground mb-2">
            안녕하세요, {displayName || 'bạn'}!
          </h3>
          <p className="text-muted-foreground text-xs mb-5">
            Tạo hồ sơ công ty để bắt đầu đăng tin và sử dụng AI matching ứng viên.
          </p>
          <Link
            to="/recruiter/company"
            className="inline-block text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg px-5 py-2.5"
          >
            Tạo hồ sơ công ty ngay
          </Link>
        </div>
      </main>
    );
  }

  const totalApps = data.applications?.total ?? 0;
  const appsByStatus: Record<string, number> = data.applications?.byStatus ?? {};

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 w-full space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            {data.company.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng quan hoạt động tuyển dụng của công ty bạn.
          </p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
            data.company.isVerified
              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25'
              : 'bg-amber-500/10 text-amber-700 border border-amber-500/25'
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          {data.company.isVerified ? 'Đã xác thực' : 'Chờ admin duyệt'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Briefcase} label="Tin tuyển dụng" value={data.jobPostings?.total ?? 0} />
        <StatCard icon={Eye} label="Tổng lượt xem" value={data.jobPostings?.totalViews ?? 0} />
        <StatCard icon={Users} label="Tổng đơn ứng tuyển" value={totalApps} />
        <StatCard
          icon={TrendingUp}
          label="Tỉ lệ chuyển đổi xem → nộp"
          value={data.jobPostings?.conversionRate ?? 'N/A'}
        />
        <StatCard icon={Bell} label="Thông báo chưa đọc" value={data.unreadNotifications ?? 0} />
      </div>

      {/* Funnel đơn ứng tuyển */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wide">
          Phễu tuyển dụng (Funnel)
        </h2>
        {totalApps === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có đơn ứng tuyển nào.</p>
        ) : (
          <div className="space-y-2.5">
            {Object.entries(APP_STATUS_LABELS).map(([status, label]) => {
              const count = appsByStatus[status] ?? 0;
              const pct = totalApps > 0 ? (count / totalApps) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3 text-xs">
                  <span className="w-28 shrink-0 font-semibold text-muted-foreground">{label}</span>
                  <div className="flex-1 h-5 rounded-md bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded-md transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-bold text-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trạng thái tin */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wide">
            Tin tuyển dụng theo trạng thái
          </h2>
          <Link to="/recruiter/jobs" className="text-xs font-bold text-primary hover:underline">
            Quản lý tin →
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(data.jobPostings?.byStatus ?? {}).map(([status, count]) => (
            <div key={status} className="px-4 py-3 bg-secondary/60 border border-border rounded-xl text-center">
              <span className="block text-lg font-extrabold text-foreground">{count as number}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{status}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
