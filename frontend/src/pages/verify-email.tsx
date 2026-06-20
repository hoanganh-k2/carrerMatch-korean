import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { verifyEmail } from '@/lib/api';
import { Container } from '@/components/ui/container';
import { buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Thiếu mã xác minh trong liên kết.');
      return;
    }
    verifyEmail(token)
      .then(() => setStatus('ok'))
      .catch((e) => {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Xác minh email thất bại');
      });
  }, [token]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      {status === 'loading' && (
        <>
          <Spinner className="h-8 w-8 text-primary" />
          <p className="mt-4 text-muted-foreground">Đang xác minh email…</p>
        </>
      )}
      {status === 'ok' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Xác minh thành công!</h1>
          <p className="mt-2 max-w-md text-muted-foreground">Email của bạn đã được xác minh. Giờ bạn có thể đăng nhập và bắt đầu tìm việc.</p>
          <Link to="/login" className={cn(buttonVariants(), 'mt-6')}>Đăng nhập ngay</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="h-12 w-12 text-destructive" />
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Không xác minh được</h1>
          <p className="mt-2 max-w-md text-muted-foreground">{message}</p>
          <Link to="/login" className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}>Về trang đăng nhập</Link>
        </>
      )}
    </Container>
  );
}
