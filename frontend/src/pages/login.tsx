import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginApi } from '@/lib/api';
import { useAuth, homePathForRole } from '@/context/auth-context';
import { AuthShell, AuthDivider, AuthAlert } from '@/components/auth/auth-shell';
import { GoogleLoginButton } from '@/components/google-login-button';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const finish = async (data: any) => {
    const role = await signIn({ accessToken: data.accessToken, user: data.user, fullName: data.user?.fullName });
    navigate(from || homePathForRole(role), { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginApi({ email, password });
      await finish(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      kr="로그인"
      title="Đăng nhập"
      subtitle="Tiếp tục hành trình tìm việc IT tiếng Hàn của bạn."
      footer={
        <span>
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">Đăng ký ngay</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <AuthAlert>{error}</AuthAlert>}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Mật khẩu</label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">Quên mật khẩu?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </Button>
      </form>

      <AuthDivider />
      <GoogleLoginButton onSuccess={finish} onError={setError} />
    </AuthShell>
  );
}
