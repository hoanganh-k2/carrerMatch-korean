import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { JobCard } from '@/components/job-card';
import { JobDrawer } from '@/components/job-drawer';
import {
  Search,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  SlidersHorizontal,
  History,
} from 'lucide-react';
import {
  Job,
  fetchJobs,
  searchSemantic,
  searchAdvancedJobs,
  fetchSearchSuggestions,
  fetchMySearchHistory,
  logCareerEvent,
} from '@/lib/api';
import { useAuth } from '@/context/auth-context';

export default function HomePage() {
  const { token, role, userId } = useAuth();

  // Query & Listings states
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Advanced filters states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTopik, setSelectedTopik] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [salaryFilter, setSalaryFilter] = useState<number | null>(null);

  // Suggestions & History
  const [suggestions, setSuggestions] = useState<Array<{ query: string; searchCount: number }>>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]);

  // Job details drawer state (kèm thời điểm mở để log time_spent)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobOpenedAt, setJobOpenedAt] = useState<number | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadInitialData();
  }, []);

  // Mở job drawer theo query ?job=<id> (link từ trang Recommendations)
  useEffect(() => {
    const jobIdParam = searchParams.get('job');
    if (jobIdParam && allJobs.length > 0 && !selectedJob) {
      const found = allJobs.find((j) => j.id === jobIdParam);
      if (found) {
        setSelectedJob(found);
        setJobOpenedAt(Date.now());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, allJobs]);

  useEffect(() => {
    if (token) loadSearchHistoryData();
    else setSearchHistory([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const normalizedJobs = await fetchJobs();
      setJobs(normalizedJobs);
      setAllJobs(normalizedJobs);

      const searchSugs = await fetchSearchSuggestions();
      setSuggestions(searchSugs.slice(0, 5));
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối API Backend. Hãy đảm bảo NestJS server đang chạy trên cổng 3000.');
    } finally {
      setLoading(false);
    }
  };

  const loadSearchHistoryData = async () => {
    if (!token) return;
    try {
      const history = await fetchMySearchHistory(token);
      setSearchHistory(history.slice(0, 5));
    } catch (err) {
      console.error('Lỗi tải lịch sử tìm kiếm:', err);
    }
  };

  // Tìm kiếm nâng cao kết hợp bộ lọc
  const triggerAdvancedSearch = async (currentQuery = searchQuery) => {
    setSearching(true);
    setError(null);
    try {
      const filterBody = {
        query: currentQuery.trim() || undefined,
        locations: selectedLocations.length > 0 ? selectedLocations : undefined,
        salaryMin: salaryFilter || undefined,
        topikLevel: selectedTopik !== 'all' ? selectedTopik : undefined,
        jobType: selectedJobType !== 'all' ? selectedJobType : undefined,
      };

      const filteredJobs = await searchAdvancedJobs(filterBody, token || undefined);
      setJobs(filteredJobs);
    } catch (err) {
      console.error('Search error:', err);
      setError('Lọc tìm kiếm nâng cao thất bại. Đang tải chế độ dự phòng.');
      setJobs(allJobs);
    } finally {
      setSearching(false);
    }
  };

  // AI semantic search
  const handleAISearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setJobs(allJobs);
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const normalizedSearch = await searchSemantic(searchQuery);
      setJobs(normalizedSearch);
      if (token) loadSearchHistoryData();
    } catch (err) {
      console.error(err);
      setError('Lỗi AI Vector Search. Đang kích hoạt tìm kiếm lọc từ khóa mặc định.');
      setJobs(
        allJobs.filter(
          (j) =>
            j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.description.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      );
    } finally {
      setSearching(false);
    }
  };

  // Quick filters
  const handleQuickFilter = (filter: string) => {
    setActiveFilter(filter);
    setSelectedLocations([]);
    setSelectedTopik('all');
    setSelectedJobType('all');
    setSalaryFilter(null);

    if (filter === 'all') {
      setJobs(allJobs);
      setSearchQuery('');
    } else if (filter === 'brse') {
      setJobs(allJobs.filter((j) => j.title.toLowerCase().includes('brse') || j.title.toLowerCase().includes('cầu nối')));
    } else if (filter === 'comtor') {
      setJobs(
        allJobs.filter(
          (j) =>
            j.title.toLowerCase().includes('comtor') ||
            j.title.toLowerCase().includes('dịch') ||
            j.title.toLowerCase().includes('phiên dịch'),
        ),
      );
    } else if (filter === 'hanoi') {
      setJobs(allJobs.filter((j) => j.location.toLowerCase().includes('hà nội')));
    } else if (filter === 'seoul') {
      setJobs(allJobs.filter((j) => j.location.toLowerCase().includes('seoul')));
    }
  };

  const handleLocationTagToggle = (loc: string) => {
    setSelectedLocations((prev) => {
      const updated = prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc];
      setTimeout(() => triggerAdvancedSearch(), 0);
      return updated;
    });
  };

  // Mở job + ghi log hành vi view_job (Metadata dataset)
  const handleOpenJob = (job: Job, position: number) => {
    setSelectedJob(job);
    setJobOpenedAt(Date.now());
    if (role === 'candidate' && userId) {
      logCareerEvent({
        userId,
        eventType: 'view_job',
        jobId: job.id,
        clickPosition: position + 1,
        deviceType: /Mobi/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
      });
    }
  };

  const handleCloseJob = () => {
    // Log thời gian đọc JD trước khi đóng
    if (role === 'candidate' && userId && selectedJob && jobOpenedAt) {
      const seconds = Math.round((Date.now() - jobOpenedAt) / 1000);
      if (seconds >= 3) {
        logCareerEvent({
          userId,
          eventType: 'view_job',
          jobId: selectedJob.id,
          timeSpentSeconds: seconds,
        });
      }
    }
    setSelectedJob(null);
    setJobOpenedAt(null);
    if (searchParams.get('job')) {
      setSearchParams({}, { replace: true });
    }
  };

  return (
    <>
      {/* Hero Banner */}
      <section className="relative overflow-hidden pt-16 pb-16 border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {/* Korean greeting accent */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border text-sm font-bold text-primary mb-6 shadow-sm">
            <span className="text-base">안녕하세요!</span>
            <span className="text-muted-foreground font-medium text-xs">Chào mừng đến với KBRIDGE</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight text-foreground">
            Cây cầu nối sự nghiệp IT
            <span className="block mt-1.5 text-primary">Việt Nam ↔ Hàn Quốc</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Kết nối kỹ sư BrSE, IT Comtor và lập trình viên tiếng Hàn đến các doanh nghiệp công nghệ
            hàng đầu thông qua cơ chế khớp ngữ nghĩa AI.
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
              <span className="text-muted-foreground font-semibold">Tìm kiếm phổ biến:</span>
              {suggestions.map((sug) => (
                <button
                  key={sug.query}
                  onClick={() => {
                    setSearchQuery(sug.query);
                    triggerAdvancedSearch(sug.query);
                  }}
                  className="px-2.5 py-1 rounded-full bg-card hover:bg-accent border border-border text-muted-foreground hover:text-accent-foreground transition-colors"
                >
                  #{sug.query}
                </button>
              ))}
            </div>
          )}

          {/* Lịch sử tìm kiếm cá nhân */}
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
                      triggerAdvancedSearch(h.query);
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
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-2">
                Bộ lọc tuyển dụng nâng cao
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Locations */}
                <div className="space-y-2 md:col-span-2">
                  <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Khu vực làm việc
                  </span>
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

                {/* TOPIK level */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Trình độ Tiếng Hàn
                  </span>
                  <select
                    value={selectedTopik}
                    onChange={(e) => {
                      setSelectedTopik(e.target.value);
                      setTimeout(() => triggerAdvancedSearch(), 0);
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
                {/* Job Type */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Hình thức làm việc
                  </span>
                  <div className="flex gap-2">
                    {['all', 'fulltime', 'hybrid', 'remote'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setSelectedJobType(type);
                          setTimeout(() => triggerAdvancedSearch(), 0);
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

                {/* Salary */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Mức lương tối thiểu
                  </span>
                  <div className="flex gap-2">
                    {[null, 15000000, 25000000, 45000000].map((sal) => (
                      <button
                        key={String(sal)}
                        type="button"
                        onClick={() => {
                          setSalaryFilter(sal);
                          setTimeout(() => triggerAdvancedSearch(), 0);
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
                {filter === 'all' && 'TẤT CẢ VIỆC LÀM'}
                {filter === 'brse' && 'BRSE (KỸ SƯ CẦU NỐI)'}
                {filter === 'comtor' && 'COMTOR & DỊCH THUẬT'}
                {filter === 'hanoi' && 'HÀ NỘI'}
                {filter === 'seoul' && 'SEOUL'}
              </button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground font-semibold">
            Tìm thấy <span className="text-primary font-extrabold">{jobs.length}</span> tin tuyển dụng phù hợp
          </div>
        </div>

        {/* Job grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-60 rounded-2xl bg-card border border-border animate-pulse p-6 flex flex-col justify-between"
              >
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
              Không có tin tuyển dụng phù hợp với bộ lọc hiện tại. Bấm nút "Tất cả việc làm" ở trên để
              reset bộ lọc. 화이팅!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, index) => (
              <JobCard key={job.id} job={job} onClick={() => handleOpenJob(job, index)} />
            ))}
          </div>
        )}
      </main>

      {/* Job Details Drawer */}
      <JobDrawer
        job={selectedJob}
        isOpen={selectedJob !== null}
        onClose={handleCloseJob}
        token={token}
        onApplySuccess={() => {
          /* header tự refresh thông báo */
        }}
      />
    </>
  );
}
