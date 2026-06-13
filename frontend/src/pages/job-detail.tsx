import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Star,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  Send,
  Loader2,
  Calendar,
  Clock,
  Briefcase,
  Building2,
  FileText,
} from 'lucide-react';
import {
  fetchJobById,
  fetchCompanyReviews,
  createReview,
  uploadFile,
  getUploadedFileUrl,
  applyJob,
  saveJob,
  unsaveJob,
  checkIsSaved,
  logCareerEvent,
  Job,
} from '@/lib/api';
import { useAuth } from '@/context/auth-context';

const formatTopik = (level: string) => {
  if (level?.startsWith('TOPIK_II_LEVEL_')) return `TOPIK II - Cấp ${level.replace('TOPIK_II_LEVEL_', '')}`;
  if (level?.startsWith('TOPIK_I_LEVEL_')) return `TOPIK I - Cấp ${level.replace('TOPIK_I_LEVEL_', '')}`;
  return 'Không yêu cầu TOPIK';
};

const formatSalary = (min: number | null, max: number | null) => {
  if (min && max) return `${(min / 1000000).toFixed(0)}M - ${(max / 1000000).toFixed(0)}M VND`;
  if (min) return `Từ ${(min / 1000000).toFixed(0)}M VND`;
  if (max) return `Lên đến ${(max / 1000000).toFixed(0)}M VND`;
  return 'Thỏa thuận';
};

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { token, role, userId } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details');

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const [reviewsData, setReviewsData] = useState<{ averageRating: number; totalReviews: number; reviews: any[] } | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitReviewError, setSubmitReviewError] = useState<string | null>(null);
  const [submitReviewSuccess, setSubmitReviewSuccess] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [showApplyForm, setShowApplyForm] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [uploadingCv, setUploadingCv] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  const [openedAt] = useState(Date.now());

  useEffect(() => {
    if (!jobId) return;
    loadJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    if (job) {
      loadReviews();
      checkBookmarkStatus();
      if (role === 'candidate' && userId) {
        logCareerEvent({ userId, eventType: 'view_job', jobId: job.id, deviceType: /Mobi/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  useEffect(() => {
    return () => {
      if (role === 'candidate' && userId && job) {
        const seconds = Math.round((Date.now() - openedAt) / 1000);
        if (seconds >= 3) {
          logCareerEvent({ userId, eventType: 'view_job', jobId: job.id, timeSpentSeconds: seconds });
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job]);

  const loadJob = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobById(jobId!);
      setJob(data);
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy tin tuyển dụng');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    if (!job) return;
    setReviewsLoading(true);
    try {
      const data = await fetchCompanyReviews(job.companyId);
      setReviewsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    if (!token || !job) return;
    try {
      const data = await checkIsSaved(job.id, token);
      setIsBookmarked(data.isSaved);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!token) { navigate('/login'); return; }
    if (!job) return;
    setBookmarkLoading(true);
    try {
      if (isBookmarked) { await unsaveJob(job.id, token); setIsBookmarked(false); }
      else { await saveJob(job.id, token); setIsBookmarked(true); }
    } catch (err: any) {
      alert(err.message || 'Thao tác thất bại');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setSubmitReviewError('Vui lòng đăng nhập để gửi đánh giá'); return; }
    if (!job || !reviewText.trim()) { setSubmitReviewError('Vui lòng nhập nội dung nhận xét'); return; }
    setSubmittingReview(true);
    setSubmitReviewError(null);
    try {
      await createReview({ companyId: job.companyId, rating: reviewRating, reviewText, isAnonymous }, token);
      setSubmitReviewSuccess(true);
      setReviewText('');
      loadReviews();
    } catch (err: any) {
      setSubmitReviewError(err.message || 'Lỗi gửi đánh giá.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') { setApplyError('Chỉ chấp nhận file PDF'); return; }
    if (file.size > 5 * 1024 * 1024) { setApplyError('Dung lượng tối đa 5MB'); return; }
    setCvFile(file);
    setApplyError(null);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setApplyError('Vui lòng đăng nhập để ứng tuyển'); return; }
    if (!cvFile || !job) return;
    setApplying(true);
    setApplyError(null);
    try {
      setUploadingCv(true);
      const uploadResult = await uploadFile(cvFile, 'cv', token);
      setUploadingCv(false);
      await applyJob({ jobId: job.id, coverLetter, resumeId: uploadResult.url }, token);
      setApplySuccess(true);
    } catch (err: any) {
      setApplyError(err.message || 'Có lỗi trong quá trình nộp đơn.');
    } finally {
      setUploadingCv(false);
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Đang tải tin tuyển dụng...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="font-extrabold text-lg text-foreground mb-2">Không tìm thấy tin tuyển dụng</h2>
        <p className="text-muted-foreground text-sm mb-6">{error}</p>
        <Button asChild variant="outline" className="rounded-xl gap-2">
          <Link to="/jobs"><ArrowLeft className="w-4 h-4" /> Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link to="/jobs" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Tìm việc làm
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium truncate max-w-[200px]">{job.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="p-6 bg-card border border-border rounded-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 mr-3">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" className="bg-accent text-primary border-accent text-[10px] rounded-md">
                    {formatTopik(job.minTopikRequired)}
                  </Badge>
                  {job.jobType && (
                    <Badge variant="outline" className="text-[10px] rounded-md capitalize">{job.jobType}</Badge>
                  )}
                  {job.status === 'open' && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] rounded-md">Đang tuyển</Badge>
                  )}
                </div>
                <h1 className="text-xl md:text-2xl font-extrabold text-foreground leading-snug mb-1">{job.title}</h1>
                {job.company?.companyName && (
                  <Link
                    to={`/companies/${job.companyId}`}
                    className="text-sm text-primary font-semibold hover:underline flex items-center gap-1.5 mt-1"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {job.company.companyName}
                  </Link>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={bookmarkLoading}
                onClick={handleBookmarkToggle}
                className={`w-10 h-10 rounded-xl border border-border shrink-0 transition-all ${
                  isBookmarked ? 'text-amber-500 bg-yellow-500/10 border-yellow-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </Button>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background border border-border rounded-xl flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Địa điểm</span>
                <div className="flex items-center gap-1.5 text-foreground font-semibold text-sm">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span>{job.location}</span>
                </div>
              </div>
              <div className="p-3 bg-background border border-border rounded-xl flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mức lương</span>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                  <DollarSign className="w-4 h-4 shrink-0" />
                  <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                </div>
              </div>
              {job.experienceYearsMin !== undefined && (
                <div className="p-3 bg-background border border-border rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kinh nghiệm</span>
                  <div className="flex items-center gap-1.5 text-foreground font-semibold text-sm">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span>{job.experienceYearsMin}+ năm</span>
                  </div>
                </div>
              )}
              {job.applicationDeadline && (
                <div className="p-3 bg-background border border-border rounded-xl flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hạn nộp hồ sơ</span>
                  <div className="flex items-center gap-1.5 text-foreground font-semibold text-sm">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span>{new Date(job.applicationDeadline).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex border-b border-border bg-secondary/40">
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Chi tiết công việc
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                  activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Đánh giá công ty
                {reviewsData && reviewsData.totalReviews > 0 && (
                  <span className="px-1.5 rounded-full text-[10px] bg-secondary text-foreground font-bold border border-border">
                    {reviewsData.totalReviews}
                  </span>
                )}
              </button>
            </div>

            <div className="p-6 space-y-6">
              {activeTab === 'details' ? (
                <>
                  {/* Skills */}
                  <div>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Kỹ năng yêu cầu</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg text-xs font-semibold bg-accent text-primary border border-accent">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="border-t border-border pt-5">
                    <h3 className="text-sm font-bold text-foreground mb-3">Mô tả công việc</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
                    {job.jdFileUrl && (
                      <a
                        href={getUploadedFileUrl(job.jdFileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-xs font-bold text-primary hover:border-primary/40 transition-all"
                      >
                        <FileText className="w-4 h-4" /> Tải bản mô tả công việc (JD) đầy đủ
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-5">
                  {reviewsLoading ? (
                    <div className="py-16 text-center"><Loader2 className="w-7 h-7 animate-spin text-primary mx-auto" /></div>
                  ) : (
                    <>
                      <div className="p-4 bg-background border border-border rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-foreground">Đánh giá chung</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Từ ứng viên đã nộp đơn</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-2xl font-black text-foreground">{reviewsData?.averageRating.toFixed(1) ?? '0.0'}</span>
                            <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{reviewsData?.totalReviews ?? 0} lượt đánh giá</span>
                        </div>
                      </div>

                      {!submitReviewSuccess ? (
                        <form onSubmit={handleReviewSubmit} className="space-y-3 bg-background p-4 rounded-xl border border-border">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-xs text-foreground">Viết đánh giá của bạn</h4>
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map((star) => (
                                <button key={star} type="button" onClick={() => setReviewRating(star)}>
                                  <Star className={`w-4 h-4 ${star <= reviewRating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/50'}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            rows={3}
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Môi trường làm việc thế nào?..."
                            className="w-full rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none p-3 text-xs resize-none"
                          />
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded w-3.5 h-3.5" />
                              Ẩn danh
                            </label>
                            <Button type="submit" disabled={submittingReview} size="sm" variant="outline" className="rounded-lg text-xs gap-1.5">
                              {submittingReview ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                              Gửi đánh giá
                            </Button>
                          </div>
                          {submitReviewError && (
                            <div className="text-[11px] text-destructive flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />{submitReviewError}
                            </div>
                          )}
                        </form>
                      ) : (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-600 font-medium">
                          Đã gửi đánh giá thành công!
                        </div>
                      )}

                      <div className="space-y-3">
                        {(!reviewsData || reviewsData.reviews.length === 0) ? (
                          <p className="text-muted-foreground/70 text-xs italic text-center py-6">Chưa có đánh giá nào.</p>
                        ) : (
                          reviewsData.reviews.map((rev: any) => (
                            <div key={rev.id} className="p-4 bg-background border border-border rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-foreground">
                                  {rev.isAnonymous ? 'Ứng viên ẩn danh' : (rev.candidate?.fullName || 'Ứng viên')}
                                </span>
                                <div className="flex items-center gap-0.5 text-amber-500">
                                  {Array.from({ length: rev.rating }).map((_, i) => (
                                    <Star key={i} className="w-3 h-3 fill-amber-500" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-muted-foreground text-xs leading-relaxed">{rev.reviewText}</p>
                              <span className="block text-[10px] text-muted-foreground/70 text-right">
                                {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Apply */}
        <div className="space-y-4">
          <div className="sticky top-24 space-y-4">
            {/* Apply card */}
            <div className="p-5 bg-card border border-border rounded-2xl">
              <h3 className="font-bold text-sm text-foreground mb-4">Ứng tuyển vị trí này</h3>

              {applySuccess ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-extrabold text-emerald-600 text-sm">Nộp đơn thành công!</h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">Theo dõi trạng thái tại Dashboard của bạn.</p>
                  <Button asChild variant="outline" size="sm" className="rounded-lg text-xs mt-2">
                    <Link to="/candidate">Xem Dashboard</Link>
                  </Button>
                </div>
              ) : !showApplyForm ? (
                <Button
                  onClick={() => {
                    if (!token) navigate('/login');
                    else setShowApplyForm(true);
                  }}
                  className="w-full py-5 font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md shadow-primary/20 gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  Ứng tuyển ngay
                </Button>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      CV PDF <span className="text-destructive">*</span>
                    </label>
                    <div className="relative border-2 border-dashed border-border hover:border-primary/40 transition-all rounded-xl p-5 bg-secondary/50 text-center flex flex-col items-center cursor-pointer group">
                      <input type="file" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary mb-2" />
                      {cvFile ? (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />{cvFile.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Kéo thả hoặc click để chọn PDF</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-2">Thư giới thiệu</label>
                    <textarea
                      rows={3}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Chia sẻ lý do bạn phù hợp..."
                      className="w-full rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none p-3 text-xs resize-none"
                    />
                  </div>

                  {applyError && (
                    <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl text-xs text-destructive flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{applyError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowApplyForm(false)} className="flex-1 rounded-xl text-xs">
                      Hủy
                    </Button>
                    <Button type="submit" disabled={applying} size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs gap-1.5">
                      {applying ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{uploadingCv ? 'Đang tải...' : 'Xử lý...'}</> : <><Send className="w-3.5 h-3.5" />Gửi hồ sơ</>}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Stats */}
            {(job.viewsCount || job.applyCount) && (
              <div className="p-4 bg-card border border-border rounded-xl text-xs space-y-2">
                {job.viewsCount && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Lượt xem</span>
                    <span className="font-bold text-foreground">{job.viewsCount.toLocaleString()}</span>
                  </div>
                )}
                {job.applyCount && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Đã ứng tuyển</span>
                    <span className="font-bold text-foreground">{job.applyCount}</span>
                  </div>
                )}
              </div>
            )}

            {/* Company link */}
            {job.company?.companyName && (
              <Button asChild variant="outline" className="w-full rounded-xl gap-2 text-xs font-semibold">
                <Link to={`/companies/${job.companyId}`}>
                  <Building2 className="w-4 h-4" />
                  Xem hồ sơ công ty
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
