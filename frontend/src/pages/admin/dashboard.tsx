import { useEffect, useState } from 'react';
import { Users, Building2, Briefcase, Star } from 'lucide-react';
import { fetchAllUsers, fetchCompanies, fetchJobsPaged, fetchAllReviewsAdmin } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { DashboardShell, adminNav } from '@/components/layout/dashboard-shell';
import { StatCard } from '@/components/ui/stat-card';
import { LoadingBlock } from '@/components/ui/spinner';

export function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ users: 0, companies: 0, jobs: 0, reviews: 0 });
  const [roles, setRoles] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.allSettled([
      fetchAllUsers(token),
      fetchCompanies(),
      fetchJobsPaged({ page: 1, limit: 1 }),
      fetchAllReviewsAdmin(token),
    ]).then(([u, c, j, r]) => {
      const users = u.status === 'fulfilled' ? u.value : [];
      const roleCount: Record<string, number> = {};
      users.forEach((x: any) => { roleCount[x.role] = (roleCount[x.role] ?? 0) + 1; });
      setRoles(roleCount);
      setStats({
        users: users.length,
        companies: c.status === 'fulfilled' ? c.value.length : 0,
        jobs: j.status === 'fulfilled' ? (j.value.total ?? 0) : 0,
        reviews: r.status === 'fulfilled' ? r.value.length : 0,
      });
      setLoading(false);
    });
  }, [token]);

  return (
    <DashboardShell nav={adminNav}>
      {loading ? (
        <LoadingBlock />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard kr="사용자" icon={<Users />} label="Người dùng" value={stats.users} />
            <StatCard kr="기업" icon={<Building2 />} label="Công ty" value={stats.companies} />
            <StatCard kr="채용" icon={<Briefcase />} label="Tin tuyển dụng" value={stats.jobs} />
            <StatCard kr="리뷰" icon={<Star />} label="Đánh giá" value={stats.reviews} />
          </div>

          <section>
            <h2 className="mb-3 font-display text-lg font-bold">Phân bố vai trò</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Ứng viên" value={roles.candidate ?? 0} />
              <StatCard label="Nhà tuyển dụng" value={roles.recruiter ?? 0} />
              <StatCard label="Quản trị" value={roles.admin ?? 0} />
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
