import { Link } from 'react-router-dom';
import { GridMark } from '@/components/ui/grid-mark';

interface AuthShellProps {
  kr: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Ảnh nền cho panel thương hiệu (đã xử lý duotone cobalt) */
  image?: string;
}

/** Khung trang auth: panel thương hiệu (desktop) + thẻ form. */
export function AuthShell({ kr, title, subtitle, children, footer, image = '/images/journey.jpg' }: AuthShellProps) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl grid-cols-1 lg:grid-cols-2">
      {/* Panel thương hiệu — chỉ desktop */}
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex">
        {/* Ảnh nền treated (duotone cobalt) — ảnh hiện rõ, chữ trắng vẫn đọc được */}
        <div aria-hidden className="absolute inset-0 isolate">
          <img src={image} alt="" className="h-full w-full object-cover grayscale-[0.9] brightness-[0.62] contrast-[1.05]" />
          <div className="absolute inset-0 bg-cobalt opacity-80 mix-blend-color" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/40 to-primary/55" />
        </div>

        {/* Nội dung — nằm trên ảnh */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2.5">
            <GridMark size={28} />
            <span className="font-display text-xl font-extrabold tracking-tight">KBRIDGE</span>
          </Link>
          <div>
            <span className="font-mono text-sm uppercase tracking-[0.22em] text-primary-foreground/75">다리 / cầu nối</span>
            <p className="mt-4 font-display text-3xl font-bold leading-tight">
              Từ Hà Nội đến Seoul, chỉ cách nhau một hồ sơ.
            </p>
            <p className="mt-4 max-w-sm text-primary-foreground/85">
              Việc làm BrSE, Comtor, Dev tiếng Hàn — khớp đúng người, đúng việc bằng AI.
            </p>
          </div>
          <span lang="ko" className="font-mono text-sm text-primary-foreground/75">화이팅 🇻🇳 ↔ 🇰🇷</span>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <GridMark size={26} />
            <span className="font-display text-lg font-extrabold tracking-tight">KBRIDGE</span>
          </Link>
          <span className="bilingual-kr text-sm" lang="ko" aria-hidden="true">{kr}</span>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/** Hàng phân cách "hoặc" */
export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      hoặc
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Hộp thông báo lỗi/thành công */
export function AuthAlert({ tone = 'error', children }: { tone?: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className={
        tone === 'error'
          ? 'rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive'
          : 'rounded-md border border-primary/30 bg-accent px-3 py-2.5 text-sm text-accent-foreground'
      }
    >
      {children}
    </div>
  );
}
