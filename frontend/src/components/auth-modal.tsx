import React, { useState } from 'react';
import { X, Mail, Lock, User, Briefcase, Sparkles, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { loginApi, registerApi } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (data: {
    accessToken: string;
    user: { id: string; email: string; role: string };
    fullName?: string;
  }) => void;
}

const inputClass =
  'w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all';

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState<'candidate' | 'recruiter'>('candidate');

  const resetFields = () => {
    setLoginEmail('');
    setLoginPassword('');
    setRegEmail('');
    setRegPassword('');
    setRegFullName('');
    setRegRole('candidate');
    setError(null);
    setShowPassword(false);
  };

  const handleTabSwitch = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await loginApi({ email: loginEmail.trim(), password: loginPassword });
      onAuthSuccess({ ...result });
      resetFields();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Kiểm tra lại email và mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword.trim() || !regFullName.trim()) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (regPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await registerApi({
        email: regEmail.trim(),
        password: regPassword,
        fullName: regFullName.trim(),
        role: regRole,
      });
      onAuthSuccess({ ...result, fullName: regFullName.trim() });
      resetFields();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25">
                <span className="font-extrabold text-lg text-primary-foreground">K</span>
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-base text-foreground">
                  K<span className="text-primary">BRIDGE</span>
                </span>
                <span className="block text-[10px] text-muted-foreground font-semibold tracking-wider">
                  IT 한국어 CAREERS
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              안녕하세요! Cây cầu sự nghiệp IT Việt - Hàn của bạn.
            </p>

            {/* Tab Switcher */}
            <div className="flex bg-secondary rounded-xl p-1 border border-border">
              <button
                onClick={() => handleTabSwitch('login')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === 'login'
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Đăng nhập
              </button>
              <button
                onClick={() => handleTabSwitch('register')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                  activeTab === 'register'
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Đăng ký mới
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mb-3 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-[11px] flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Forms */}
          <div className="px-6 pb-6">
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="email@example.com"
                      className={inputClass}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Đăng nhập</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-muted-foreground">
                  Chưa có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('register')}
                    className="text-primary hover:underline font-semibold"
                  >
                    Đăng ký ngay
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="email@example.com"
                      className={inputClass}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
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
                  {regPassword.length > 0 && regPassword.length < 8 && (
                    <p className="text-[10px] text-amber-600 pl-1">
                      Cần thêm {8 - regPassword.length} ký tự nữa
                    </p>
                  )}
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Bạn là
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('candidate')}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                        regRole === 'candidate'
                          ? 'bg-accent border-primary/50 shadow-sm'
                          : 'bg-background border-border hover:border-primary/30'
                      }`}
                    >
                      <User
                        className={`w-5 h-5 mb-1.5 ${regRole === 'candidate' ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                      <span
                        className={`text-xs font-bold block ${regRole === 'candidate' ? 'text-primary' : 'text-foreground/70'}`}
                      >
                        Ứng viên
                      </span>
                      <span className="text-[10px] text-muted-foreground">Tìm việc IT tiếng Hàn</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('recruiter')}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                        regRole === 'recruiter'
                          ? 'bg-accent border-primary/50 shadow-sm'
                          : 'bg-background border-border hover:border-primary/30'
                      }`}
                    >
                      <Briefcase
                        className={`w-5 h-5 mb-1.5 ${regRole === 'recruiter' ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                      <span
                        className={`text-xs font-bold block ${regRole === 'recruiter' ? 'text-primary' : 'text-foreground/70'}`}
                      >
                        Nhà tuyển dụng
                      </span>
                      <span className="text-[10px] text-muted-foreground">Đăng tin tuyển dụng</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Tạo tài khoản — 화이팅!</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-muted-foreground">
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('login')}
                    className="text-primary hover:underline font-semibold"
                  >
                    Đăng nhập
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
