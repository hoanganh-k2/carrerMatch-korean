import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Briefcase,
  Calendar,
  Mail,
  Video,
  Check,
  X,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import {
  fetchMyApplications,
  fetchMyInterviews,
  updateInterviewStatus,
  submitInterviewFeedback,
  fetchMySubscriptions,
  createSubscription,
  deleteSubscription,
  triggerEmailAlerts
} from '@/lib/api';

interface CandidateDashboardProps {
  token: string | null;
  role: string | null;
}

export function CandidateDashboard({ token, role }: CandidateDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  // Subscriptions form state
  const [subSkills, setSubSkills] = useState<string[]>([]);
  const [subLocations, setSubLocations] = useState<string[]>([]);
  const [subTopik, setSubTopik] = useState('NONE');
  const [creatingSub, setCreatingSub] = useState(false);
  const [triggeringAlerts, setTriggeringAlerts] = useState(false);
  const [alertResult, setAlertResult] = useState<string | null>(null);

  // Reschedule state
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleText, setRescheduleText] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Available skills & locations to choose for subscriptions
  const AVAILABLE_SKILLS = [
    'Java', 'Spring Boot', 'React', 'Node.js', 'TypeScript', 'PostgreSQL',
    'Korean Translation', 'Business Korean', 'Technical Interpretation', 'Jira', 'Agile'
  ];
  const AVAILABLE_LOCATIONS = ['Hà Nội', 'Đà Nẵng', 'Hồ Chí Minh', 'Seoul', 'Remote'];

  useEffect(() => {
    if (token && role === 'candidate') {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [token, role]);

  const loadDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [appsData, interviewsData, subsData] = await Promise.all([
        fetchMyApplications(token),
        fetchMyInterviews(token),
        fetchMySubscriptions(token)
      ]);
      setApplications(appsData);
      setInterviews(interviewsData);
      setSubscriptions(subsData);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError('Lỗi kết nối khi tải dữ liệu dashboard cá nhân.');
    } finally {
      setLoading(false);
    }
  };

  // Interview actions
  const handleAcceptInterview = async (id: string) => {
    if (!token) return;
    try {
      await updateInterviewStatus(id, 'scheduled', token);
      // Reload interviews list
      const freshInterviews = await fetchMyInterviews(token);
      setInterviews(freshInterviews);
      alert('Đã xác nhận tham gia buổi phỏng vấn!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Thao tác thất bại');
    }
  };

  const handleDeclineInterview = async (id: string) => {
    if (!token) return;
    if (!window.confirm('Bạn có chắc muốn từ chối buổi phỏng vấn này?')) return;
    try {
      await updateInterviewStatus(id, 'cancelled', token);
      // Reload interviews list
      const freshInterviews = await fetchMyInterviews(token);
      setInterviews(freshInterviews);
      alert('Đã hủy tham gia buổi phỏng vấn!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Thao tác thất bại');
    }
  };

  const handleRescheduleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !rescheduleId || !rescheduleText.trim()) return;

    setSubmittingReschedule(true);
    try {
      await submitInterviewFeedback(rescheduleId, rescheduleText, token);
      await updateInterviewStatus(rescheduleId, 'rescheduled', token);
      setRescheduleId(null);
      setRescheduleText('');
      // Reload interviews list
      const freshInterviews = await fetchMyInterviews(token);
      setInterviews(freshInterviews);
      alert('Đã gửi yêu cầu đổi lịch phỏng vấn!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Thao tác thất bại');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  // Subscription Actions
  const handleToggleSkill = (skill: string) => {
    setSubSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleToggleLocation = (loc: string) => {
    setSubLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (subSkills.length === 0) {
      alert('Vui lòng chọn ít nhất 1 kỹ năng để nhận thông tin việc làm');
      return;
    }

    setCreatingSub(true);
    try {
      await createSubscription(
        {
          skills: subSkills,
          locations: subLocations.length > 0 ? subLocations : undefined,
          topikLevel: subTopik
        },
        token
      );
      // Reset form
      setSubSkills([]);
      setSubLocations([]);
      setSubTopik('NONE');
      // Reload list
      const freshSubs = await fetchMySubscriptions(token);
      setSubscriptions(freshSubs);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi thêm đăng ký');
    } finally {
      setCreatingSub(false);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!token) return;
    if (!window.confirm('Bạn muốn hủy đăng ký nhận tin này?')) return;
    try {
      await deleteSubscription(id, token);
      // Reload list
      const freshSubs = await fetchMySubscriptions(token);
      setSubscriptions(freshSubs);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Hủy thất bại');
    }
  };

  const handleTriggerEmailScan = async () => {
    if (!token) return;
    setTriggeringAlerts(true);
    setAlertResult(null);
    try {
      const res = await triggerEmailAlerts(token);
      setAlertResult(`Kết quả: ${res.message || 'Đã gửi email gợi ý các việc làm phù hợp!'}`);
    } catch (err: any) {
      console.error(err);
      setAlertResult('Gửi tin thất bại: Hãy kiểm tra kết nối email backend.');
    } finally {
      setTriggeringAlerts(false);
    }
  };

  // Helper formats
  const formatStatus = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      applied: { label: 'Đã nộp đơn', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      screening: { label: 'Đang xem xét', color: 'bg-yellow-500/10 text-amber-500 border-yellow-500/20 animate-pulse' },
      interview: { label: 'Mời phỏng vấn', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.15)]' },
      offer: { label: 'Nhận Offer', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]' },
      rejected: { label: 'Không phù hợp', color: 'bg-red-500/10 text-destructive border-red-500/20' },
      accepted: { label: 'Chấp nhận Offer', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' }
    };
    return map[status] || { label: status, color: 'bg-secondary text-muted-foreground border-border' };
  };

  const formatTopik = (level: string) => {
    if (level === 'NONE') return 'Không yêu cầu';
    if (level.startsWith('TOPIK_II_LEVEL_')) {
      return `TOPIK II Cấp ${level.replace('TOPIK_II_LEVEL_', '')}`;
    }
    if (level.startsWith('TOPIK_I_LEVEL_')) {
      return `TOPIK I Cấp ${level.replace('TOPIK_I_LEVEL_', '')}`;
    }
    return level;
  };

  if (!token || role !== 'candidate') {
    return (
      <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl max-w-2xl mx-auto mt-6">
        <Briefcase className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="font-extrabold text-lg text-foreground mb-2">Bảng điều khiển cá nhân</h3>
        <p className="text-muted-foreground max-w-sm mx-auto text-xs leading-relaxed mb-6">
          Vui lòng chọn vai trò **Ứng viên (Candidate)** trên thanh điều hướng để xem thông báo, tiến độ đơn ứng tuyển và quản lý đăng ký việc làm.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm text-muted-foreground">Đang đồng bộ hóa dữ liệu tuyển dụng từ server...</span>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/5 border border-red-500/20 text-destructive text-xs flex items-start gap-2 max-w-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Applications & Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Applications Tracker */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Trạng thái đơn ứng tuyển</h3>
              <p className="text-xs text-muted-foreground">Theo dõi tiến độ hồ sơ của bạn trực tuyến</p>
            </div>
            <Badge className="bg-accent text-primary border border-accent rounded-md">
              {applications.length} đơn đã nộp
            </Badge>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
              <Briefcase className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-xs">Bạn chưa nộp hồ sơ ứng tuyển công việc nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const statusDetails = formatStatus(app.status);
                const scorePct = Math.round(app.matchScore * 100);
                return (
                  <Card key={app.applicationId} className="bg-card border-border hover:border-primary/40 transition-all duration-300">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">
                            {app.job?.company?.companyName || 'Công ty'}
                          </span>
                          <span className="text-muted-foreground/70">•</span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {new Date(app.createdAt || app.stageTimestamps?.applied).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-foreground">
                          {app.job?.title}
                        </h4>
                        
                        {/* Match Breakdown visualization */}
                        <div className="flex items-center gap-3 pt-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-primary" />
                            Độ tương thích AI: <strong className="text-primary font-bold">{scorePct}%</strong>
                          </span>
                          {app.matchBreakdownJson && (
                            <>
                              <span>|</span>
                              <span>Kỹ năng: {Math.round((app.matchBreakdownJson.it_skill || 0.8) * 100)}%</span>
                              <span>|</span>
                              <span>Tiếng Hàn: {Math.round((app.matchBreakdownJson.korean_skill || 0.9) * 100)}%</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 justify-between md:justify-end shrink-0 border-t md:border-t-0 border-border pt-3 md:pt-0">
                        {app.recruiterNote && (
                          <span className="text-[10px] text-muted-foreground italic bg-secondary px-2 py-1 rounded border border-border">
                            Phản hồi: "{app.recruiterNote}"
                          </span>
                        )}
                        <Badge variant="outline" className={`py-1 rounded-md text-[10.5px] font-bold ${statusDetails.color}`}>
                          {statusDetails.label}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Interviews Schedules */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-foreground">Lịch phỏng vấn</h3>
              <p className="text-xs text-muted-foreground">Xem và xác nhận lịch hẹn phỏng vấn từ HR</p>
            </div>
            <Badge className="bg-purple-500/10 text-purple-600 border border-purple-500/20 rounded-md">
              {interviews.length} cuộc hẹn
            </Badge>
          </div>

          {interviews.length === 0 ? (
            <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
              <Calendar className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-xs">Bạn chưa có lịch hẹn phỏng vấn nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.map((iv) => {
                const isScheduled = iv.status === 'scheduled';
                const isRescheduled = iv.status === 'rescheduled';
                const isCancelled = iv.status === 'cancelled';
                const isCompleted = iv.status === 'completed';

                return (
                  <Card key={iv.id} className="bg-card border-border">
                    <CardContent className="p-5 space-y-4">
                      {/* Interview Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-foreground">{iv.title}</h4>
                          <span className="text-[10px] text-muted-foreground block">
                            Vị trí: {iv.application?.job?.title || 'Công việc đã ứng tuyển'}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold py-0.5 rounded-md ${
                            isCompleted
                              ? 'bg-secondary text-muted-foreground border-border'
                              : isCancelled
                              ? 'bg-red-500/15 text-destructive border-red-500/20'
                              : isRescheduled
                              ? 'bg-yellow-500/15 text-amber-500 border-yellow-500/20'
                              : 'bg-accent text-primary border-accent'
                          }`}
                        >
                          {isCompleted && 'ĐÃ HOÀN THÀNH'}
                          {isCancelled && 'ĐÃ HỦY'}
                          {isRescheduled && 'YÊU CẦU ĐỔI LỊCH'}
                          {isScheduled && 'LỊCH HẸN'}
                        </Badge>
                      </div>

                      {/* Details row */}
                      <div className="space-y-2 text-xs text-muted-foreground pt-1 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground/70 shrink-0" />
                          <span>
                            {new Date(iv.scheduledAt).toLocaleString('vi-VN', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}{' '}
                            ({iv.durationMinutes} phút)
                          </span>
                        </div>
                        {iv.meetingLink && (
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-muted-foreground/70 shrink-0" />
                            <a
                              href={iv.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:text-primary/80 font-semibold underline truncate"
                            >
                              {iv.meetingLink}
                            </a>
                          </div>
                        )}
                        {iv.notes && (
                          <p className="text-[11px] text-muted-foreground italic bg-secondary p-2.5 rounded border border-border mt-1">
                            Ghi chú HR: "{iv.notes}"
                          </p>
                        )}
                        {iv.feedback && (
                          <p className="text-[11px] text-muted-foreground italic bg-secondary p-2.5 rounded border border-border mt-1">
                            Phản hồi của tôi: "{iv.feedback}"
                          </p>
                        )}
                      </div>

                      {/* Action buttons (only if scheduled/rescheduled status) */}
                      {(isScheduled || isRescheduled) && (
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptInterview(iv.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold py-1.5 flex-1 flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Xác nhận tham gia</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeclineInterview(iv.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-destructive rounded-lg text-[11px] font-semibold py-1.5 flex-1 flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setRescheduleId(iv.id);
                              setRescheduleText('');
                            }}
                            className="bg-secondary hover:bg-accent text-foreground hover:text-foreground rounded-lg text-[11px] font-semibold py-1.5 flex-1 border border-border"
                          >
                            <span>Đổi lịch</span>
                          </Button>
                        </div>
                      )}

                      {/* Inline reschedule form overlay */}
                      {rescheduleId === iv.id && (
                        <form onSubmit={handleRescheduleRequest} className="space-y-2 p-3.5 bg-secondary border border-border rounded-xl mt-3">
                          <label className="block text-[11px] font-medium text-muted-foreground">
                            Lý do xin dời lịch & Đề xuất khung giờ mới:
                          </label>
                          <textarea
                            value={rescheduleText}
                            onChange={(e) => setRescheduleText(e.target.value)}
                            placeholder="Em muốn đổi sang chiều ngày mai 14h do bận lịch học quân sự ạ..."
                            rows={2}
                            className="w-full rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border p-2 text-xs resize-none"
                          />
                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setRescheduleId(null)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              Đóng
                            </button>
                            <Button
                              type="submit"
                              disabled={submittingReschedule || !rescheduleText.trim()}
                              size="sm"
                              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md text-[11px] px-3.5"
                            >
                              {submittingReschedule ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </Button>
                          </div>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Subscriptions Alert Block */}
      <div className="border-t border-border pt-10">
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Đăng ký nhận thông tin việc làm hàng tuần</h3>
            <p className="text-xs text-muted-foreground">Tự động nhận thông báo email chứa các job BrSE / Dev tiếng Hàn phù hợp nhất</p>
          </div>
          <Badge className="bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-md">
            {subscriptions.length} bộ lọc
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Subscriptions List */}
          <div className="lg:col-span-6 space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Đăng ký đang hoạt động</h4>
            {subscriptions.length === 0 ? (
              <div className="text-center py-10 bg-card border border-dashed border-border rounded-2xl">
                <Mail className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground text-xs">Bạn chưa tạo đăng ký nhận việc làm nào.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <Card key={sub.id} className="bg-card border-border flex items-center justify-between p-4 gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap gap-1.5">
                        {sub.skills.map((s: string) => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-secondary text-foreground border border-border">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                        {sub.locations && sub.locations.length > 0 && (
                          <span>Khu vực: <strong>{sub.locations.join(', ')}</strong></span>
                        )}
                        <span>Tiếng Hàn: <strong>{formatTopik(sub.topikLevel)}</strong></span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubscription(sub.id)}
                      className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-500/10 transition-colors shrink-0 border border-border"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}

            {/* Email Test Trigger Box */}
            <div className="p-5 bg-accent border border-border rounded-2xl space-y-3.5 mt-6 shadow-lg shadow-black/20">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <h4 className="font-extrabold text-sm text-foreground">Kiểm thử tính năng gửi Email (Demo)</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hệ thống email chạy nền hàng tuần. Trong môi trường thử nghiệm này, bạn có thể bấm nút bên dưới để kích hoạt quét khớp việc làm và gửi email ngay lập tức dựa trên các tiêu chí bạn đã đăng ký.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleTriggerEmailScan}
                  disabled={triggeringAlerts}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold py-1.5 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary/20 transition-all duration-300"
                >
                  {triggeringAlerts ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang quét...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Kích hoạt gửi Email ngay</span>
                    </>
                  )}
                </Button>
              </div>
              {alertResult && (
                <div className="p-3 bg-accent border border-accent rounded-xl text-xs text-primary flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{alertResult}</span>
                </div>
              )}
            </div>
          </div>

          {/* Create Subscriptions Form */}
          <div className="lg:col-span-6 bg-card p-6 rounded-2xl border border-border">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-primary" />
              <span>Tạo đăng ký nhận việc làm mới</span>
            </h4>
            
            <form onSubmit={handleCreateSubscription} className="space-y-5">
              {/* Skills select tag list */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2.5">
                  Chọn các Kỹ năng bạn quan tâm <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SKILLS.map((skill) => {
                    const isSelected = subSkills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => handleToggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Locations select tag list */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2.5">
                  Khu vực làm việc mong muốn
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_LOCATIONS.map((loc) => {
                    const isSelected = subLocations.includes(loc);
                    return (
                      <button
                        type="button"
                        key={loc}
                        onClick={() => handleToggleLocation(loc)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TOPIK selection */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  Trình độ tiếng Hàn tối thiểu
                </label>
                <select
                  value={subTopik}
                  onChange={(e) => setSubTopik(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-border"
                >
                  <option value="NONE">Không yêu cầu</option>
                  <option value="TOPIK_II_LEVEL_3">TOPIK II - Cấp 3</option>
                  <option value="TOPIK_II_LEVEL_4">TOPIK II - Cấp 4</option>
                  <option value="TOPIK_II_LEVEL_5">TOPIK II - Cấp 5</option>
                  <option value="TOPIK_II_LEVEL_6">TOPIK II - Cấp 6</option>
                </select>
              </div>

              <Button
                type="submit"
                disabled={creatingSub || subSkills.length === 0}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-5 text-xs font-semibold shadow-lg shadow-primary/15 flex items-center justify-center gap-1.5 transition-all duration-300"
              >
                {creatingSub ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Đăng ký nhận tin tuyển dụng</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
