import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  AlertCircle,
  Eye,
  Users,
  Sparkles,
  UploadCloud,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkillPicker } from '@/components/skill-picker';
import { useAuth } from '@/context/auth-context';
import {
  fetchMyCompany,
  fetchJobs,
  createJobPosting,
  updateJobPosting,
  deleteJobPosting,
  uploadFile,
  getUploadedFileUrl,
  Job,
} from '@/lib/api';

const inputClass =
  'w-full px-3 py-2.5 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all';

const TOPIK_OPTIONS = [
  { value: 'NONE', label: 'Không yêu cầu' },
  { value: 'TOPIK_II_LEVEL_3', label: 'TOPIK II - Cấp 3' },
  { value: 'TOPIK_II_LEVEL_4', label: 'TOPIK II - Cấp 4' },
  { value: 'TOPIK_II_LEVEL_5', label: 'TOPIK II - Cấp 5' },
  { value: 'TOPIK_II_LEVEL_6', label: 'TOPIK II - Cấp 6' },
];

const emptyForm = {
  title: '',
  description: '',
  jdFileUrl: '' as string,
  requiredSkills: [] as string[],
  salaryMin: '',
  salaryMax: '',
  jobType: 'fulltime',
  experienceYearsMin: '0',
  location: 'Hà Nội',
  applicationDeadline: '',
  minTopikRequired: 'NONE',
};

