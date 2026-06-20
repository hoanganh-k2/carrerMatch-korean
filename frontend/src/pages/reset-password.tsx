import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '@/lib/api';
import { AuthShell, AuthAlert } from '@/components/auth/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Mật khẩu nhập lại không khớp');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      kr="비밀번호 재설정"
      title="Đặt lại mật khẩu"
      subtitle="Tạo mật khẩu mới cho tài khoản của bạn."
      footer={<Link to="/login" className="font-medium text-primary hover:underline">← Quay lại đăng nhập</Link>}
    >
      {!token ? (
        <AuthAlert>Liên kết không hợp lệ hoặc đã hết hạn. Hãy yêu cầu gửi lại từ trang Quên mật khẩu.</AuthAlert>
      ) : done ? (
        <AuthAlert tone="success">Đổi mật khẩu thành công! Đang chuyển đến trang đăng nhập…</AuthAlert>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <AuthAlert>{error}</AuthAlert>}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">Mật khẩu mới</label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="text-sm font-medium">Nhập lại mật khẩu</label>
            <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu mới" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Đang lưu…' : 'Đặt lại mật khẩu'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
