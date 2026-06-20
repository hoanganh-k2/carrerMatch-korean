import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Settings, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth, homePathForRole } from '@/context/auth-context';
import { getUploadedFileUrl } from '@/lib/api';
import { Container } from '@/components/ui/container';
import { Button, buttonVariants } from '@/components/ui/button';
import { GridMark } from '@/components/ui/grid-mark';
import { NotificationsMenu } from '@/components/layout/notifications-menu';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/jobs', label: 'Việc làm', kr: '채용' },
  { to: '/companies', label: 'Công ty', kr: '기업' },
  { to: '/quick-match', label: 'Quick Match', kr: '매칭' },
  { to: '/readiness', label: 'Độ sẵn sàng', kr: '준비도' },
];

export function AppHeader({ onLoginClick }: { onLoginClick: () => void }) {
  const { token, displayName, avatarUrl, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi đổi route
  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const avatar = getUploadedFileUrl(avatarUrl);
  const initial = (displayName ?? '?').trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 text-foreground">
          <GridMark size={26} />
          <span className="font-display text-lg font-extrabold tracking-tight">KBRIDGE</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Hành động bên phải */}
        <div className="flex items-center gap-2">
          {!token ? (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={onLoginClick}>
                Đăng nhập
              </Button>
              <Link to="/register" className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:inline-flex')}>
                Đăng ký
              </Link>
            </>
          ) : (
            <>
            <div className="hidden md:block"><NotificationsMenu /></div>
            <div className="relative hidden md:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-accent"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initial}
                </span>
                <span className="max-w-[10rem] truncate text-sm font-medium">{displayName}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg"
                >
                  <MenuItem to={homePathForRole(role)} icon={<LayoutDashboard className="h-4 w-4" />}>
                    Bảng điều khiển
                  </MenuItem>
                  <MenuItem to="/account/settings" icon={<Settings className="h-4 w-4" />}>
                    Cài đặt tài khoản
                  </MenuItem>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-destructive transition-colors hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
            </>
          )}

          {/* Hamburger mobile */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-accent md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Mở menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {/* Nav mobile */}
      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <Container className="flex flex-col py-3">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between rounded-md px-3 py-3 text-base font-medium',
                    isActive ? 'bg-accent text-accent-foreground' : 'text-foreground',
                  )
                }
              >
                {item.label}
                <span className="bilingual-kr" lang="ko" aria-hidden="true">{item.kr}</span>
              </NavLink>
            ))}
            <div className="my-2 border-t border-border" />
            {!token ? (
              <div className="flex gap-2 px-1">
                <Button variant="outline" className="flex-1" onClick={onLoginClick}>Đăng nhập</Button>
                <Link to="/register" className={cn(buttonVariants(), 'flex-1')}>Đăng ký</Link>
              </div>
            ) : (
              <>
                <Link to={homePathForRole(role)} className="rounded-md px-3 py-3 text-base font-medium text-foreground">
                  Bảng điều khiển
                </Link>
                <Link to="/account/settings" className="rounded-md px-3 py-3 text-base font-medium text-foreground">
                  Cài đặt tài khoản
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-md px-3 py-3 text-left text-base font-medium text-destructive"
                >
                  Đăng xuất
                </button>
              </>
            )}
          </Container>
        </div>
      )}
    </header>
  );
}

function MenuItem({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link role="menuitem" to={to} className="flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-accent">
      {icon} {children}
    </Link>
  );
}