export default function RecruiterJobsPage() {
  const { token } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form đăng tin / sửa tin
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [uploadingJd, setUploadingJd] = useState(false);

  const handleJdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!token || !file) return;
    setUploadingJd(true);
    try {
      const { url } = await uploadFile(file, 'jd', token);
      setForm((f) => ({ ...f, jdFileUrl: url }));
    } catch (err: any) {
      alert(err.message || 'Tải file JD thất bại (nhận PDF/DOC/DOCX, tối đa 5MB)');
    } finally {
      setUploadingJd(false);
      e.target.value = '';
    }
  };

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const myCompany = await fetchMyCompany(token).catch(() => null);
      setCompany(myCompany);
      if (myCompany?.companyId) {
        const allJobs = await fetchJobs();
        setJobs(allJobs.filter((j: Job) => j.companyId === myCompany.companyId));
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (job: any) => {
    setEditingId(job.id);
    setForm({
      title: job.title ?? '',
      description: job.description ?? '',
      jdFileUrl: job.jdFileUrl ?? '',
      requiredSkills: job.requiredSkills ?? [],
      salaryMin: job.salaryMin != null ? String(job.salaryMin) : '',
      salaryMax: job.salaryMax != null ? String(job.salaryMax) : '',
      jobType: job.jobType ?? 'fulltime',
      experienceYearsMin: job.experienceYearsMin != null ? String(job.experienceYearsMin) : '0',
      location: job.location ?? 'Hà Nội',
      applicationDeadline: job.applicationDeadline
        ? new Date(job.applicationDeadline).toISOString().slice(0, 10)
        : '',
      minTopikRequired: job.minTopikRequired ?? 'NONE',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !company?.companyId) return;
    if (form.requiredSkills.length === 0) {
      alert('Vui lòng chọn ít nhất 1 kỹ năng bắt buộc');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateJobPosting(
          editingId,
          {
            title: form.title,
            description: form.description,
            jdFileUrl: form.jdFileUrl || null,
            requiredSkills: form.requiredSkills,
            salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
            salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
            jobType: form.jobType,
            experienceYearsMin: parseFloat(form.experienceYearsMin) || 0,
            location: form.location,
            applicationDeadline: new Date(form.applicationDeadline).toISOString(),
            minTopikRequired: form.minTopikRequired,
          },
          token,
        );
      } else {
        // Backend tự sinh jd_embedding từ title + description khi tạo tin
        await createJobPosting(
          {
            companyId: company.companyId,
            title: form.title,
            description: form.description,
            jdFileUrl: form.jdFileUrl || null,
            requiredSkills: form.requiredSkills,
            preferredSkills: [],
            salaryMin: form.salaryMin ? parseInt(form.salaryMin) : null,
            salaryMax: form.salaryMax ? parseInt(form.salaryMax) : null,
            jobType: form.jobType,
            experienceYearsMin: parseFloat(form.experienceYearsMin) || 0,
            location: form.location,
            applicationDeadline: form.applicationDeadline,
            minTopikRequired: form.minTopikRequired,
          },
          token,
        );
      }
      setShowForm(false);
      await load();
    } catch (err: any) {
      setError(err.message || 'Lưu tin thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('Xóa tin tuyển dụng này?')) return;
    try {
      await deleteJobPosting(id, token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Xóa thất bại — tin có thể đã có đơn ứng tuyển.');
    }
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-24 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
      </main>
    );
  }

  if (!company?.companyId) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10 w-full">
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-lg">
          <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-extrabold text-lg text-foreground mb-2">Bạn chưa có hồ sơ công ty</h3>
          <p className="text-muted-foreground text-xs mb-5">
            Tạo hồ sơ công ty trước khi đăng tin tuyển dụng.
          </p>
          <Link
            to="/recruiter/company"
            className="inline-block text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg px-5 py-2.5"
          >
            Tạo hồ sơ công ty
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 w-full space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="eyebrow">Tin tuyển dụng</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Tin tuyển dụng của {company.companyName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {jobs.length} tin — khi đăng tin mới, AI tự sinh vector ngữ nghĩa cho semantic search và
            matching.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Đăng tin mới
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-destructive/5 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form đăng / sửa tin */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-6 space-y-5 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              {editingId ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng mới'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground">
              Đóng
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Tiêu đề *
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              required
              placeholder="VD: [Hà Nội] Kỹ sư cầu nối BrSE Tiếng Hàn (TOPIK 5+)"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Mô tả công việc (JD) *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} resize-none`}
              rows={5}
              required
              placeholder="Mô tả chi tiết: trách nhiệm, yêu cầu, quyền lợi... (AI sẽ phân tích JD này để matching ứng viên)"
            />
          </div>

          {/* File JD đính kèm (tùy chọn) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              File JD đính kèm (tùy chọn — PDF/DOC/DOCX)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleJdUpload}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
                  {uploadingJd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  {form.jdFileUrl ? 'Đổi file JD' : 'Tải lên file JD'}
                </span>
              </label>
              {form.jdFileUrl && (
                <a
                  href={getUploadedFileUrl(form.jdFileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <FileText className="w-3.5 h-3.5" /> Xem file đã tải lên
                </a>
              )}
            </div>
          </div>

          <SkillPicker
            selected={form.requiredSkills}
            onChange={(skills) => setForm({ ...form, requiredSkills: skills })}
            label="Kỹ năng bắt buộc"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Lương từ (VND)
              </label>
              <input type="number" min="0" step="1000000" value={form.salaryMin}
                onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Lương đến (VND)
              </label>
              <input type="number" min="0" step="1000000" value={form.salaryMax}
                onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Hình thức
              </label>
              <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} className={inputClass}>
                <option value="fulltime">Full-time</option>
                <option value="parttime">Part-time</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Kinh nghiệm tối thiểu (năm)
              </label>
              <input type="number" min="0" step="0.5" value={form.experienceYearsMin}
                onChange={(e) => setForm({ ...form, experienceYearsMin: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Địa điểm *
              </label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Hạn nộp hồ sơ *
              </label>
              <input type="date" value={form.applicationDeadline}
                onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })} className={inputClass} required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Yêu cầu TOPIK tối thiểu
              </label>
              <select value={form.minTopikRequired}
                onChange={(e) => setForm({ ...form, minTopikRequired: e.target.value })} className={inputClass}>
                {TOPIK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full py-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-md shadow-md shadow-primary/20 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>
              {saving
                ? 'Đang lưu và sinh vector AI...'
                : editingId
                  ? 'Cập nhật tin'
                  : 'Đăng tin và kích hoạt AI matching'}
            </span>
          </Button>
        </form>
      )}

      {/* Danh sách tin */}
      {jobs.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-lg">
          <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-extrabold text-lg text-foreground mb-2">Chưa có tin tuyển dụng nào</h3>
          <p className="text-muted-foreground text-xs">Bấm "Đăng tin mới" để bắt đầu tìm ứng viên. 화이팅!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-card border border-border rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/40 transition-colors"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`rounded-md text-[10px] font-bold ${
                      job.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25'
                        : 'bg-secondary text-muted-foreground border-border'
                    }`}
                  >
                    {(job.status ?? 'active').toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    Hạn nộp:{' '}
                    {job.applicationDeadline
                      ? new Date(job.applicationDeadline).toLocaleDateString('vi-VN')
                      : '—'}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-foreground truncate">{job.title}</h3>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {job.viewsCount ?? 0} lượt xem
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {job.applyCount ?? 0} đơn
                  </span>
                  <span>{job.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/recruiter/jobs/${job.id}`}
                  className="text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg px-3.5 py-2 flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  Đơn & Ứng viên AI
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(job)}
                  className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground border border-border"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(job.id)}
                  className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive border border-border"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
