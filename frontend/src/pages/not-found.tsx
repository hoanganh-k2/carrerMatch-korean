import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="signage-num text-6xl font-bold text-primary sm:text-7xl">404</span>
      <span className="bilingual-kr mt-3 text-base" lang="ko" aria-hidden="true">길을 잃었어요</span>
      <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Không tìm thấy trang này</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Có thể đường dẫn đã thay đổi hoặc bị gõ sai. Quay lại và tiếp tục tìm việc nhé.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className={cn(buttonVariants())}>Về trang chủ</Link>
        <Link to="/jobs" className={cn(buttonVariants({ variant: 'outline' }))}>Xem việc làm</Link>
      </div>
    </Container>
  );
}
