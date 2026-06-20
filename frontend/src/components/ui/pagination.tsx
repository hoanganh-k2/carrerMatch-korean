import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

/** Điều hướng phân trang dùng chung: Trước / Trang x / y / Sau. */
export function Pagination({ page, totalPages, onChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className={`mt-8 flex items-center justify-center gap-4 ${className ?? ''}`}>
      <Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>Trước</Button>
      <span className="signage-num text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
      <Button variant="outline" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Sau</Button>
    </div>
  );
}

/** Cắt mảng theo trang (phân trang phía client). */
export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  return items.slice((page - 1) * perPage, page * perPage);
}
