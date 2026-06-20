import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/container';

const COLUMNS: Array<{ label: string; links: Array<{ to: string; label: string }> }> = [
  {
    label: 'Khám phá',
    links: [
      { to: '/jobs', label: 'Việc làm' },
      { to: '/companies', label: 'Công ty' },
      { to: '/readiness', label: 'Đánh giá mức độ sẵn sàng' },
    ],
  },
  {
    label: 'Ngành nghề',
    links: [
      { to: '/jobs?q=BrSE', label: 'BrSE / Kỹ sư cầu nối' },
      { to: '/jobs?q=Comtor', label: 'IT Comtor' },
      { to: '/jobs?q=Developer', label: 'Developer' },
    ],
  },
  {
    label: 'Tài khoản',
    links: [
      { to: '/login', label: 'Đăng nhập' },
      { to: '/register', label: 'Đăng ký' },
      { to: '/account/settings', label: 'Cài đặt' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <Container size="content" className="grid gap-10 py-14 md:grid-cols-[1.5fr_2fr]">
        {/* Thương hiệu — chữ ký song ngữ */}
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary">
              <span className="font-heading text-lg font-extrabold tracking-tighter text-primary-foreground">
                K
              </span>
            </div>
            <span className="font-heading text-lg font-extrabold tracking-tight text-foreground">
              K<span className="text-primary">BRIDGE</span>
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Cây cầu nối kỹ sư BrSE, IT Comtor và lập trình viên tiếng Hàn đến các doanh nghiệp công
            nghệ Hàn Quốc — bằng AI Semantic Search.
          </p>
          <p className="font-heading text-sm font-bold tracking-tight text-foreground">
            Việt Nam <span className="text-spark">↔</span> Hàn Quốc{' '}
            <span className="text-primary" lang="ko">화이팅!</span>
          </p>
        </div>

        {/* Cột liên kết */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.label} className="space-y-3">
              <p className="eyebrow">{col.label}</p>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      <div className="bridge-rule">
        <Container size="content" className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} KBRIDGE — Sàn tìm việc IT tiếng Hàn.</span>
          <span className="font-mono tracking-wide">Việt Nam · 한국 · Remote</span>
        </Container>
      </div>
    </footer>
  );
}
