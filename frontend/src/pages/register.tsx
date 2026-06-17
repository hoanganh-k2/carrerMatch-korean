import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Briefcase, Sparkles, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { registerApi } from '@/lib/api';
import { GoogleLoginButton } from '@/components/google-login-button';
import { useAuth, homePathForRole } from '@/context/auth-context';

const inputClass =
  'w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all';

export default function RegisterPage() {
  const { signIn, token, role } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && role) {
      navigate(homePathForRole(role), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await registerApi({ email: email.trim(), password, fullName: fullName.trim(), role: selectedRole });
      const newRole = await signIn({ ...result, fullName: fullName.trim() });
      navigate(homePathForRole(newRole), { replace: true });
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-accent/30 to-background">
      <div className="w-full max-w-md">
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
            <h1 className="text-xl font-extrabold text-foreground">Tạo tài khoản</h1>
            <p className="text-xs text-muted-foreground mt-1">Tham gia cộng đồng IT tiếng Hàn Việt - Hàn</p>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className={inputClass}
                    autoFocus
                  />
                </div>
              </div>

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
                    placeholder="Tối thiểu 8 ký tự"
                    className={`${inputClass} pr-10`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 8 && (
                  <p className="text-[10px] text-amber-600 pl-1">Cần thêm {8 - password.length} ký tự nữa</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bạn là</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('candidate')}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
                      selectedRole === 'candidate' ? 'bg-accent border-primary/50 shadow-sm' : 'bg-background border-border hover:border-primary/30'
                    }`}
                  >
                    <User className={`w-5 h-5 mb-1.5 ${selectedRole === 'candidate' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-bold block ${selectedRole === 'candidate' ? 'text-primary' : 'text-foreground/70'}`}>
                      Ứng viên
                    </span>
                    <span className="text-[10px] text-muted-foreground">Tìm việc IT tiếng Hàn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('recruiter')}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
                      selectedRole === 'recruiter' ? 'bg-accent border-primary/50 shadow-sm' : 'bg-background border-border hover:border-primary/30'
                    }`}
                  >
                    <Briefcase className={`w-5 h-5 mb-1.5 ${selectedRole === 'recruiter' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-bold block ${selectedRole === 'recruiter' ? 'text-primary' : 'text-foreground/70'}`}>
                      Nhà tuyển dụng
                    </span>
                    <span className="text-[10px] text-muted-foreground">Đăng tin tuyển dụng</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /><span>Đang xử lý...</span></>
                ) : (
                  <><Sparkles className="w-4 h-4" /><span>Tạo tài khoản — 화이팅!</span></>
                )}
              </button>
            </form>

            {/* Phân cách + đăng ký nhanh bằng Google */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">hoặc</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <GoogleLoginButton />

            <div className="mt-6 text-center text-[12px] text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
