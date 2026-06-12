'use client';

import React, { useState } from 'react';
import { X, Mail, Lock, User, Briefcase, Sparkles, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { loginApi, registerApi } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (data: { accessToken: string; user: { id: string; email: string; role: string }; fullName?: string }) => void;
}

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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300">
        {/* Gradient border wrapper */}
        <div className="p-[1px] rounded-2xl bg-gradient-to-br from-indigo-500/40 via-purple-500/20 to-rose-500/40">
          <div className="bg-[#0c1021] rounded-2xl overflow-hidden shadow-2xl shadow-indigo-900/20">
            
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <span className="font-extrabold text-lg text-white">C</span>
                </div>
                <div>
                  <span className="font-extrabold text-base text-white">CareerMatch</span>
                  <span className="ml-1.5 text-[8px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md">
                    IT KOREAN
                  </span>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-zinc-900/80 rounded-xl p-1 border border-zinc-800/60">
                <button
                  onClick={() => handleTabSwitch('login')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    activeTab === 'login'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => handleTabSwitch('register')}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                    activeTab === 'register'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Đăng ký mới
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mx-6 mb-3 p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-[11px] flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Forms */}
            <div className="px-6 pb-6">
              {activeTab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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

                  <p className="text-center text-[11px] text-zinc-500">
                    Chưa có tài khoản?{' '}
                    <button type="button" onClick={() => handleTabSwitch('register')} className="text-indigo-400 hover:text-indigo-300 font-semibold">
                      Đăng ký ngay
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Họ và tên</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Tối thiểu 8 ký tự"
                        className="w-full pl-10 pr-10 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {regPassword.length > 0 && regPassword.length < 8 && (
                      <p className="text-[10px] text-amber-400/80 pl-1">Cần thêm {8 - regPassword.length} ký tự nữa</p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Bạn là</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole('candidate')}
                        className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                          regRole === 'candidate'
                            ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <User className={`w-5 h-5 mb-1.5 ${regRole === 'candidate' ? 'text-indigo-400' : 'text-zinc-500'}`} />
                        <span className={`text-xs font-bold block ${regRole === 'candidate' ? 'text-indigo-300' : 'text-zinc-400'}`}>
                          Ứng viên
                        </span>
                        <span className="text-[10px] text-zinc-500">Tìm việc IT tiếng Hàn</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole('recruiter')}
                        className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                          regRole === 'recruiter'
                            ? 'bg-rose-600/15 border-rose-500/50 shadow-md shadow-rose-500/10'
                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <Briefcase className={`w-5 h-5 mb-1.5 ${regRole === 'recruiter' ? 'text-rose-400' : 'text-zinc-500'}`} />
                        <span className={`text-xs font-bold block ${regRole === 'recruiter' ? 'text-rose-300' : 'text-zinc-400'}`}>
                          Nhà tuyển dụng
                        </span>
                        <span className="text-[10px] text-zinc-500">Đăng tin tuyển dụng</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:via-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Tạo tài khoản</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-zinc-500">
                    Đã có tài khoản?{' '}
                    <button type="button" onClick={() => handleTabSwitch('login')} className="text-indigo-400 hover:text-indigo-300 font-semibold">
                      Đăng nhập
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
