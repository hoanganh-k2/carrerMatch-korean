'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { JobCard } from '@/components/job-card';
import { ChatbotDrawer } from '@/components/chatbot-drawer';
import { JobDrawer } from '@/components/job-drawer';
import { CandidateDashboard } from '@/components/candidate-dashboard';
import { AuthModal } from '@/components/auth-modal';
import {
  Search,
  Sparkles,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Bell,
  Trash2,
  SlidersHorizontal,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';
import {
  Job,
  Candidate,
  fetchJobs,
  fetchCandidates,
  searchSemantic,
  searchAdvancedJobs,
  fetchSearchSuggestions,
  fetchMySearchHistory,
  fetchNotifications,
  fetchUnreadNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  fetchProfile,
} from '@/lib/api';

export default function Home() {
  // Navigation & Authentication states
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'candidate' | 'recruiter' | 'admin' | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userProfileName, setUserProfileName] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Tab state: 'jobs' (Job search) vs 'dashboard' (Personal dashboard)
  const [activeTab, setActiveTab] = useState<'jobs' | 'dashboard'>('jobs');

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

  // Notifications states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);



  // Candidate / User states for Chatbot
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeUser, setActiveUser] = useState<Candidate | null>(null);

  // Session restore dropdown
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Job details drawer state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Detect clicks outside notifications or role selector
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch jobs, candidates list & initial search suggestions on mount
  useEffect(() => {
    loadInitialData();
    restoreSession();
  }, []);

  // Sync token changes to reload notifications and history
  useEffect(() => {
    if (userToken) {
      loadNotificationsData();
      loadSearchHistoryData();
    }
  }, [userToken]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch jobs
      const normalizedJobs = await fetchJobs();
      setJobs(normalizedJobs);
      setAllJobs(normalizedJobs);

      // 2. Fetch candidates for chatbot context
      try {
        const candidateList = await fetchCandidates();
        setCandidates(candidateList);
        if (candidateList.length > 0) {
          setActiveUser(candidateList[0]);
        }
      } catch (candErr) {
        console.warn('Cannot fetch candidates (requires admin token). Falling back to mock profiles:', candErr);
        const fallbackCandidates: Candidate[] = [
          {
            userId: 'mock-cand-1',
            fullName: 'Nguyễn Kim Chi',
            topikLevel: 'TOPIK_II_LEVEL_5',
            skillsExtracted: ['React', 'TypeScript', 'Node.js', 'Korean Translation'],
            yearsExperience: 2
          },
          {
            userId: 'mock-cand-2',
            fullName: 'Trần Minh Nam',
            topikLevel: 'TOPIK_II_LEVEL_4',
            skillsExtracted: ['Java', 'Spring Boot', 'PostgreSQL'],
            yearsExperience: 3
          },
          {
            userId: 'mock-cand-3',
            fullName: 'Park Ji-hoon',
            topikLevel: 'TOPIK_II_LEVEL_6',
            skillsExtracted: ['Python', 'FastAPI', 'Business Korean'],
            yearsExperience: 4
          }
        ];
        setCandidates(fallbackCandidates);
        setActiveUser(fallbackCandidates[0]);
      }

      // 3. Fetch hot search suggestions
      const searchSugs = await fetchSearchSuggestions();
      setSuggestions(searchSugs.slice(0, 5));
    } catch (err: any) {
      console.error(err);
      setError('Lỗi kết nối API Backend. Hãy đảm bảo NestJS server đang chạy trên cổng 3000.');
    } finally {
      setLoading(false);
    }
  };

  // Restore session from localStorage on mount
  const restoreSession = async () => {
    try {
      const savedToken = localStorage.getItem('cm_token');
      if (!savedToken) return;
      const profile = await fetchProfile(savedToken);
      setUserToken(savedToken);
      setUserRole(profile.role);
      setUserEmail(profile.email);
      setUserProfileName(
        profile.jobUser?.fullName ||
        profile.company?.companyName ||
        profile.email
      );
    } catch (err) {
      // Token expired or invalid — clear it
      localStorage.removeItem('cm_token');
      console.warn('Session restore failed:', err);
    }
  };

  // Auth success callback from AuthModal
  const handleAuthSuccess = async (data: { accessToken: string; user: { id: string; email: string; role: string }; fullName?: string }) => {
    setUserToken(data.accessToken);
    setUserRole(data.user.role as 'candidate' | 'recruiter' | 'admin');
    setUserEmail(data.user.email);
    localStorage.setItem('cm_token', data.accessToken);

    // Fetch full profile to get the name
    try {
      const profile = await fetchProfile(data.accessToken);
      setUserProfileName(
        profile.jobUser?.fullName ||
        profile.company?.companyName ||
        data.fullName ||
        data.user.email
      );
    } catch {
      setUserProfileName(data.fullName || data.user.email);
    }
  };

  // Logout handler
  const handleLogout = () => {
    setUserToken(null);
    setUserRole(null);
    setUserEmail(null);
    setUserProfileName(null);
    setNotifications([]);
    setUnreadCount(0);
    setSearchHistory([]);
    setActiveTab('jobs');
    setShowUserDropdown(false);
    localStorage.removeItem('cm_token');
  };

  const loadNotificationsData = async () => {
    if (!userToken) return;
    try {
      const notifs = await fetchNotifications(userToken);
      const countData = await fetchUnreadNotificationsCount(userToken);
      setNotifications(notifs);
      setUnreadCount(countData.unreadCount);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const loadSearchHistoryData = async () => {
    if (!userToken) return;
    try {
      const history = await fetchMySearchHistory(userToken);
      setSearchHistory(history.slice(0, 5));
    } catch (err) {
      console.error('Error fetching search history:', err);
    }
  };



  // Advanced Filters search submit
  const triggerAdvancedSearch = async (currentQuery = searchQuery) => {
    setSearching(true);
    setError(null);
    try {
      const filterBody = {
        query: currentQuery.trim() || undefined,
        locations: selectedLocations.length > 0 ? selectedLocations : undefined,
        salaryMin: salaryFilter || undefined,
        topikLevel: selectedTopik !== 'all' ? selectedTopik : undefined,
        jobType: selectedJobType !== 'all' ? selectedJobType : undefined
      };

      const filteredJobs = await searchAdvancedJobs(filterBody, userToken || undefined);
      setJobs(filteredJobs);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Lọc tìm kiếm nâng cao thất bại. Đang tải chế độ dự phòng.');
      setJobs(allJobs);
    } finally {
      setSearching(false);
    }
  };

  // Handle AI semantic search
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
      if (userToken) loadSearchHistoryData(); // update history
    } catch (err: any) {
      console.error(err);
      setError('Lỗi AI Vector Search. Đang kích hoạt tìm kiếm lọc từ khóa mặc định.');
      // Fallback local query
      setJobs(
        allJobs.filter(
          (j) =>
            j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            j.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } finally {
      setSearching(false);
    }
  };

  // Notification management
  const handleMarkAsRead = async (id: string) => {
    if (!userToken) return;
    try {
      await markNotificationRead(id, userToken);
      loadNotificationsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userToken) return;
    try {
      await markAllNotificationsRead(userToken);
      loadNotificationsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userToken) return;
    try {
      await deleteNotification(id, userToken);
      loadNotificationsData();
    } catch (err) {
      console.error(err);
    }
  };

  // Quick filters handler
  const handleQuickFilter = (filter: string) => {
    setActiveFilter(filter);
    // Reset advanced filters visual selections
    setSelectedLocations([]);
    setSelectedTopik('all');
    setSelectedJobType('all');
    setSalaryFilter(null);

    if (filter === 'all') {
      setJobs(allJobs);
      setSearchQuery('');
    } else if (filter === 'brse') {
      setJobs(allJobs.filter(j => j.title.toLowerCase().includes('brse') || j.title.toLowerCase().includes('cầu nối')));
    } else if (filter === 'comtor') {
      setJobs(allJobs.filter(j => j.title.toLowerCase().includes('comtor') || j.title.toLowerCase().includes('dịch') || j.title.toLowerCase().includes('phiên dịch')));
    } else if (filter === 'hanoi') {
      setJobs(allJobs.filter(j => j.location.toLowerCase().includes('hà nội')));
    } else if (filter === 'seoul') {
      setJobs(allJobs.filter(j => j.location.toLowerCase().includes('seoul')));
    }
  };

  // Toggle location selection tag
  const handleLocationTagToggle = (loc: string) => {
    setSelectedLocations((prev) => {
      const updated = prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc];
      // Trigger search with updated locations
      setTimeout(() => triggerAdvancedSearch(), 0);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-45 bg-[#070b19]/85 backdrop-blur-md border-b border-zinc-800/80 transition-all shadow-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab('jobs'); handleQuickFilter('all'); }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-extrabold text-xl tracking-tighter text-white">C</span>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">CareerMatch</span>
              <span className="ml-1.5 text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-md">IT KOREAN</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`hover:text-white transition-colors cursor-pointer ${activeTab === 'jobs' ? 'text-indigo-400 font-bold' : ''}`}
            >
              Tìm việc làm
            </button>
            <button
              onClick={() => {
                if (userToken) {
                  setActiveTab('dashboard');
                } else {
                  alert('Vui lòng chọn vai trò ở nút đăng nhập để truy cập Dashboard.');
                }
              }}
              className={`hover:text-white transition-colors cursor-pointer ${activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : ''}`}
            >
              Dashboard của tôi
            </button>
          </nav>

          {/* Actions & Session Menu */}
          <div className="flex items-center gap-4">
            
            {/* Notifications Bell Dropdown */}
            {userToken && (
              <div className="relative" ref={notifDropdownRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                  className="relative w-9 h-9 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center animate-bounce shadow-md">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications Dropdown Panel */}
                {showNotificationsDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[350px]">
                    <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-zinc-300">Thông báo của bạn</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold text-[10.5px]"
                        >
                          Đọc tất cả
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 scrollbar-thin scrollbar-thumb-zinc-800">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center text-zinc-500 text-xs italic">
                          Không có thông báo nào
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleMarkAsRead(notif.id)}
                            className={`p-3 text-left transition-colors cursor-pointer flex gap-2 justify-between items-start ${
                              !notif.isRead ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-zinc-800/30'
                            }`}
                          >
                            <div className="space-y-1 flex-1">
                              <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase block">
                                {notif.title}
                              </span>
                              <p className="text-zinc-300 text-[11px] leading-relaxed">
                                {notif.message}
                              </p>
                              <span className="text-[9px] text-zinc-650 block">
                                {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            
                            <button
                              onClick={(e) => handleDeleteNotification(notif.id, e)}
                              className="text-zinc-600 hover:text-red-400 p-0.5 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth Buttons */}
            {userToken ? (
              <div className="relative" ref={userDropdownRef}>
                <Button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold py-2 px-3 shadow-lg flex items-center gap-2 border border-zinc-700/50"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center">
                    <span className="text-[10px] font-extrabold text-white">
                      {(userProfileName || userEmail || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:inline max-w-[120px] truncate">{userProfileName || userEmail}</span>
                </Button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-60 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 bg-zinc-950/60 border-b border-zinc-800">
                      <span className="block font-bold text-xs text-zinc-200 truncate">{userProfileName}</span>
                      <span className="block text-[10.5px] text-zinc-500 truncate">{userEmail}</span>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                        {userRole === 'candidate' ? 'Ứng viên' : userRole === 'recruiter' ? 'Nhà tuyển dụng' : 'Admin'}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-lg text-xs font-bold py-2 px-4 shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 border border-indigo-500/30"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập / Đăng ký</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Banner (Only for Jobs tab) */}
      {activeTab === 'jobs' && (
        <section className="relative overflow-hidden pt-16 pb-20 border-b border-zinc-800/25">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-900/10 blur-[140px] -z-10" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-purple-900/10 blur-[110px] -z-10" />
          
          <div className="max-w-4xl mx-auto px-6 text-center">
            
            {/* AI Vector Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 mb-6 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Semantic Vector Search kích hợp</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-5 leading-tight text-white">
              Sàn tìm việc IT Tiếng Hàn Thông Minh
              <span className="block mt-1.5 bg-gradient-to-r from-blue-400 via-indigo-300 to-rose-400 bg-clip-text text-transparent">
                CareerMatch AI
              </span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
              Kết nối kỹ sư BrSE, IT Comtor, và lập trình viên tiếng Hàn đến các doanh nghiệp công nghệ hàng đầu thông qua cơ chế khớp lệnh ngữ nghĩa tự động.
            </p>

            {/* AI Search Bar Container */}
            <div className="p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/40 max-w-3xl mx-auto space-y-2">
              <form onSubmit={handleAISearchSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm việc BrSE ở Hà Nội không cần kinh nghiệm, tuyển gấp..."
                    className="pl-10 h-12 bg-transparent border-0 text-zinc-100 placeholder:text-zinc-650 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs md:text-sm"
                  />
                </div>
                
                <div className="flex gap-2">
                  {/* Collapsible toggle */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`h-12 px-4 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850 flex items-center gap-1.5 transition-all ${
                      showAdvancedFilters ? 'bg-zinc-800 border-zinc-700 text-white' : ''
                    }`}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="text-xs font-semibold">Lọc bộ lọc</span>
                  </Button>

                  <Button 
                    type="submit" 
                    disabled={searching}
                    className="h-12 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-500 hover:to-rose-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all duration-300"
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
                <span className="text-zinc-500 font-semibold">Tìm kiếm phổ biến:</span>
                {suggestions.map((sug) => (
                  <button
                    key={sug.query}
                    onClick={() => {
                      setSearchQuery(sug.query);
                      triggerAdvancedSearch(sug.query);
                    }}
                    className="px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    #{sug.query}
                  </button>
                ))}
              </div>
            )}

            {/* Collapsible Advanced Filters Drawer */}
            {showAdvancedFilters && (
              <div className="max-w-3xl mx-auto mt-4 p-5 rounded-2xl bg-[#0b0f20]/90 border border-zinc-800 text-left space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="font-bold text-xs text-zinc-300 uppercase tracking-wider mb-2">Bộ lọc tuyển dụng nâng cao</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Locations checkbox tags */}
                  <div className="space-y-2 md:col-span-2">
                    <span className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Khu vực làm việc</span>
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
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                            }`}
                          >
                            {loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* TOPIK level select */}
                  <div className="space-y-2">
                    <span className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Trình độ Tiếng Hàn</span>
                    <select
                      value={selectedTopik}
                      onChange={(e) => {
                        setSelectedTopik(e.target.value);
                        setTimeout(() => triggerAdvancedSearch(), 0);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-zinc-850/50">
                  {/* Job Type selection */}
                  <div className="space-y-2">
                    <span className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Hình thức làm việc</span>
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
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                          }`}
                        >
                          {type === 'all' ? 'Tất cả' : type.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Salary Filter selection */}
                  <div className="space-y-2">
                    <span className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Mức lương tối thiểu</span>
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
                              ? 'bg-indigo-600 border-indigo-500 text-white'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
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
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block mb-0.5">Thông tin hệ thống</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {activeTab === 'jobs' ? (
          <>
            {/* Quick Filter Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 border-b border-zinc-800/40 pb-6">
              <div className="flex flex-wrap gap-2">
                {['all', 'brse', 'comtor', 'hanoi', 'seoul'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleQuickFilter(filter)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide border transition-all uppercase cursor-pointer ${
                      activeFilter === filter
                        ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow-md shadow-white/5'
                        : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:border-zinc-750 hover:text-zinc-100'
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
              
              <div className="text-xs text-zinc-400 font-semibold">
                Tìm thấy <span className="text-indigo-400 font-extrabold">{jobs.length}</span> tin tuyển dụng phù hợp
              </div>
            </div>

            {/* Loading Grid Pulse */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-60 rounded-2xl bg-zinc-900/40 border border-zinc-850/80 animate-pulse p-6 flex flex-col justify-between"
                  >
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
              <div className="text-center py-20 bg-zinc-900/10 border border-dashed border-zinc-800 rounded-3xl">
                <HelpCircle className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="font-extrabold text-lg text-zinc-300 mb-2">Không tìm thấy công việc nào</h3>
                <p className="text-zinc-500 max-w-sm mx-auto text-xs">
                  Không có tin tuyển dụng phù hợp với bộ lọc hiện tại. Bấm nút "Tất cả việc làm" ở trên để reset bộ lọc.
                </p>
              </div>
            ) : (
              /* Jobs Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={() => setSelectedJob(job)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Personal Candidate Dashboard Tab */
          <div className="animate-in fade-in duration-300">
            <CandidateDashboard token={userToken} role={userRole} />
          </div>
        )}
      </main>

      {/* Slide-over Job Details Drawer Component */}
      <JobDrawer
        job={selectedJob}
        isOpen={selectedJob !== null}
        onClose={() => setSelectedJob(null)}
        token={userToken}
        onApplySuccess={() => {
          loadNotificationsData();
        }}
      />

      {/* Floating Chatbot Advisor Widget */}
      <div className="fixed bottom-6 right-6 z-45">
        {!chatbotOpen ? (
          <Button
            onClick={() => setChatbotOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-rose-600 hover:from-blue-500 hover:to-rose-500 text-white flex items-center justify-center shadow-xl shadow-indigo-650/40 hover:scale-105 transition-all duration-300 cursor-pointer border border-white/5"
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
