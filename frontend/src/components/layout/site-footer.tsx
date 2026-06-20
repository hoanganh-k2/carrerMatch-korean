import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/container';
import { GridMark } from '@/components/ui/grid-mark';

const COLS = [
  {
    title: 'Khám phá',
    links: [
      { to: '/jobs', label: 'Việc làm IT tiếng Hàn' },
      { to: '/companies', label: 'Công ty Hàn Quốc' },
      { to: '/quick-match', label: 'Quick Match' },
      { to: '/readiness', label: 'Đo độ sẵn sàng' },
    ],
  },
  {
    title: 'Tài khoản',
    links: [
      { to: '/login', label: 'Đăng nhập' },
      { to: '/register', label: 'Đăng ký' },
      { to: '/forgot-password', label: 'Quên mật khẩu' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Link to="/" className="flex items-center gap-2.5 text-foreground">
            <GridMark size={26} />
            <span className="font-display text-lg font-extrabold tracking-tight">KBRIDGE</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            <span lang="ko">다리</span> — cây cầu nối kỹ sư BrSE, IT Comtor và lập trình viên tiếng Hàn
            đến doanh nghiệp công nghệ Hàn Quốc bằng AI Semantic Search.
          </p>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h4 className="eyebrow mb-4">{col.title}</h4>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} KBRIDGE. Việt ↔ Hàn.</span>
          <span lang="ko" className="font-mono tracking-wide">화이팅 — 함께 다리를 건너요</span>
        </Container>
      </div>
    </footer>
  );
}
