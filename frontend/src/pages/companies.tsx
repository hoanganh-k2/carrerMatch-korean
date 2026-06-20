import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, BadgeCheck, MapPin } from 'lucide-react';
import { fetchCompanies } from '@/lib/api';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { CompanyLogo } from '@/components/ui/company-logo';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Stagger, StaggerItem } from '@/components/motion/stagger';

const PER_PAGE = 9;

interface CompanyLite {
  id: string;
  name: string;
  koreanName?: string;
  logoUrl?: string | null;
  industry?: string;
  location?: string;
  isVerified?: boolean;
  jobsCount?: number;
}

function normalizeCompany(c: any): CompanyLite {
  return {
    id: c.companyId ?? c.company_id ?? c.id,
    name: c.companyName ?? c.company_name ?? 'Công ty',
    koreanName: c.koreanCompanyName ?? c.korean_company_name,
    logoUrl: c.logoUrl ?? c.logo_url ?? null,
    industry: c.industry,
    location: c.location,
    isVerified: c.isVerified ?? c.is_verified,
    jobsCount: c._count?.jobPostings ?? c.jobPostings?.length ?? c.jobsCount,
  };
}

export function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCompanies()
      .then((data) => setCompanies(data.map(normalizeCompany)))
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải công ty'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter(
      (c) => c.name.toLowerCase().includes(term) || (c.industry ?? '').toLowerCase().includes(term),
    );
  }, [companies, q]);

  // Đổi từ khoá → về trang 1
  useEffect(() => setPage(1), [q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const topRef = useRef<HTMLDivElement>(null);
  const goPage = (p: number) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Section>
      <Container>
        <PageHeader
          kr="기업 정보"
          eyebrow="Nhà tuyển dụng"
          title="Công ty công nghệ Hàn Quốc"
          description="Khám phá doanh nghiệp Hàn đang tuyển kỹ sư biết tiếng Hàn."
        />

        <div ref={topRef} className="relative mt-8 max-w-md scroll-mt-24">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên hoặc ngành…" className="pl-10" />
        </div>

        <div className="mt-8">
          {loading ? (
            <LoadingBlock />
          ) : error ? (
            <EmptyState icon={<Building2 />} title="Có lỗi xảy ra" description={error} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Building2 />} title="Không tìm thấy công ty" description="Thử từ khoá khác." />
          ) : (
            <>
            <p className="mb-4 text-sm text-muted-foreground">
              <span className="signage-num font-medium text-foreground">{filtered.length}</span> công ty
            </p>
            <Stagger key={safePage} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paged.map((c) => (
                <StaggerItem key={c.id}>
                  <Link
                    to={`/companies/${c.id}`}
                    className="group flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <CompanyLogo name={c.name} logoUrl={c.logoUrl} size={48} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1 truncate font-semibold group-hover:text-primary">
                          {c.name}
                          {c.isVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                        </p>
                        {c.koreanName && <p className="bilingual-kr truncate" lang="ko">{c.koreanName}</p>}
                      </div>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {c.industry && <Badge variant="outline">{c.industry}</Badge>}
                      {c.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location}</span>}
                    </div>
                    {typeof c.jobsCount === 'number' && c.jobsCount > 0 && (
                      <span className="text-sm font-medium text-primary">
                        <span className="signage-num">{c.jobsCount}</span> tin đang tuyển →
                      </span>
                    )}
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button variant="outline" disabled={safePage <= 1} onClick={() => goPage(safePage - 1)}>Trước</Button>
                <span className="signage-num text-sm text-muted-foreground">Trang {safePage} / {totalPages}</span>
                <Button variant="outline" disabled={safePage >= totalPages} onClick={() => goPage(safePage + 1)}>Sau</Button>
              </div>
            )}
            </>
          )}
        </div>
      </Container>
    </Section>
  );
}
