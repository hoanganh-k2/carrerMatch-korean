import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/auth-context';

/**
 * Bảo vệ route theo role: chưa đăng nhập hoặc sai role → đưa về trang chủ.
 * Trong lúc khôi phục phiên (restoring) hiển thị màn hình chờ để tránh redirect nhầm.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { token, role, restoring } = useAuth();

  if (restoring) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">
            Đang khôi phục phiên đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  if (!token || !role || !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
