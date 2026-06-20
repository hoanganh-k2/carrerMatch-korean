import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Định dạng lương (VND/tháng) gọn: 25.000.000 → "25 triệu" */
export function formatSalary(min?: number | null, max?: number | null): string {
  const toM = (n: number) => {
    const m = n / 1_000_000;
    return Number.isInteger(m) ? `${m}` : m.toFixed(1);
  };
  if (min && max) return `${toM(min)}–${toM(max)} triệu`;
  if (min) return `Từ ${toM(min)} triệu`;
  if (max) return `Đến ${toM(max)} triệu`;
  return 'Thỏa thuận';
}

/** Nhãn TOPIK ngắn từ enum backend */
export function topikLabel(level?: string | null): string {
  switch (level) {
    case 'TOPIK_I_LEVEL_1': return 'TOPIK 1';
    case 'TOPIK_I_LEVEL_2': return 'TOPIK 2';
    case 'TOPIK_II_LEVEL_3': return 'TOPIK 3';
    case 'TOPIK_II_LEVEL_4': return 'TOPIK 4';
    case 'TOPIK_II_LEVEL_5': return 'TOPIK 5';
    case 'TOPIK_II_LEVEL_6': return 'TOPIK 6';
    case 'NONE':
    case null:
    case undefined:
      return 'Không yêu cầu';
    default:
      return level;
  }
}

/** Nhãn loại hình công việc */
export function jobTypeLabel(type?: string | null): string {
  switch (type) {
    case 'fulltime': return 'Toàn thời gian';
    case 'parttime': return 'Bán thời gian';
    case 'remote': return 'Remote';
    case 'hybrid': return 'Hybrid';
    default: return type ?? '';
  }
}

/** Trạng thái đơn ứng tuyển: nhãn + variant Badge */
export const APPLICATION_STATUS: Record<string, { label: string; variant: 'default' | 'cobalt' | 'star' | 'outline' | 'accent' }> = {
  applied: { label: 'Đã nộp', variant: 'default' },
  screening: { label: 'Đang sàng lọc', variant: 'accent' },
  interview: { label: 'Phỏng vấn', variant: 'cobalt' },
  offer: { label: 'Được đề nghị', variant: 'star' },
  accepted: { label: 'Đã nhận', variant: 'cobalt' },
  rejected: { label: 'Từ chối', variant: 'outline' },
};

export function appStatus(status?: string) {
  return APPLICATION_STATUS[status ?? ''] ?? { label: status ?? '—', variant: 'default' as const };
}

/** "3 ngày trước" — thời gian tương đối tiếng Việt */
export function timeAgo(date?: string | null): string {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const day = Math.floor(diff / 86_400_000);
  if (day <= 0) return 'Hôm nay';
  if (day === 1) return 'Hôm qua';
  if (day < 30) return `${day} ngày trước`;
  if (day < 365) return `${Math.floor(day / 30)} tháng trước`;
  return `${Math.floor(day / 365)} năm trước`;
}
