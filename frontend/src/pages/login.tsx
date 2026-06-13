import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Sparkles, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { loginApi } from '@/lib/api';
import { useAuth, homePathForRole } from '@/context/auth-context';

const inputClass =
  'w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all';

export default function LoginPage() {
  const { signIn, token, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (token && role) {
      navigate(homePathForRole(role), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await loginApi({ email: email.trim(), password });
      const newRole = await signIn(result);
      navigate(homePathForRole(newRole), { replace: true });
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Kiểm tra lại email và mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-accent/30 to-background">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
          {/* Header */}
          <div className="px-6 pt-8 pb-6 border-b border-border text-center">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25">
                <span className="font-extrabold text-lg text-primary-foreground">K</span>
              </div>
              <div className="leading-tight text-left">
                <span className="font-extrabold text-base text-foreground">
                  K<span className="text-primary">BRIDGE</span>
                </span>
                <span className="block text-[10px] text-muted-foreground font-semibold tracking-wider">IT 한국어 CAREERS</span>
              </div>
            </Link>
            <h1 className="text-xl font-extrabold text-foreground">Đăng nhập</h1>
            <p className="text-xs text-muted-foreground mt-1">안녕하세요! Cây cầu sự nghiệp IT Việt - Hàn của bạn.</p>
          </div>

          {/* Form */}
          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className={inputClass}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pr-10`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-[11px] text-primary hover:underline font-semibold">
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /><span>Đang xử lý...</span></>
                ) : (
                  <><Sparkles className="w-4 h-4" /><span>Đăng nhập</span></>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-[12px] text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Đăng ký ngay
              </Link>
            </div>

            <div className="mt-3 text-center">
              <Link to="/jobs" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                Xem việc làm không cần đăng nhập →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
