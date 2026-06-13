import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { JobCard } from '@/components/job-card';
import {
  Search,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  SlidersHorizontal,
  History,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Job,
  fetchJobsPaged,
  searchAdvancedJobsPaged,
  fetchSearchSuggestions,
  fetchMySearchHistory,
  logCareerEvent,
} from '@/lib/api';
import { useAuth } from '@/context/auth-context';

const PAGE_SIZE = 9;

export default function JobsPage() {
  const { token, role, userId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTopik, setSelectedTopik] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [salaryFilter, setSalaryFilter] = useState<number | null>(null);

  const [suggestions, setSuggestions] = useState<Array<{ query: string; searchCount: number }>>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  // Phân trang server-side
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Tải danh sách việc làm theo trang từ server.
  // - Khi có từ khóa hoặc lọc lương → dùng /search/jobs (hỗ trợ semantic + nhiều bộ lọc).
  // - Còn lại (browse + lọc khu vực/topik/hình thức) → dùng /job-postings phân trang.
  const loadJobs = async (
    page = 1,
    overrides?: {
      query?: string;
      locations?: string[];
      topik?: string;
      jobType?: string;
      salary?: number | null;
    },
  ) => {
    const q = (overrides?.query ?? searchQuery).trim();
    const locations = overrides?.locations ?? selectedLocations;
    const topik = overrides?.topik ?? selectedTopik;
    const jobType = overrides?.jobType ?? selectedJobType;
    const salary = overrides?.salary !== undefined ? overrides.salary : salaryFilter;

    setSearching(true);
    setError(null);
    try {
      const useSearchApi = !!q || !!salary || locations.length > 1;
      if (useSearchApi) {
        const res = await searchAdvancedJobsPaged(
          {
            query: q || undefined,
            locations: locations.length > 0 ? locations : undefined,
            salaryMin: salary || undefined,
            topikLevel: topik !== 'all' ? topik : undefined,
            jobType: jobType !== 'all' ? jobType : undefined,
            page,
            limit: PAGE_SIZE,
          },
          token || undefined,
        );
        setJobs(res.data);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total);
        if (q && token) loadSearchHistoryData();
      } else {
        const res = await fetchJobsPaged({
          page,
          limit: PAGE_SIZE,
          location: locations[0],
          jobType: jobType !== 'all' ? jobType : undefined,
          minTopik: topik !== 'all' ? topik : undefined,
          status: 'active',
        });
        setJobs(res.data);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total);
      }
      setCurrentPage(page);
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối API Backend. Hãy đảm bảo NestJS server đang chạy trên cổng 3000.');
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
    loadJobs(1, { query: q ?? '' });
    fetchSearchSuggestions()
      .then((s) => setSuggestions(s.slice(0, 5)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token) loadSearchHistoryData();
    else setSearchHistory([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadSearchHistoryData = async () => {
    if (!token) return;
    try {
      const history = await fetchMySearchHistory(token);
      setSearchHistory(history.slice(0, 5));
    } catch (err) {
      console.error('Lỗi tải lịch sử tìm kiếm:', err);
    }
  };

  const handleAISearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs(1);
  };

  const handleQuickFilter = (filter: string) => {
    setActiveFilter(filter);
    setSelectedTopik('all');
    setSelectedJobType('all');
    setSalaryFilter(null);

    if (filter === 'all') {
      setSearchQuery('');
      setSelectedLocations([]);
      loadJobs(1, { query: '', locations: [], topik: 'all', jobType: 'all', salary: null });
    } else if (filter === 'brse') {
      setSearchQuery('BrSE kỹ sư cầu nối');
      setSelectedLocations([]);
      loadJobs(1, { query: 'BrSE kỹ sư cầu nối', locations: [] });
    } else if (filter === 'comtor') {
      setSearchQuery('Comtor phiên dịch tiếng Hàn');
      setSelectedLocations([]);
      loadJobs(1, { query: 'Comtor phiên dịch tiếng Hàn', locations: [] });
    } else if (filter === 'hanoi') {
      setSearchQuery('');
      setSelectedLocations(['Hà Nội']);
      loadJobs(1, { query: '', locations: ['Hà Nội'] });
    } else if (filter === 'seoul') {
      setSearchQuery('');
      setSelectedLocations(['Seoul']);
      loadJobs(1, { query: '', locations: ['Seoul'] });
    }
  };

  const handleLocationTagToggle = (loc: string) => {
    const updated = selectedLocations.includes(loc)
      ? selectedLocations.filter((l) => l !== loc)
      : [...selectedLocations, loc];
    setSelectedLocations(updated);
    loadJobs(1, { locations: updated });
  };

  const handleOpenJob = (job: Job, position: number) => {
    if (role === 'candidate' && userId) {
      logCareerEvent({
        userId,
        eventType: 'view_job',
        jobId: job.id,
        clickPosition: position + 1,
        deviceType: /Mobi/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
      });
    }
    navigate(`/jobs/${job.id}`);
  };

  return (
    <>
      {/* Search Banner */}
      <section className="pt-12 pb-10 border-b border-border bg-gradient-to-b from-accent/30 to-background">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2 text-center">
            Tìm kiếm việc làm IT tiếng Hàn
          </h1>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Khám phá hàng trăm cơ hội nghề nghiệp BrSE, Comtor và Developer tại Việt Nam & Hàn Quốc
          </p>

          {/* AI Search Bar */}
          <div className="p-1.5 rounded-2xl bg-card border border-border shadow-lg max-w-3xl mx-auto space-y-2">
            <form onSubmit={handleAISearchSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm việc BrSE ở Hà Nội không cần kinh nghiệm, tuyển gấp..."
                  className="pl-10 h-12 bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-xs md:text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`h-12 px-4 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-1.5 transition-all ${
                    showAdvancedFilters ? 'bg-secondary text-foreground' : ''
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="text-xs font-semibold">Bộ lọc</span>
                </Button>

                <Button
                  type="submit"
                  disabled={searching}
                  className="h-12 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 transition-all"
                >
                  {searching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Đang tìm...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs">AI Search</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Hot search suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-muted-foreground font-semibold">Phổ biến:</span>
              {suggestions.map((sug) => (
                <button
                  key={sug.query}
                  onClick={() => {
                    setSearchQuery(sug.query);
                    loadJobs(1, { query: sug.query });
                  }}
                  className="px-2.5 py-1 rounded-full bg-card hover:bg-accent border border-border text-muted-foreground hover:text-accent-foreground transition-colors"
                >
                  #{sug.query}
                </button>
              ))}
            </div>
          )}

          {token && searchHistory.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-muted-foreground font-semibold flex items-center gap-1">
                <History className="w-3 h-3" /> Gần đây:
              </span>
              {searchHistory
                .filter((h) => h.query)
                .slice(0, 4)
                .map((h, idx) => (
                  <button
                    key={`${h.eventId}-${idx}`}
                    onClick={() => {
                      setSearchQuery(h.query);
                      loadJobs(1, { query: h.query });
                    }}
                    className="px-2.5 py-1 rounded-full bg-secondary hover:bg-accent border border-border text-muted-foreground hover:text-accent-foreground transition-colors"
                  >
                    {h.query}
                  </button>
                ))}
            </div>
          )}

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="max-w-3xl mx-auto mt-4 p-5 rounded-2xl bg-card border border-border text-left space-y-4 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-2">Bộ lọc nâng cao</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Khu vực làm việc</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Hà Nội', 'Hồ Chí Minh', 'Seoul', 'Remote', 'Busan', 'Daegu'].map((loc) => {
                      const isSel = selectedLocations.includes(loc);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => handleLocationTagToggle(loc)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            isSel
                              ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                              : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          }`}
                        >
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Trình độ Tiếng Hàn</span>
                  <select
                    value={selectedTopik}
                    onChange={(e) => {
                      setSelectedTopik(e.target.value);
                      loadJobs(1, { topik: e.target.value });
                    }}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="all">Tất cả trình độ</option>
                    <option value="NONE">Không yêu cầu</option>
                    <option value="TOPIK_II_LEVEL_3">TOPIK II - Cấp 3 trở lên</option>
                    <option value="TOPIK_II_LEVEL_4">TOPIK II - Cấp 4 trở lên</option>
                    <option value="TOPIK_II_LEVEL_5">TOPIK II - Cấp 5 trở lên</option>
                    <option value="TOPIK_II_LEVEL_6">TOPIK II - Cấp 6</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-border">
                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Hình thức làm việc</span>
                  <div className="flex gap-2">
                    {['all', 'fulltime', 'hybrid', 'remote'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setSelectedJobType(type);
                          loadJobs(1, { jobType: type });
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          selectedJobType === type
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        {type === 'all' ? 'Tất cả' : type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Mức lương tối thiểu</span>
                  <div className="flex gap-2">
                    {[null, 15000000, 25000000, 45000000].map((sal) => (
                      <button
                        key={String(sal)}
                        type="button"
                        onClick={() => {
                          setSalaryFilter(sal);
                          loadJobs(1, { salary: sal });
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          salaryFilter === sal
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        {sal === null ? 'Bất kỳ' : `>${(sal / 1000000).toFixed(0)}M`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 w-full">
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Thông tin hệ thống</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 border-b border-border pb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'brse', 'comtor', 'hanoi', 'seoul'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleQuickFilter(filter)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide border transition-all uppercase cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground'
                }`}
              >
                {filter === 'all' && 'Tất cả'}
                {filter === 'brse' && 'BRSE'}
                {filter === 'comtor' && 'COMTOR'}
                {filter === 'hanoi' && 'Hà Nội'}
                {filter === 'seoul' && 'Seoul'}
              </button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground font-semibold">
            <span className="text-primary font-extrabold">{totalCount}</span> tin tuyển dụng
            {totalPages > 1 && (
              <span className="ml-2 text-muted-foreground/70">— Trang {currentPage}/{totalPages}</span>
            )}
          </div>
        </div>

        {/* Job grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-60 rounded-2xl bg-card border border-border animate-pulse p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-1/3 bg-secondary rounded" />
                  <div className="h-6 w-3/4 bg-secondary rounded" />
                  <div className="h-4 w-1/2 bg-secondary rounded" />
                </div>
                <div className="h-8 w-1/4 bg-secondary rounded" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
            <HelpCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-extrabold text-lg text-foreground mb-2">Không tìm thấy công việc nào</h3>
            <p className="text-muted-foreground max-w-sm mx-auto text-xs">
              Không có tin tuyển dụng phù hợp. Bấm nút "Tất cả" để reset bộ lọc. 화이팅!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, index) => (
              <JobCard key={job.id} job={job} onClick={() => handleOpenJob(job, (currentPage - 1) * PAGE_SIZE + index)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadJobs(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || searching}
              className="rounded-lg gap-1.5 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              Trước
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-xs text-muted-foreground">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => loadJobs(p as number)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === p
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadJobs(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || searching}
              className="rounded-lg gap-1.5 text-xs font-semibold"
            >
              Tiếp
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>
    </>
  );
}
