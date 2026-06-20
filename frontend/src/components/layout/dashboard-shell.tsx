import * as React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Bookmark,
  User,
  Briefcase,
  Building2,
  Users,
  ClipboardCheck,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Container } from '@/components/ui/container';
import { cn } from '@/lib/utils';

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean };

const MENU_BY_ROLE: Record<string, NavItem[]> = {
  candidate: [
    { to: '/candidate', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/candidate/recommendations', label: 'Dành cho bạn', icon: Sparkles },
    { to: '/candidate/resumes', label: 'CV của tôi', icon: FileText },
    { to: '/candidate/saved', label: 'Việc đã lưu', icon: Bookmark },
    { to: '/candidate/profile', label: 'Hồ sơ', icon: User },
  ],
  recruiter: [
    { to: '/recruiter', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/recruiter/jobs', label: 'Tin tuyển dụng', icon: Briefcase },
    { to: '/recruiter/company', label: 'Công ty', icon: Building2 },
  ],
  admin: [
    { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Người dùng', icon: Users },
    { to: '/admin/jobs', label: 'Kiểm duyệt tin', icon: ClipboardCheck },
    { to: '/admin/reviews', label: 'Đánh giá', icon: Star },
  ],
};

const ROLE_LABEL: Record<string, string> = {
  candidate: 'Ứng viên',
  recruiter: 'Nhà tuyển dụng',
  admin: 'Quản trị viên',
};

/**
 * Khung dashboard chung cho candidate/recruiter/admin: sidebar điều hướng cố định
 * (theo role) + vùng nội dung. Không đổi route — chỉ bọc layout quanh trang.
 * Mobile: sidebar trở thành dải tab cuộn ngang phía trên nội dung.
 */
export function DashboardShell({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const { role } = useAuth();
  const items = (role && MENU_BY_ROLE[role]) || [];

  return (
    <Container size="wide" className="py-6 md:py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-24 space-y-1">
            <div className="px-3 pb-3">
              <p className="eyebrow">{role ? ROLE_LABEL[role] : ''}</p>
              {title ? (
                <h2 className="mt-1 text-lg font-bold text-foreground">{title}</h2>
              ) : null}
            </div>
            {items.map((item) => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </div>
        </aside>

        {/* Dải tab cuộn ngang (mobile) */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:hidden">
          {items.map((item) => (
            <SidebarLink key={item.to} {...item} compact />
          ))}
        </div>

        {/* Nội dung */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </Container>
  );
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  end,
  compact,
}: NavItem & { compact?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg text-sm font-semibold transition-colors',
          compact
            ? 'shrink-0 whitespace-nowrap px-3 py-2'
            : 'px-3 py-2.5',
          isActive
            ? 'bg-accent text-primary'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </NavLink>
  );
}
