import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, homePathForRole, type UserRole } from '@/context/auth-context';
import { LoadingBlock } from '@/components/ui/spinner';

interface RequireRoleProps {
  roles: UserRole[];
  children: React.ReactNode;
}

/** Chặn route theo role. Chưa đăng nhập → /login; sai role → trang chủ theo role. */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const { token, role, restoring } = useAuth();
  const location = useLocation();

  if (restoring) return <LoadingBlock label="Đang kiểm tra phiên đăng nhập…" />;

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && !roles.includes(role)) {
    return <Navigate to={homePathForRole(role)} replace />;
  }

  return <>{children}</>;
}
