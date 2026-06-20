import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/lib/api';
import { AuthShell, AuthAlert } from '@/components/auth/auth-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch {
      /* backend luôn trả 200 để tránh dò email — vẫn báo đã gửi */
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthShell
      kr="비밀번호 찾기"
      title="Quên mật khẩu"
      subtitle="Nhập email, chúng tôi sẽ gửi liên kết đặt lại mật khẩu."
      footer={<Link to="/login" className="font-medium text-primary hover:underline">← Quay lại đăng nhập</Link>}
    >
      {sent ? (
        <AuthAlert tone="success">
          Nếu email tồn tại trong hệ thống, bạn sẽ nhận được liên kết đặt lại mật khẩu trong giây lát. Hãy kiểm tra cả hộp thư spam.
        </AuthAlert>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Đang gửi…' : 'Gửi liên kết đặt lại'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
