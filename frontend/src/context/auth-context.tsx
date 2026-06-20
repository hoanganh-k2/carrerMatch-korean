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
  avatarUrl: string | null;
  /** true khi đang khôi phục phiên từ localStorage lúc mở app */
  restoring: boolean;
}

interface SignInData {
  accessToken: string;
  user: { id: string; email: string; role: string };
  fullName?: string;
}

interface AuthContextValue extends AuthState {
  signIn: (data: SignInData) => Promise<UserRole>;
  signOut: () => void;
  updateAvatar: (url: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Key token trong localStorage — KHÔNG đổi (hợp đồng với phần còn lại) */
const TOKEN_KEY = 'cm_token';

const EMPTY: AuthState = {
  token: null,
  role: null,
  email: null,
  userId: null,
  displayName: null,
  avatarUrl: null,
  restoring: false,
};

/** Lấy tên hiển thị ưu tiên: ứng viên → công ty → email */
function nameFromProfile(profile: any, fallback: string): string {
  return profile?.jobUser?.fullName || profile?.company?.companyName || fallback;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ ...EMPTY, restoring: true });

  // Khôi phục phiên khi mở app
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
          displayName: nameFromProfile(profile, profile.email),
          avatarUrl: profile.avatarUrl ?? null,
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
    let avatarUrl: string | null = null;
    try {
      const profile = await fetchProfile(data.accessToken);
      displayName = nameFromProfile(profile, displayName);
      avatarUrl = profile.avatarUrl ?? null;
    } catch {
      /* không chặn đăng nhập nếu fetch profile lỗi */
    }
    setState({
      token: data.accessToken,
      role,
      email: data.user.email,
      userId: data.user.id,
      displayName,
      avatarUrl,
      restoring: false,
    });
    return role;
  }, []);

  const updateAvatar = useCallback((url: string) => {
    setState((s) => ({ ...s, avatarUrl: url }));
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ ...EMPTY });
  }, []);

  const value = useMemo(
    () => ({ ...state, signIn, signOut, updateAvatar }),
    [state, signIn, signOut, updateAvatar],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}

/** Trang chủ theo role sau khi đăng nhập */
export function homePathForRole(role: UserRole | null): string {
  switch (role) {
    case 'candidate': return '/candidate';
    case 'recruiter': return '/recruiter';
    case 'admin': return '/admin';
    default: return '/';
  }
}
