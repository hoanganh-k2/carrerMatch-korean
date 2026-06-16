import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Sparkles,
  Loader2,
  AlertCircle,
  Star,
  Calendar,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import {
  fetchJobs,
  fetchApplicationsByJob,
  fetchMatchCandidates,
  updateApplicationStatus,
  createInterview,
  getUploadedFileUrl,
  Job,
} from '@/lib/api';

const inputClass =
  'w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all';

const STATUS_FLOW = ['applied', 'screening', 'interview', 'offer', 'rejected', 'accepted'];
const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  applied: { label: 'Đã nộp', cls: 'bg-blue-500/10 text-blue-700 border-blue-500/25' },
  screening: { label: 'Đang xem xét', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/25' },
  interview: { label: 'Phỏng vấn', cls: 'bg-purple-500/10 text-purple-700 border-purple-500/25' },
  offer: { label: 'Offer', cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25' },
  rejected: { label: 'Từ chối', cls: 'bg-destructive/10 text-destructive border-destructive/25' },
  accepted: { label: 'Đã nhận', cls: 'bg-teal-500/10 text-teal-700 border-teal-500/25' },
};

function formatTopik(level: string) {
  if (!level || level === 'NONE') return 'Không yêu cầu';
  return level.replace('TOPIK_II_LEVEL_', 'TOPIK II - Cấp ').replace('TOPIK_I_LEVEL_', 'TOPIK I - Cấp ');
}

export default function RecruiterJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const { token } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<'applications' | 'matches'>('applications');
  const [applications, setApplications] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form note/rating cho từng đơn
  const [noteFormId, setNoteFormId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteRating, setNoteRating] = useState(0);

  // Form tạo lịch phỏng vấn
  const [interviewFormId, setInterviewFormId] = useState<string | null>(null);
  const [ivTitle, setIvTitle] = useState('Phỏng vấn vòng kỹ thuật');
  const [ivDateTime, setIvDateTime] = useState('');
  const [ivDuration, setIvDuration] = useState('45');
  const [ivLink, setIvLink] = useState('');
  const [ivLanguage, setIvLanguage] = useState('Mixed');
  const [ivSaving, setIvSaving] = useState(false);

  const loadApplications = async () => {
    if (!token || !jobId) return;
    try {
      const apps = await fetchApplicationsByJob(jobId, token);
      setApplications(apps);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải đơn ứng tuyển');
    }
  };

  useEffect(() => {
    if (!token || !jobId) return;
    setLoading(true);
    Promise.all([
      fetchJobs().then((jobs) => setJob(jobs.find((j) => j.id === jobId) ?? null)),
      loadApplications(),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, jobId]);

  // Lazy-load AI matches khi mở tab
  useEffect(() => {
    if (activeTab === 'matches' && matches.length === 0 && token && jobId) {
      setMatchesLoading(true);
      fetchMatchCandidates(jobId, token)
        .then(setMatches)
        .catch((err) => setError(err.message || 'Lỗi tải ứng viên AI gợi ý'))
        .finally(() => setMatchesLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token, jobId]);

  const handleStatusChange = async (appId: string, status: string) => {
    if (!token) return;
    try {
      await updateApplicationStatus(appId, { status }, token);
      await loadApplications();
    } catch (err: any) {
      alert(err.message || 'Cập nhật trạng thái thất bại');
    }
  };

  const handleNoteSubmit = async (e: React.FormEvent, appId: string, currentStatus: string) => {
    e.preventDefault();
    if (!token) return;
    try {
      await updateApplicationStatus(
        appId,
        {
          status: currentStatus,
          recruiterNote: noteText.trim() || undefined,
          recruiterRating: noteRating || undefined,
        },
        token,
      );
      setNoteFormId(null);
      setNoteText('');
      setNoteRating(0);
      await loadApplications();
    } catch (err: any) {
      alert(err.message || 'Lưu ghi chú thất bại');
    }
  };

  const handleCreateInterview = async (e: React.FormEvent, appId: string) => {
    e.preventDefault();
    if (!token || !ivDateTime) return;
    setIvSaving(true);
    try {
      await createInterview(
        {
          applicationId: appId,
          title: ivTitle,
          scheduledAt: new Date(ivDateTime).toISOString(),
          durationMinutes: parseInt(ivDuration) || 45,
          meetingLink: ivLink.trim() || undefined,
          interviewLanguage: ivLanguage,
        },
        token,
      );
      // Chuyển trạng thái đơn sang interview
      await updateApplicationStatus(appId, { status: 'interview' }, token);
      setInterviewFormId(null);
      setIvDateTime('');
      setIvLink('');
      await loadApplications();
      alert('Đã tạo lịch phỏng vấn và thông báo cho ứng viên!');
    } catch (err: any) {
      alert(err.message || 'Tạo lịch phỏng vấn thất bại');
    } finally {
      setIvSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-24 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 w-full space-y-6">
      <Link
        to="/recruiter/jobs"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh sách tin
      </Link>

      <div>
        <h1 className="text-xl font-extrabold text-foreground leading-snug">{job?.title || 'Tin tuyển dụng'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {job?.location} • Yêu cầu: {formatTopik(job?.minTopikRequired || 'NONE')}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'applications'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          Đơn ứng tuyển ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'matches'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Ứng viên AI gợi ý
        </button>
      </div>

      {activeTab === 'applications' ? (
        applications.length === 0 ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl">
            <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground text-xs">
              Chưa có đơn ứng tuyển nào. Hãy thử tab "Ứng viên AI gợi ý" để chủ động tìm người phù hợp.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const st = STATUS_LABELS[app.status] || STATUS_LABELS.applied;
              const scorePct = Math.round((app.matchScore ?? 0) * 100);
              const breakdown = app.matchBreakdownJson || {};
              return (
                <div key={app.applicationId} className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-sm text-foreground">
                          {app.candidate?.fullName || 'Ứng viên'}
                        </h3>
                        <Badge variant="outline" className={`rounded-md text-[10px] font-bold ${st.cls}`}>
                          {st.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {formatTopik(app.candidate?.topikLevel)}
                        </span>
                        <span>{app.candidate?.yearsExperience ?? '?'} năm kinh nghiệm</span>
                        {app.resumeId && (
                          <a
                            href={getUploadedFileUrl(app.resumeId)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline font-semibold"
                          >
                            <FileText className="w-3.5 h-3.5" /> Xem CV
                          </a>
                        )}
                      </div>
                      {(app.candidate?.skillsExtracted ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {app.candidate.skillsExtracted.slice(0, 8).map((s: string) => (
                            <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-foreground/70 border border-border">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 text-center bg-accent rounded-xl px-4 py-2.5">
                      <span className="block text-xl font-black text-primary">{scorePct}%</span>
                      <span className="text-[9px] font-bold text-accent-foreground uppercase">Match AI</span>
                      <div className="text-[9px] text-muted-foreground mt-1 space-y-0.5">
                        {breakdown.it_skill != null && <div>IT: {Math.round(breakdown.it_skill * 100)}%</div>}
                        {breakdown.korean_skill != null && <div>한국어: {Math.round(breakdown.korean_skill * 100)}%</div>}
                      </div>
                    </div>
                  </div>

                  {app.coverLetter && (
                    <p className="text-xs text-foreground/70 italic bg-secondary/60 rounded-lg p-3 leading-relaxed">
                      "{app.coverLetter}"
                    </p>
                  )}
                  {app.recruiterNote && (
                    <p className="text-[11px] text-muted-foreground">
                      Ghi chú: <span className="italic">"{app.recruiterNote}"</span>
                      {app.recruiterRating ? ` — ${app.recruiterRating}/5 ★` : ''}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.applicationId, e.target.value)}
                      className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                    >
                      {STATUS_FLOW.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s].label}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setInterviewFormId(interviewFormId === app.applicationId ? null : app.applicationId);
                        setNoteFormId(null);
                      }}
                      className="text-xs font-bold border border-border rounded-lg flex items-center gap-1.5 hover:bg-secondary"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Mời phỏng vấn
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setNoteFormId(noteFormId === app.applicationId ? null : app.applicationId);
                        setInterviewFormId(null);
                        setNoteText(app.recruiterNote || '');
                        setNoteRating(app.recruiterRating || 0);
                      }}
                      className="text-xs font-bold border border-border rounded-lg flex items-center gap-1.5 hover:bg-secondary"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Ghi chú & chấm điểm
                    </Button>
                  </div>

                  {/* Form ghi chú */}
                  {noteFormId === app.applicationId && (
                    <form
                      onSubmit={(e) => handleNoteSubmit(e, app.applicationId, app.status)}
                      className="p-4 bg-secondary/60 border border-border rounded-xl space-y-3 animate-in fade-in"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-muted-foreground mr-2">Chấm điểm:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setNoteRating(star)}>
                            <Star
                              className={`w-4.5 h-4.5 ${
                                star <= noteRating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/40'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={2}
                        className={`${inputClass} resize-none`}
                        placeholder="Ghi chú nội bộ về ứng viên..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setNoteFormId(null)} className="text-xs">
                          Hủy
                        </Button>
                        <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg">
                          Lưu ghi chú
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Form tạo lịch phỏng vấn */}
                  {interviewFormId === app.applicationId && (
                    <form
                      onSubmit={(e) => handleCreateInterview(e, app.applicationId)}
                      className="p-4 bg-secondary/60 border border-border rounded-xl space-y-3 animate-in fade-in"
                    >
                      <h4 className="text-xs font-bold text-foreground">Tạo lịch phỏng vấn</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input className={inputClass} value={ivTitle} onChange={(e) => setIvTitle(e.target.value)} placeholder="Tiêu đề buổi phỏng vấn *" required />
                        <input className={inputClass} type="datetime-local" value={ivDateTime} onChange={(e) => setIvDateTime(e.target.value)} required />
                        <input className={inputClass} type="number" min="15" step="15" value={ivDuration} onChange={(e) => setIvDuration(e.target.value)} placeholder="Thời lượng (phút)" />
                        <select className={inputClass} value={ivLanguage} onChange={(e) => setIvLanguage(e.target.value)}>
                          <option value="Korean">Tiếng Hàn</option>
                          <option value="English">Tiếng Anh</option>
                          <option value="Mixed">Hàn - Việt (Mixed)</option>
                        </select>
                        <input className={`${inputClass} md:col-span-2`} value={ivLink} onChange={(e) => setIvLink(e.target.value)} placeholder="Link Google Meet / Zoom" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setInterviewFormId(null)} className="text-xs">
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          disabled={ivSaving}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg flex items-center gap-1.5"
                        >
                          {ivSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                          Tạo lịch & thông báo
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Tab Ứng viên AI gợi ý */
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground bg-accent/60 border border-border rounded-xl p-3.5 leading-relaxed">
            <Sparkles className="w-3.5 h-3.5 text-primary inline mr-1 -mt-0.5" />
            AI so khớp vector kỹ năng của các ứng viên đã nộp đơn vào tin này với JD và xếp hạng
            kèm giải thích, giúp bạn ưu tiên hồ sơ phù hợp nhất.
          </p>

          {matchesLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-xs text-muted-foreground">AI đang quét và xếp hạng ứng viên...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-16 bg-card border border-dashed border-border rounded-3xl">
              <Sparkles className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground text-xs">Không tìm thấy ứng viên phù hợp trong hệ thống.</p>
            </div>
          ) : (
            matches.map((m, idx) => (
              <div
                key={m.candidateId}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-foreground text-background text-[10px] font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="font-extrabold text-sm text-foreground">{m.fullName}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {m.breakdown?.explanation}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="font-semibold">Ngữ nghĩa: {m.breakdown?.semanticMatch}</span>
                    <span>•</span>
                    <span>{m.breakdown?.koreanLevelMatch}</span>
                  </div>
                </div>
                <div className="shrink-0 text-center bg-accent rounded-xl px-4 py-3">
                  <span className="block text-2xl font-black text-primary">
                    {Math.round((m.finalMatchScore ?? 0) * 100)}%
                  </span>
                  <span className="text-[10px] font-bold text-accent-foreground uppercase">Phù hợp</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
