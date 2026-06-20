import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Sparkles, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { forgotPassword } from '@/lib/api';

const inputClass =
  'w-full pl-10 pr-4 py-3 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập email.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await forgotPassword(email.trim());
      setMessage(res.message || 'Đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.');
    } catch (err: any) {
      setError(err.message || 'Gửi yêu cầu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          <div className="px-6 pt-8 pb-6 border-b border-border text-center">
            <h1 className="text-xl font-extrabold text-foreground">Quên mật khẩu</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Nhập email tài khoản, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
            </p>
          </div>

          <div className="px-6 py-6">
            {message ? (
              <div className="p-4 rounded-md bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 rounded-md bg-destructive/5 border border-destructive/20 text-destructive text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        autoFocus
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-md shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /><span>Đang gửi...</span></>
                    ) : (
                      <><Sparkles className="w-4 h-4" /><span>Gửi liên kết đặt lại</span></>
                    )}
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 text-center text-[12px] text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline font-semibold">
                ← Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
