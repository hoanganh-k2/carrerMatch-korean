import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  Briefcase,
  FileText,
  Loader2,
  BadgeCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { fetchAdminDashboard, fetchCompanies, verifyCompany } from '@/lib/api';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="p-5 bg-card border border-border rounded-2xl flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="leading-tight">
        <span className="block text-xl font-extrabold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        {sub && <span className="block text-[10px] text-muted-foreground/70">{sub}</span>}
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

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    try {
      const [dashboard, companyList] = await Promise.all([
        fetchAdminDashboard(token),
        fetchCompanies(),
      ]);
      setData(dashboard);
      setCompanies(companyList);
    } catch (err) {
      console.error('Lỗi tải admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleVerify = async (companyId: string) => {
    if (!token) return;
    setVerifyingId(companyId);
    try {
      await verifyCompany(companyId, token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Duyệt thất bại');
    } finally {
      setVerifyingId(null);
    }
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-24 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
      </main>
    );
  }

  const maxSkillCount = Math.max(1, ...(data?.topSkills ?? []).map((s: any) => s.count));
  const pendingCompanies = companies.filter((c) => !c.isVerified);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 w-full space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          Quản trị hệ thống KBRIDGE
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Thống kê toàn hệ thống: người dùng, công ty, tin tuyển dụng và xu hướng kỹ năng.
        </p>
      </div>

      {/* System stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Người dùng"
          value={data?.users?.total ?? 0}
          sub={`${data?.users?.candidates ?? 0} ứng viên • ${data?.users?.recruiters ?? 0} nhà tuyển dụng`}
        />
        <StatCard
          icon={Building2}
          label="Công ty"
          value={data?.companies?.total ?? 0}
          sub={`${data?.companies?.verified ?? 0} đã xác thực`}
        />
        <StatCard
          icon={Briefcase}
          label="Tin tuyển dụng"
          value={data?.jobPostings?.total ?? 0}
          sub={`${data?.jobPostings?.active ?? 0} đang hoạt động`}
        />
        <StatCard
          icon={FileText}
          label="Đơn ứng tuyển / CV"
          value={data?.applications?.total ?? 0}
          sub={`${data?.resumes ?? 0} CV trong hệ thống`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top skills bar chart */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            Top kỹ năng của ứng viên
          </h2>
          <div className="space-y-2.5">
            {(data?.topSkills ?? []).map((s: any) => (
              <div key={s.skill} className="flex items-center gap-3 text-xs">
                <span className="w-32 shrink-0 font-semibold text-muted-foreground truncate">
                  {s.skill}
                </span>
                <div className="flex-1 h-5 rounded-md bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary/80 rounded-md"
                    style={{ width: `${(s.count / maxSkillCount) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right font-bold text-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Applications by status */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wide">
            Đơn ứng tuyển theo trạng thái
          </h2>
          <div className="flex flex-wrap gap-3">
            {(data?.applications?.byStatus ?? []).map((a: any) => (
              <div key={a.status} className="px-4 py-3 bg-secondary/60 border border-border rounded-xl text-center">
                <span className="block text-lg font-extrabold text-foreground">{a.count}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  {APP_STATUS_LABELS[a.status] ?? a.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Company verification */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wide flex items-center gap-1.5">
          <BadgeCheck className="w-4 h-4 text-primary" />
          Duyệt xác thực công ty ({pendingCompanies.length} chờ duyệt)
        </h2>
        {pendingCompanies.length === 0 ? (
          <p className="text-xs text-muted-foreground">Tất cả công ty đã được xác thực. 화이팅!</p>
        ) : (
          <div className="space-y-3">
            {pendingCompanies.slice(0, 10).map((c) => (
              <div
                key={c.companyId}
                className="flex items-center justify-between gap-4 p-4 bg-background border border-border rounded-xl"
              >
                <div className="min-w-0">
                  <span className="block font-bold text-sm text-foreground truncate">{c.companyName}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {c.industry || 'IT'} • {c.location || '—'} • {c.companySize || '?'} nhân viên
                  </span>
                </div>
                <Button
                  size="sm"
                  disabled={verifyingId === c.companyId}
                  onClick={() => handleVerify(c.companyId)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg flex items-center gap-1.5 shrink-0"
                >
                  {verifyingId === c.companyId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <BadgeCheck className="w-3.5 h-3.5" />
                  )}
                  Duyệt
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
