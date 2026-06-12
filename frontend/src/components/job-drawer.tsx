import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  MapPin,
  DollarSign,
  Star,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Send,
  Loader2
} from 'lucide-react';
import {
  Job,
  fetchCompanyReviews,
  createReview,
  uploadFile,
  applyJob,
  saveJob,
  unsaveJob,
  checkIsSaved
} from '@/lib/api';

interface JobDrawerProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onApplySuccess?: () => void;
}

export function JobDrawer({
  job,
  isOpen,
  onClose,
  token,
  onApplySuccess
}: JobDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  // Saved state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Reviews states
  const [reviewsData, setReviewsData] = useState<{
    averageRating: number;
    totalReviews: number;
    reviews: any[];
  } | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitReviewError, setSubmitReviewError] = useState<string | null>(null);
  const [submitReviewSuccess, setSubmitReviewSuccess] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Apply states
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [uploadingCv, setUploadingCv] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  // Handle outside click/escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Reset states
      setActiveTab('details');
      setShowApplyForm(false);
      setCvFile(null);
      setCoverLetter('');
      setApplyError(null);
      setApplySuccess(false);
      setSubmitReviewError(null);
      setSubmitReviewSuccess(false);
      setReviewText('');
      setReviewRating(5);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load reviews & bookmark status when drawer opens/changes
  useEffect(() => {
    if (isOpen && job) {
      loadReviews();
      checkBookmarkStatus();
    }
  }, [isOpen, job, token]);

  const checkBookmarkStatus = async () => {
    if (!token || !job) return;
    try {
      const data = await checkIsSaved(job.id, token);
      setIsBookmarked(data.isSaved);
    } catch (err) {
      console.error('Error checking bookmark status:', err);
    }
  };

  const loadReviews = async () => {
    if (!job) return;
    setReviewsLoading(true);
    try {
      const data = await fetchCompanyReviews(job.companyId);
      setReviewsData(data);
    } catch (err) {
      console.error('Error loading company reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!token) {
      alert('Vui lòng đăng nhập để lưu tin tuyển dụng');
      return;
    }
    if (!job) return;

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await unsaveJob(job.id, token);
        setIsBookmarked(false);
      } else {
        await saveJob(job.id, token);
        setIsBookmarked(true);
      }
    } catch (err: any) {
      console.error('Bookmark error:', err);
      alert(err.message || 'Thao tác thất bại');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setSubmitReviewError('Vui lòng đăng nhập để gửi đánh giá');
      return;
    }
    if (!job) return;
    if (!reviewText.trim()) {
      setSubmitReviewError('Vui lòng nhập nội dung nhận xét');
      return;
    }

    setSubmittingReview(true);
    setSubmitReviewError(null);
    try {
      await createReview(
        {
          companyId: job.companyId,
          rating: reviewRating,
          reviewText: reviewText,
          isAnonymous: isAnonymous
        },
        token
      );
      setSubmitReviewSuccess(true);
      setReviewText('');
      // Reload reviews
      loadReviews();
    } catch (err: any) {
      setSubmitReviewError(err.message || 'Lỗi gửi đánh giá. Bạn chỉ có thể đánh giá sau khi đã nộp đơn vào công ty này.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setApplyError('Chỉ chấp nhận file định dạng PDF');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setApplyError('Dung lượng file tối đa là 5MB');
        return;
      }
      setCvFile(file);
      setApplyError(null);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setApplyError('Vui lòng đăng nhập với vai trò Ứng viên để ứng tuyển');
      return;
    }
    if (!cvFile) {
      setApplyError('Vui lòng chọn hoặc kéo thả file CV PDF');
      return;
    }
    if (!job) return;

    setApplying(true);
    setApplyError(null);

    try {
      // 1. Upload CV file
      setUploadingCv(true);
      const uploadResult = await uploadFile(cvFile, 'cv', token);
      setUploadingCv(false);

      // 2. Submit application
      await applyJob(
        {
          jobId: job.id,
          coverLetter: coverLetter,
          resumeId: uploadResult.url // matching mock resume url or file path
        },
        token
      );

      setApplySuccess(true);
      if (onApplySuccess) onApplySuccess();
    } catch (err: any) {
      setApplyError(err.message || 'Có lỗi xảy ra trong quá trình nộp đơn.');
    } finally {
      setUploadingCv(false);
      setApplying(false);
    }
  };

  if (!isOpen || !job) return null;

  // Helper formatting values
  const formatTopik = (level: string) => {
    if (level.startsWith('TOPIK_II_LEVEL_')) {
      return `TOPIK II - Cấp ${level.replace('TOPIK_II_LEVEL_', '')}`;
    }
    if (level.startsWith('TOPIK_I_LEVEL_')) {
      return `TOPIK I - Cấp ${level.replace('TOPIK_I_LEVEL_', '')}`;
    }
    return 'Không yêu cầu TOPIK';
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (min && max) {
      return `${(min / 1000000).toFixed(0)}M - ${(max / 1000000).toFixed(0)}M VND`;
    }
    if (min) return `Từ ${(min / 1000000).toFixed(0)}M VND`;
    if (max) return `Lên đến ${(max / 1000000).toFixed(0)}M VND`;
    return 'Thỏa thuận';
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Dimmed Background Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer content panel */}
      <div className="relative w-full max-w-2xl h-full bg-[#0d1222] border-l border-zinc-800 flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-350">
        {/* Header */}
        <div className="p-6 border-b border-zinc-850 flex items-start justify-between bg-zinc-950/20">
          <div className="flex-1 mr-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 py-0.5 rounded-md text-[10px]">
                {formatTopik(job.minTopikRequired)}
              </Badge>
              {job.company?.companyName && (
                <span className="text-xs text-zinc-400 font-semibold tracking-wide uppercase">
                  {job.company.companyName}
                </span>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white leading-snug tracking-tight">
              {job.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Bookmark button */}
            <Button
              variant="ghost"
              size="icon"
              disabled={bookmarkLoading}
              onClick={handleBookmarkToggle}
              className={`w-9 h-9 rounded-lg border border-zinc-800 transition-all ${
                isBookmarked
                  ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </Button>

            {/* Close Button */}
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-zinc-850 bg-zinc-950/40">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 text-center ${
              activeTab === 'details'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
            }`}
          >
            Chi tiết công việc
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
            }`}
          >
            Đánh giá công ty
            {reviewsData && reviewsData.totalReviews > 0 && (
              <span className="px-1.5 py-0.25 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                {reviewsData.totalReviews}
              </span>
            )}
          </button>
        </div>

        {/* Main Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-850">
          {activeTab === 'details' ? (
            <>
              {/* Overview Details Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Địa điểm làm việc</span>
                  <div className="flex items-center gap-1.5 text-zinc-200 font-semibold text-sm">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{job.location}</span>
                  </div>
                </div>
                <div className="p-4 bg-zinc-900/40 border border-zinc-850 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Mức lương</span>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                    <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                  </div>
                </div>
              </div>

              {/* Skills required */}
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">Kỹ năng cốt lõi</h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* JD description */}
              <div className="border-t border-zinc-850/60 pt-5">
                <h3 className="text-sm font-bold text-zinc-300 mb-3.5">Mô tả công việc (JD)</h3>
                <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>

              {/* Apply Zone Toggle */}
              {!applySuccess && (
                <div className="border-t border-zinc-850/60 pt-6">
                  {!showApplyForm ? (
                    <Button
                      onClick={() => {
                        if (!token) {
                          alert('Vui lòng đăng nhập với vai trò Ứng viên để ứng tuyển');
                        } else {
                          setShowApplyForm(true);
                        }
                      }}
                      className="w-full py-6 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all duration-300"
                    >
                      <span>Ứng tuyển ngay vị trí này</span>
                    </Button>
                  ) : (
                    <form onSubmit={handleApplySubmit} className="space-y-4 bg-zinc-900/30 p-5 rounded-2xl border border-zinc-850/80">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-zinc-200">Hồ sơ ứng tuyển</h4>
                        <button
                          type="button"
                          onClick={() => setShowApplyForm(false)}
                          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          Hủy
                        </button>
                      </div>

                      {/* File Drag Drop Zone */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2">
                          CV của bạn (Định dạng PDF, tối đa 5MB) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative border-2 border-dashed border-zinc-800 hover:border-zinc-700 transition-all rounded-xl p-6 bg-zinc-950/20 text-center flex flex-col items-center justify-center cursor-pointer group">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <UploadCloud className="w-10 h-10 text-zinc-500 group-hover:text-indigo-400 transition-colors mb-2" />
                          {cvFile ? (
                            <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="max-w-[250px] truncate">{cvFile.name}</span>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs font-semibold text-zinc-300">Nhấp hoặc kéo thả file CV vào đây</span>
                              <span className="text-[10px] text-zinc-500 mt-1">Chỉ chấp nhận file PDF dưới 5MB</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Cover Letter */}
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-2">
                          Thư giới thiệu (Cover Letter)
                        </label>
                        <textarea
                          rows={4}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder="Chia sẻ lý do bạn phù hợp với công việc này..."
                          className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 p-3 text-xs resize-none"
                        />
                      </div>

                      {applyError && (
                        <div className="p-3 bg-red-950/25 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2 animate-pulse">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{applyError}</span>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={applying}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-5 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all duration-300"
                      >
                        {applying ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{uploadingCv ? 'Đang tải hồ sơ lên...' : 'Đang xử lý nộp đơn...'}</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Gửi hồ sơ ứng tuyển</span>
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* Apply Success State */}
              {applySuccess && (
                <div className="p-6 bg-emerald-950/20 border border-emerald-500/25 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h4 className="font-extrabold text-emerald-400 text-base">Nộp đơn thành công!</h4>
                  <p className="text-zinc-400 text-xs max-w-md mx-auto leading-relaxed">
                    Hồ sơ của bạn đã được chuyển đến bộ phận nhân sự. Trạng thái đơn và lịch phỏng vấn sẽ được cập nhật trực quan trên **Dashboard cá nhân** của bạn.
                  </p>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 text-xs rounded-lg px-4 py-1.5"
                  >
                    Đóng cửa sổ
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* Tab Company Reviews */
            <div className="space-y-6">
              {reviewsLoading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-xs text-zinc-500">Đang tải đánh giá công ty...</span>
                </div>
              ) : (
                <>
                  {/* Reviews Summary Stats */}
                  <div className="p-5 bg-zinc-900/30 border border-zinc-850 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-300">Đánh giá chung</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Dựa trên các lượt đánh giá từ ứng viên đã nộp đơn</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-2xl font-black text-white">
                          {reviewsData ? reviewsData.averageRating.toFixed(1) : '0.0'}
                        </span>
                        <div className="flex items-center text-yellow-400">
                          <Star className="w-5 h-5 fill-yellow-400 shrink-0" />
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium bg-zinc-800 px-2 py-0.5 border border-zinc-700/50 rounded-md">
                        {reviewsData ? reviewsData.totalReviews : 0} lượt đánh giá
                      </span>
                    </div>
                  </div>

                  {/* Reviews Form */}
                  {!submitReviewSuccess ? (
                    <form onSubmit={handleReviewSubmit} className="space-y-4 bg-zinc-900/25 p-4 rounded-xl border border-zinc-850/50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-xs text-zinc-300">Viết đánh giá của bạn</h4>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="text-zinc-500 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`w-4.5 h-4.5 ${
                                  star <= reviewRating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-zinc-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <textarea
                          rows={3}
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Môi trường làm việc thế nào? Chế độ đãi ngộ ra sao?..."
                          className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-zinc-700 p-3 text-xs resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <label className="flex items-center gap-1.5 text-zinc-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                          />
                          <span>Đánh giá ẩn danh</span>
                        </label>

                        <Button
                          type="submit"
                          disabled={submittingReview}
                          size="sm"
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white px-3 py-1.5 text-xs rounded-lg font-medium border border-zinc-750 flex items-center gap-1.5"
                        >
                          {submittingReview ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          <span>Gửi đánh giá</span>
                        </Button>
                      </div>

                      {submitReviewError && (
                        <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-[11px] text-red-400 flex items-start gap-1.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{submitReviewError}</span>
                        </div>
                      )}
                    </form>
                  ) : (
                    <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-400 font-medium">
                      Đã gửi đánh giá thành công! Cảm ơn nhận xét của bạn.
                    </div>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Nhận xét chi tiết</h4>
                    {(!reviewsData || reviewsData.reviews.length === 0) ? (
                      <p className="text-zinc-600 text-xs italic text-center py-6">
                        Chưa có đánh giá nào cho công ty này. Hãy là người đầu tiên!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {reviewsData.reviews.map((rev: any) => (
                          <div key={rev.id} className="p-4 bg-zinc-900/35 border border-zinc-850/60 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-zinc-300">
                                {rev.isAnonymous ? 'Ứng viên ẩn danh' : (rev.candidate?.fullName || 'Ứng viên')}
                              </span>
                              <div className="flex items-center gap-0.5 text-yellow-400">
                                {Array.from({ length: rev.rating }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-yellow-400 shrink-0" />
                                ))}
                              </div>
                            </div>
                            <p className="text-zinc-400 text-xs leading-relaxed">
                              {rev.reviewText}
                            </p>
                            <span className="block text-[10px] text-zinc-650 text-right">
                              {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
