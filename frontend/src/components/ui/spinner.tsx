import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Đang tải"
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground',
        className,
      )}
    />
  );
}

/** Khối loading căn giữa cho cả trang/section. */
export function LoadingBlock({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <Spinner className="h-7 w-7 text-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
