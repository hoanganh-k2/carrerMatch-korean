import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerApi } from '@/lib/api';
import { useAuth, homePathForRole } from '@/context/auth-context';
import { AuthShell, AuthDivider, AuthAlert } from '@/components/auth/auth-shell';
import { GoogleLoginButton } from '@/components/google-login-button';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ROLES = [
  { value: 'candidate', label: 'Tìm việc', kr: '구직자' },
  { value: 'recruiter', label: 'Tuyển dụng', kr: '채용담당' },
] as const;

export function RegisterPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const finish = async (data: any) => {
    const r = await signIn({ accessToken: data.accessToken, user: data.user, fullName: data.user?.fullName ?? fullName });
    navigate(homePathForRole(r), { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await registerApi({ fullName, email, password, role });
      await finish(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      kr="회원가입"
      title="Tạo tài khoản"
      subtitle="Miễn phí — chỉ mất một phút để bắt đầu."
      footer={
        <span>
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Đăng nhập</Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <AuthAlert>{error}</AuthAlert>}

        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              aria-pressed={role === r.value}
              className={cn(
                'flex flex-col items-start rounded-md border px-3 py-2.5 text-left transition-colors',
                role === r.value ? 'border-primary bg-accent' : 'border-border hover:border-foreground/30',
              )}
            >
              <span className="bilingual-kr" lang="ko" aria-hidden="true">{r.kr}</span>
              <span className="text-sm font-semibold">{r.label}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-medium">Họ và tên</label>
          <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">Mật khẩu</label>
          <Input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" />
        </div>

        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
        </Button>
      </form>

      <AuthDivider />
      <GoogleLoginButton onSuccess={finish} onError={setError} />
    </AuthShell>
  );
}
