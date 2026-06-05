'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { JobCard } from '@/components/job-card';
import { ChatbotDrawer } from '@/components/chatbot-drawer';
import {
  Search,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import {
  Job,
  Candidate,
  fetchJobs,
  fetchCandidates,
  searchSemantic
} from '@/lib/api';

export default function Home() {
  // Query and Listings states
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Candidate / User states for Chatbot
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeUser, setActiveUser] = useState<Candidate | null>(null);

  // Chatbot drawer open state
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Fetch jobs and candidates list on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch jobs
      const normalizedJobs = await fetchJobs();
      setJobs(normalizedJobs);
      setAllJobs(normalizedJobs);

      // 2. Fetch candidates
      const candidateList = await fetchCandidates();
      setCandidates(candidateList);
      if (candidateList.length > 0) {
        setActiveUser(candidateList[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError('Lỗi kết nối API Backend. Hãy đảm bảo NestJS server đang chạy trên cổng 3000.');
    } finally {
      setLoading(false);
    }
  };

  // Handle AI semantic search
  const handleAISearch = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      console.error(err);
      setError('Lỗi kết nối AI Search. Đang kích hoạt chế độ tải dự phòng.');
    } finally {
      setSearching(false);
    }
  };

  // Quick filters handler
  const handleQuickFilter = (filter: string) => {
    setActiveFilter(filter);
    if (filter === 'all') {
      setJobs(allJobs);
      setSearchQuery('');
    } else if (filter === 'brse') {
      setJobs(allJobs.filter(j => j.title.toLowerCase().includes('brse') || j.title.toLowerCase().includes('cầu nối')));
    } else if (filter === 'comtor') {
      setJobs(allJobs.filter(j => j.title.toLowerCase().includes('comtor') || j.title.toLowerCase().includes('biên phiên dịch') || j.title.toLowerCase().includes('dịch')));
    } else if (filter === 'hanoi') {
      setJobs(allJobs.filter(j => j.location.toLowerCase().includes('hà nội')));
    } else if (filter === 'seoul') {
      setJobs(allJobs.filter(j => j.location.toLowerCase().includes('seoul')));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-extrabold text-xl tracking-tighter text-white">C</span>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">CareerMatch</span>
              <span className="ml-1.5 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-md">IT KOREAN</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-zinc-100 transition-colors text-zinc-100">Trang chủ</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">Vị trí BrSE</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">Việc làm dịch thuật</a>
            <a href="#" className="hover:text-zinc-100 transition-colors">Cộng đồng</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
              Đăng tuyển dụng
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-600/25">
              Đăng nhập
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden pt-20 pb-24 border-b border-zinc-800/40">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-900/10 blur-[150px] -z-10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] -z-10" />
        
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Semantic Vector Search tích hợp</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Sàn tìm việc IT Tiếng Hàn Thông Minh
            <span className="block mt-2 bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              CareerMatch AI
            </span>
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Kết nối kỹ sư BrSE, IT Comtor, và lập trình viên tiếng Hàn đến các doanh nghiệp công nghệ hàng đầu thông qua cơ chế khớp lệnh ngữ nghĩa tự động.
          </p>

          {/* AI Search Bar Container */}
          <div className="p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl shadow-black/40 max-w-3xl mx-auto">
            <form onSubmit={handleAISearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm việc BrSE ở Hà Nội không cần kinh nghiệm, tuyển gấp..."
                  className="pl-10 h-12 bg-transparent border-0 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base"
                />
              </div>
              <Button 
                type="submit" 
                disabled={searching}
                className="h-12 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all duration-300"
              >
                {searching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI đang phân tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Tìm kiếm bằng AI</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Lỗi kết nối hệ thống</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Filters and Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 border-b border-zinc-800/40 pb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'brse', 'comtor', 'hanoi', 'seoul'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleQuickFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all uppercase ${
                  activeFilter === filter
                    ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-100'
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
          
          <div className="text-sm text-zinc-400 font-medium">
            Hiển thị <span className="text-zinc-100 font-bold">{jobs.length}</span> tin tuyển dụng phù hợp
          </div>
        </div>

        {/* Loading Pulse */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-60 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 animate-pulse p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-1/3 bg-zinc-800 rounded" />
                  <div className="h-6 w-3/4 bg-zinc-800 rounded" />
                  <div className="h-4 w-1/2 bg-zinc-800 rounded" />
                </div>
                <div className="h-8 w-1/4 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
            <HelpCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-zinc-300 mb-2">Không tìm thấy công việc nào</h3>
            <p className="text-zinc-500 max-w-sm mx-auto text-sm">
              Bạn vui lòng thay đổi từ khóa tìm kiếm hoặc bấm nút "Tất cả việc làm" ở trên để reset bộ lọc.
            </p>
          </div>
        ) : (
          /* Jobs Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>

      {/* Floating Chatbot Advisor Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {!chatbotOpen ? (
          <Button
            onClick={() => setChatbotOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all duration-300"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
        ) : (
          <ChatbotDrawer
            isOpen={chatbotOpen}
            onClose={() => setChatbotOpen(false)}
            candidates={candidates}
            activeUser={activeUser}
            setActiveUser={setActiveUser}
          />
        )}
      </div>
    </div>
  );
}
