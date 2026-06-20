import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { verifyEmail } from '@/lib/api';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Liên kết xác minh không hợp lệ.');
      return;
    }
    verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Xác minh email thành công!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Xác minh email thất bại.');
      });
  }, [token]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-8 text-center shadow-sm">
        {status === 'loading' && (
          <>
            <RefreshCw className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-sm text-foreground">Đang xác minh email...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">{message}</p>
            <Link to="/login" className="inline-block mt-4 text-primary hover:underline text-xs font-semibold">
              Đăng nhập ngay →
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">{message}</p>
            <Link to="/" className="inline-block mt-4 text-primary hover:underline text-xs font-semibold">
              Về trang chủ →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
