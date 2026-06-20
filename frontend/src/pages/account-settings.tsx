import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Mail, Trash2, ShieldCheck, ShieldAlert, RefreshCw, CheckCircle2, AlertCircle,
} from 'lucide-react';
import {
  fetchProfile, changePassword, updateMyAccount, deleteMyAccount, resendVerifyEmail,
} from '@/lib/api';
import { useAuth } from '@/context/auth-context';

const inputClass =
  'w-full px-4 py-3 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all';
const labelClass =
  'text-[11px] font-semibold text-muted-foreground uppercase tracking-wider';
const cardClass = 'bg-card border border-border rounded-lg p-6 shadow-sm';

function Banner({ type, text }: { type: 'success' | 'error'; text: string }) {
  const ok = type === 'success';
  return (
    <div
      className={`mb-4 p-3 rounded-md border text-[11px] flex items-start gap-2 ${
        ok
          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600'
          : 'bg-destructive/5 border-destructive/20 text-destructive'
      }`}
    >
      {ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
      <span>{text}</span>
    </div>
  );
}

export default function AccountSettingsPage() {
  const { token, signOut } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchProfile(token)
      .then((p) => {
        setEmail(p.email ?? '');
        setNewEmail(p.email ?? '');
        setIsVerified(Boolean(p.isEmailVerified));
      })
      .catch(() => {});
  }, [token]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      await changePassword({ currentPassword, newPassword }, token);
      setPwMsg({ type: 'success', text: 'Đổi mật khẩu thành công.' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err.message || 'Đổi mật khẩu thất bại.' });
    } finally {
      setPwLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      await updateMyAccount({ email: newEmail.trim() }, token);
      setEmail(newEmail.trim());
      setEmailMsg({ type: 'success', text: 'Cập nhật email thành công.' });
    } catch (err: any) {
      setEmailMsg({ type: 'error', text: err.message || 'Cập nhật email thất bại.' });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendVerify = async () => {
    if (!token) return;
    try {
      const res = await resendVerifyEmail(token);
      setVerifyMsg(res.message || 'Đã gửi lại email xác minh.');
    } catch (err: any) {
      setVerifyMsg(err.message || 'Gửi lại email xác minh thất bại.');
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    try {
      await deleteMyAccount(token);
      signOut();
      navigate('/', { replace: true });
    } catch (err: any) {
      setVerifyMsg(err.message || 'Xóa tài khoản thất bại.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="space-y-2">
        <p className="eyebrow">Tài khoản</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Cài đặt tài khoản</h1>
        <p className="text-xs text-muted-foreground">Quản lý bảo mật và thông tin đăng nhập của bạn.</p>
      </div>

      {/* Trạng thái xác minh email */}
      <div className={cardClass}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isVerified ? (
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-amber-500" />
            )}
            <div>
              <p className="text-sm font-bold text-foreground">{email}</p>
              <p className={`text-[11px] font-semibold ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isVerified ? 'Email đã được xác minh' : 'Email chưa xác minh'}
              </p>
            </div>
          </div>
          {!isVerified && (
            <button
              onClick={handleResendVerify}
              className="text-[11px] font-semibold text-primary hover:underline shrink-0"
            >
              Gửi lại email xác minh
            </button>
          )}
        </div>
        {verifyMsg && <p className="mt-3 text-[11px] text-muted-foreground">{verifyMsg}</p>}
      </div>

      {/* Đổi email */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Đổi email</h2>
        </div>
        {emailMsg && <Banner type={emailMsg.type} text={emailMsg.text} />}
        <form onSubmit={handleChangeEmail} className="space-y-3">
          <div className="space-y-1.5">
            <label className={labelClass}>Email mới</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={emailLoading || newEmail.trim() === email}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-md transition-all disabled:opacity-60"
          >
            {emailLoading ? 'Đang lưu...' : 'Lưu email'}
          </button>
        </form>
      </div>

      {/* Đổi mật khẩu */}
      <div className={cardClass}>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Đổi mật khẩu</h2>
        </div>
        {pwMsg && <Banner type={pwMsg.type} text={pwMsg.text} />}
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="space-y-1.5">
            <label className={labelClass}>Mật khẩu hiện tại</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading || !currentPassword || !newPassword}
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-md transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {pwLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {pwLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>

      {/* Xóa tài khoản */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 className="w-4 h-4 text-destructive" />
          <h2 className="text-sm font-bold text-destructive">Xóa tài khoản</h2>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          Tài khoản sẽ bị vô hiệu hóa và bạn sẽ không thể đăng nhập lại. Hành động này không thể hoàn tác.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-2.5 border border-destructive/40 text-destructive font-bold text-xs rounded-md hover:bg-destructive/10 transition-all"
          >
            Tôi muốn xóa tài khoản
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 bg-destructive text-white font-bold text-xs rounded-md hover:bg-destructive/90 transition-all"
            >
              Xác nhận xóa vĩnh viễn
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2.5 text-muted-foreground font-semibold text-xs hover:text-foreground"
            >
              Hủy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
