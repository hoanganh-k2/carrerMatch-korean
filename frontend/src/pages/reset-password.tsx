import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Sparkles, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '@/lib/api';

const inputClass =
  'w-full pl-10 pr-10 py-3 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, password);
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Đặt lại mật khẩu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="text-sm text-foreground font-semibold">Liên kết không hợp lệ</p>
          <p className="text-xs text-muted-foreground mt-1">Thiếu mã đặt lại mật khẩu.</p>
          <Link to="/forgot-password" className="inline-block mt-4 text-primary hover:underline text-xs font-semibold">
            Yêu cầu liên kết mới →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-accent/30 to-background">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 pt-8 pb-6 border-b border-border text-center">
            <h1 className="text-xl font-extrabold text-foreground">Đặt lại mật khẩu</h1>
            <p className="text-xs text-muted-foreground mt-1">Nhập mật khẩu mới cho tài khoản của bạn.</p>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /><span>Đang xử lý...</span></>
                ) : (
                  <><Sparkles className="w-4 h-4" /><span>Đặt lại mật khẩu</span></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
