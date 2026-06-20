import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, Bookmark, User, FileText,
  Briefcase, Building2, Users, Star, type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DashNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export const candidateNav: DashNavItem[] = [
  { to: '/candidate', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/candidate/recommendations', label: 'Gợi ý việc', icon: Sparkles },
  { to: '/candidate/saved', label: 'Tin đã lưu', icon: Bookmark },
  { to: '/candidate/profile', label: 'Hồ sơ', icon: User },
  { to: '/candidate/resumes', label: 'CV của tôi', icon: FileText },
];

export const recruiterNav: DashNavItem[] = [
  { to: '/recruiter', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/recruiter/jobs', label: 'Tin tuyển dụng', icon: Briefcase },
  { to: '/recruiter/company', label: 'Hồ sơ công ty', icon: Building2 },
];

export const adminNav: DashNavItem[] = [
  { to: '/admin', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/jobs', label: 'Tin tuyển dụng', icon: Briefcase },
  { to: '/admin/reviews', label: 'Đánh giá', icon: Star },
];

interface DashboardShellProps {
  nav: DashNavItem[];
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Giữ để tương thích — không còn hiển thị (đã bỏ header lớn) */
  kr?: string;
  eyebrow?: string;
}

/**
 * Khung dashboard kiểu chuẩn: sidebar sát mép trái (full-height, desktop) →
 * thanh tab cuộn ngang (mobile) + vùng nội dung. Không còn header lớn.
 */
export function DashboardShell({ nav, title, description, actions, children }: DashboardShellProps) {
  return (
    <div className="flex">
      {/* Sidebar sát trái — desktop */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-border bg-card px-3 py-5 lg:block">
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Nav cuộn ngang — mobile */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 lg:hidden">
          {nav.map((item) => (
            <NavItem key={item.to} item={item} compact />
          ))}
        </nav>

        <div className="px-5 py-7 sm:px-8">
          {(title || actions) && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                {title && <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>}
                {description && <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>}
              </div>
              {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

function NavItem({ item, compact }: { item: DashNavItem; compact?: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
          compact ? 'whitespace-nowrap' : '',
          isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        )
      }
    >
      <item.icon className="h-4 w-4" />
      <span className="whitespace-nowrap">{item.label}</span>
    </NavLink>
  );
}
