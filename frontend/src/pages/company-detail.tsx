import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Users, Globe, Star, Loader2, AlertCircle, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobCard } from '@/components/job-card';
import { fetchCompanyById, fetchCompanyReviews, fetchJobs, normalizeJob } from '@/lib/api';

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [reviewsData, setReviewsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'reviews'>('jobs');

  useEffect(() => {
    if (!companyId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [companyData, allJobs, reviews] = await Promise.all([
        fetchCompanyById(companyId!),
        fetchJobs(),
        fetchCompanyReviews(companyId!).catch(() => null),
      ]);
      setCompany(companyData);
      setJobs(allJobs.filter((j) => j.companyId === companyId));
      setReviewsData(reviews);
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy công ty');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Đang tải thông tin công ty...</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="font-extrabold text-lg text-foreground mb-2">Không tìm thấy công ty</h2>
        <p className="text-muted-foreground text-sm mb-6">{error}</p>
        <Button asChild variant="outline" className="rounded-xl gap-2">
          <Link to="/companies"><ArrowLeft className="w-4 h-4" />Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link to="/companies" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />Danh sách công ty
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{company.companyName}</span>
      </div>

      {/* Company header */}
      <div className="p-6 bg-card border border-border rounded-2xl mb-6">
        <div className="flex items-start gap-5">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.companyName}
              className="w-20 h-20 rounded-2xl object-contain bg-background border border-border p-2 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center shrink-0">
              <Building2 className="w-10 h-10 text-primary" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-xl md:text-2xl font-extrabold text-foreground">{company.companyName}</h1>
              {company.isVerified && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Đã xác thực
                </span>
              )}
            </div>

            {company.industry && <p className="text-sm text-muted-foreground mb-3">{company.industry}</p>}

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {company.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />{company.location}
                </span>
              )}
              {company.employeeCount && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />{company.employeeCount} nhân viên
                </span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />Website
                </a>
              )}
              {reviewsData && reviewsData.totalReviews > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {reviewsData.averageRating.toFixed(1)} ({reviewsData.totalReviews} đánh giá)
                </span>
              )}
            </div>
          </div>
        </div>

        {company.description && (
          <div className="mt-5 pt-5 border-t border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">{company.description}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex border-b border-border bg-secondary/40">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'jobs' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Việc làm đang tuyển
            <span className="px-1.5 rounded-full text-[10px] bg-secondary text-foreground font-bold border border-border">
              {jobs.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Star className="w-4 h-4" />
            Đánh giá
            {reviewsData && reviewsData.totalReviews > 0 && (
              <span className="px-1.5 rounded-full text-[10px] bg-secondary text-foreground font-bold border border-border">
                {reviewsData.totalReviews}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'jobs' ? (
            jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Công ty này chưa có tin tuyển dụng nào đang mở.</p>
                <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl gap-2 text-xs">
                  <Link to="/jobs">Xem tất cả việc làm</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} onClick={() => navigate(`/jobs/${job.id}`)} />
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {!reviewsData || reviewsData.reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Chưa có đánh giá nào cho công ty này.</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-secondary/50 border border-border rounded-xl flex items-center justify-between mb-4">
                    <div>
                      <p className="font-bold text-sm text-foreground">Đánh giá trung bình</p>
                      <p className="text-[11px] text-muted-foreground">Từ {reviewsData.totalReviews} ứng viên đã nộp đơn</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-3xl font-extrabold text-foreground">{reviewsData.averageRating.toFixed(1)}</span>
                      <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                    </div>
                  </div>

                  {reviewsData.reviews.map((rev: any) => (
                    <div key={rev.id} className="p-4 bg-card border border-border rounded-xl space-y-2">
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
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
