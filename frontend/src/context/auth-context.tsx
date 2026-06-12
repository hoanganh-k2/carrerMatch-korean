import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchProfile } from '@/lib/api';

export type UserRole = 'candidate' | 'recruiter' | 'admin';

interface AuthState {
  token: string | null;
  role: UserRole | null;
  email: string | null;
  userId: string | null;
  displayName: string | null;
  /** true khi đang khôi phục phiên từ localStorage lúc mở app */
  restoring: boolean;
}

interface AuthContextValue extends AuthState {
  /** Gọi sau khi login/register thành công từ AuthModal */
  signIn: (data: {
    accessToken: string;
    user: { id: string; email: string; role: string };
    fullName?: string;
  }) => Promise<UserRole>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'cm_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    role: null,
    email: null,
    userId: null,
    displayName: null,
    restoring: true,
  });

  // Khôi phục phiên từ localStorage khi mở app
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setState((s) => ({ ...s, restoring: false }));
      return;
    }
    fetchProfile(savedToken)
      .then((profile) => {
        setState({
          token: savedToken,
          role: profile.role as UserRole,
          email: profile.email,
          userId: profile.id ?? profile.userId ?? null,
          displayName:
            profile.jobUser?.fullName ||
            profile.company?.companyName ||
            profile.email,
          restoring: false,
        });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setState((s) => ({ ...s, restoring: false }));
      });
  }, []);

  const signIn = useCallback<AuthContextValue['signIn']>(async (data) => {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    const role = data.user.role as UserRole;
    let displayName = data.fullName || data.user.email;
    try {
      const profile = await fetchProfile(data.accessToken);
      displayName =
        profile.jobUser?.fullName ||
        profile.company?.companyName ||
        displayName;
    } catch {
      // Không chặn đăng nhập nếu fetch profile lỗi
    }
    setState({
      token: data.accessToken,
      role,
      email: data.user.email,
      userId: data.user.id,
      displayName,
      restoring: false,
    });
    return role;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({
      token: null,
      role: null,
      email: null,
      userId: null,
      displayName: null,
      restoring: false,
    });
  }, []);

  const value = useMemo(
    () => ({ ...state, signIn, signOut }),
    [state, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  }
  return ctx;
}

/** Đường dẫn trang chủ theo role sau khi đăng nhập */
export function homePathForRole(role: UserRole | null): string {
  switch (role) {
    case 'candidate':
      return '/candidate';
    case 'recruiter':
      return '/recruiter';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
}
