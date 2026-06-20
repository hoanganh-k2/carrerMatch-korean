import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Sparkles, Frown } from 'lucide-react';
import {
  fetchJobsPaged,
  searchAdvancedJobsPaged,
  fetchSearchSuggestions,
  type Job,
  type Paged,
} from '@/lib/api';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/spinner';
import { JobCard } from '@/components/job-card';
import { Stagger, StaggerItem } from '@/components/motion/stagger';

const TOPIK_OPTIONS = [
  { value: '', label: 'Mọi cấp TOPIK' },
  { value: 'NONE', label: 'Không yêu cầu' },
  { value: 'TOPIK_I_LEVEL_2', label: 'TOPIK 2+' },
  { value: 'TOPIK_II_LEVEL_3', label: 'TOPIK 3+' },
  { value: 'TOPIK_II_LEVEL_4', label: 'TOPIK 4+' },
  { value: 'TOPIK_II_LEVEL_5', label: 'TOPIK 5+' },
];

const JOBTYPE_OPTIONS = [
  { value: '', label: 'Mọi loại hình' },
  { value: 'fulltime', label: 'Toàn thời gian' },
  { value: 'parttime', label: 'Bán thời gian' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Mới nhất' },
  { value: 'salaryMax:desc', label: 'Lương cao nhất' },
  { value: 'viewsCount:desc', label: 'Xem nhiều nhất' },
];

const LIMIT = 9;

export function JobsPage() {
  const [searchParams] = useSearchParams();

  const [queryInput, setQueryInput] = useState(searchParams.get('q') ?? '');
  const [submittedQuery, setSubmittedQuery] = useState(searchParams.get('q') ?? '');
  const [location, setLocation] = useState('');
  const [topik, setTopik] = useState('');
  const [jobType, setJobType] = useState('');
  const [sort, setSort] = useState('createdAt:desc');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [result, setResult] = useState<Paged<Job> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetchSearchSuggestions()
      .then((s) => setSuggestions(s.slice(0, 6).map((x) => x.query)))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = submittedQuery.trim();
      const data = q
        ? await searchAdvancedJobsPaged({
            query: q,
            locations: location ? [location] : undefined,
            topikLevel: topik || undefined,
            jobType: jobType || undefined,
            page,
            limit: LIMIT,
          })
        : await fetchJobsPaged({
            page,
            limit: LIMIT,
            location: location || undefined,
            minTopik: topik || undefined,
            jobType: jobType || undefined,
            sort,
          });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách việc làm');
    } finally {
      setLoading(false);
    }
  }, [submittedQuery, location, topik, jobType, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Đổi filter → về trang 1
  const resetAndSet = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSubmittedQuery(queryInput);
  };

  const totalPages = result?.totalPages ?? 1;
  const isSemantic = submittedQuery.trim().length > 0;

  return (
    <Section>
      <Container>
        <PageHeader
          kr="채용 정보"
          eyebrow="Tìm việc"
          title="Việc làm IT tiếng Hàn"
          description="Tìm bằng ngôn ngữ tự nhiên — AI Semantic Search hiểu cả tiếng Việt lẫn tiếng Hàn."
        />

        {/* Thanh tìm kiếm */}
        <form onSubmit={onSearch} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="VD: BrSE biết React lương 30 triệu ở Hà Nội"
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 sm:flex-none">
              <Sparkles className="h-4 w-4" /> Tìm
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowFilters((s) => !s)}>
              <SlidersHorizontal className="h-4 w-4" /> Lọc
            </Button>
          </div>
        </form>

        {/* Gợi ý từ khoá */}
        {suggestions.length > 0 && !isSemantic && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Phổ biến:</span>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQueryInput(s);
                  setSubmittedQuery(s);
                  setPage(1);
                }}
              >
                <Badge variant="outline" className="cursor-pointer hover:border-foreground/40">{s}</Badge>
              </button>
            ))}
          </div>
        )}

        {/* Bộ lọc */}
        {showFilters && (
          <div className="mt-4 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input placeholder="Địa điểm (VD: Hà Nội)" value={location} onChange={(e) => resetAndSet(setLocation)(e.target.value)} />
            <Select value={topik} onChange={(e) => resetAndSet(setTopik)(e.target.value)}>
              {TOPIK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select value={jobType} onChange={(e) => resetAndSet(setJobType)(e.target.value)}>
              {JOBTYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
            <Select value={sort} onChange={(e) => resetAndSet(setSort)(e.target.value)} disabled={isSemantic}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
        )}

        {/* Kết quả */}
        <div className="mt-8">
          {loading ? (
            <LoadingBlock label="Đang tìm việc phù hợp…" />
          ) : error ? (
            <EmptyState icon={<Frown />} title="Có lỗi xảy ra" description={error} action={<Button onClick={load}>Thử lại</Button>} />
          ) : !result || result.data.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="Không tìm thấy việc làm phù hợp"
              description="Thử nới lỏng bộ lọc hoặc dùng từ khoá khác."
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {isSemantic && <Sparkles className="mr-1 inline h-3.5 w-3.5 text-primary" />}
                <span className="signage-num font-medium text-foreground">{result.total}</span> việc làm
                {isSemantic && ' (xếp theo độ phù hợp)'}
              </p>
              <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.data.map((job) => (
                  <StaggerItem key={job.id}>
                    <JobCard job={job} />
                  </StaggerItem>
                ))}
              </Stagger>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
                  <span className="signage-num text-sm text-muted-foreground">Trang {page} / {totalPages}</span>
                  <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau</Button>
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </Section>
  );
}
