import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Placeholder cho khu vực dashboard (Phase 2). Route đã được bảo vệ role,
 * nội dung đầy đủ sẽ được dựng ở giai đoạn 2.
 */
export function ComingSoon({ area }: { area: string }) {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="eyebrow mb-3">Khu vực {area}</span>
      <h1 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
        Bảng điều khiển đang được dựng lại
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Giao diện mới cho khu vực {area.toLowerCase()} thuộc giai đoạn 2. Trong lúc chờ, bạn có thể tiếp tục
        khám phá việc làm và công ty.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link to="/jobs" className={cn(buttonVariants())}>Xem việc làm</Link>
        <Link to="/" className={cn(buttonVariants({ variant: 'outline' }))}>Về trang chủ</Link>
      </div>
    </Container>
  );
}
