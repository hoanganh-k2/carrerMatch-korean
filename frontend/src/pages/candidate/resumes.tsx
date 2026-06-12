import React, { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Award,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import {
  fetchMyResumes,
  createResume,
  deleteResume,
  updateResume,
  addExperience,
  deleteExperience,
  addEducation,
  deleteEducation,
  addCertification,
  deleteCertification,
} from '@/lib/api';

const inputClass =
  'w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all';

export default function ResumesPage() {
  const { token } = useAuth();
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tạo CV mới
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [creating, setCreating] = useState(false);

  // Form thêm mục con: { resumeId, type } đang mở
  const [sectionForm, setSectionForm] = useState<{ resumeId: string; type: 'exp' | 'edu' | 'cert' } | null>(null);
  const [sectionData, setSectionData] = useState<Record<string, string>>({});
  const [savingSection, setSavingSection] = useState(false);

  const load = async () => {
    if (!token) return;
    try {
      const data = await fetchMyResumes(token);
      setResumes(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải CV');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newTitle.trim()) return;
    setCreating(true);
    try {
      await createResume(
        { title: newTitle.trim(), summary: newSummary.trim() || undefined, isDefault: resumes.length === 0 },
        token,
      );
      setNewTitle('');
      setNewSummary('');
      setShowCreate(false);
      await load();
    } catch (err: any) {
      alert(err.message || 'Tạo CV thất bại');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !window.confirm('Xóa CV này cùng toàn bộ nội dung?')) return;
    try {
      await deleteResume(id, token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Xóa thất bại');
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!token) return;
    try {
      await updateResume(id, { isDefault: true }, token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Cập nhật thất bại');
    }
  };

  const openSectionForm = (resumeId: string, type: 'exp' | 'edu' | 'cert') => {
    setSectionForm({ resumeId, type });
    setSectionData({});
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !sectionForm) return;
    setSavingSection(true);
    try {
      if (sectionForm.type === 'exp') {
        await addExperience(
          sectionForm.resumeId,
          {
            company: sectionData.company,
            position: sectionData.position,
            startDate: new Date(sectionData.startDate).toISOString(),
            endDate: sectionData.endDate ? new Date(sectionData.endDate).toISOString() : undefined,
            isCurrent: !sectionData.endDate,
            description: sectionData.description || undefined,
          },
          token,
        );
      } else if (sectionForm.type === 'edu') {
        await addEducation(
          sectionForm.resumeId,
          {
            school: sectionData.school,
            degree: sectionData.degree,
            major: sectionData.major,
            startYear: parseInt(sectionData.startYear),
            endYear: sectionData.endYear ? parseInt(sectionData.endYear) : undefined,
          },
          token,
        );
      } else {
        await addCertification(
          sectionForm.resumeId,
          {
            name: sectionData.name,
            issuer: sectionData.issuer || undefined,
            issuedAt: sectionData.issuedAt ? new Date(sectionData.issuedAt).toISOString() : undefined,
          },
          token,
        );
      }
      setSectionForm(null);
      await load();
    } catch (err: any) {
      alert(err.message || 'Thêm mục thất bại');
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async (type: 'exp' | 'edu' | 'cert', id: string) => {
    if (!token || !window.confirm('Xóa mục này?')) return;
    try {
      if (type === 'exp') await deleteExperience(id, token);
      else if (type === 'edu') await deleteEducation(id, token);
      else await deleteCertification(id, token);
      await load();
    } catch (err: any) {
      alert(err.message || 'Xóa thất bại');
    }
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 w-full space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            CV của tôi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý CV chi tiết: kinh nghiệm làm việc, học vấn và chứng chỉ (TOPIK, IT...).
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tạo CV mới
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form tạo CV */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-card border border-border rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-top-2"
        >
          <h2 className="text-sm font-extrabold text-foreground">CV mới</h2>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className={inputClass}
            placeholder="Tiêu đề CV — VD: CV BrSE - Nguyễn Văn A"
            required
          />
          <textarea
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
            className={`${inputClass} resize-none`}
            rows={3}
            placeholder="Tóm tắt bản thân (mục tiêu nghề nghiệp, thế mạnh...)"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="text-xs">
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tạo CV'}
            </Button>
          </div>
        </form>
      )}

      {resumes.length === 0 && !showCreate ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
          <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-extrabold text-lg text-foreground mb-2">Chưa có CV nào</h3>
          <p className="text-muted-foreground text-xs mb-4">
            Tạo CV đầu tiên để bắt đầu hành trình sự nghiệp Hàn - Việt. 화이팅!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {resumes.map((resume) => (
            <div key={resume.resumeId} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Resume header */}
              <div className="p-5 border-b border-border bg-secondary/50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-foreground">{resume.title}</h3>
                    {resume.isDefault && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-accent text-accent-foreground uppercase">
                        Mặc định
                      </span>
                    )}
                  </div>
                  {resume.summary && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{resume.summary}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!resume.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Đặt làm CV mặc định"
                      onClick={() => handleSetDefault(resume.resumeId)}
                      className="w-8 h-8 rounded-lg text-muted-foreground hover:text-amber-500 border border-border"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(resume.resumeId)}
                    className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive border border-border"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Experiences */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> Kinh nghiệm
                    </span>
                    <button
                      onClick={() => openSectionForm(resume.resumeId, 'exp')}
                      className="text-primary hover:underline text-[11px] font-bold"
                    >
                      + Thêm
                    </button>
                  </div>
                  {(resume.experiences ?? []).map((exp: any) => (
                    <div key={exp.id} className="p-3 bg-background border border-border rounded-lg text-xs space-y-0.5 relative group">
                      <button
                        onClick={() => handleDeleteSection('exp', exp.id)}
                        className="absolute top-2 right-2 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-foreground block">{exp.position}</span>
                      <span className="text-muted-foreground block">{exp.company}</span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {new Date(exp.startDate).getFullYear()} -{' '}
                        {exp.isCurrent ? 'Hiện tại' : exp.endDate ? new Date(exp.endDate).getFullYear() : ''}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Educations */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" /> Học vấn
                    </span>
                    <button
                      onClick={() => openSectionForm(resume.resumeId, 'edu')}
                      className="text-primary hover:underline text-[11px] font-bold"
                    >
                      + Thêm
                    </button>
                  </div>
                  {(resume.educations ?? []).map((edu: any) => (
                    <div key={edu.id} className="p-3 bg-background border border-border rounded-lg text-xs space-y-0.5 relative group">
                      <button
                        onClick={() => handleDeleteSection('edu', edu.id)}
                        className="absolute top-2 right-2 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-foreground block">{edu.school}</span>
                      <span className="text-muted-foreground block">
                        {edu.degree} — {edu.major}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {edu.startYear} - {edu.endYear || 'nay'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Certifications */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Chứng chỉ
                    </span>
                    <button
                      onClick={() => openSectionForm(resume.resumeId, 'cert')}
                      className="text-primary hover:underline text-[11px] font-bold"
                    >
                      + Thêm
                    </button>
                  </div>
                  {(resume.certifications ?? []).map((cert: any) => (
                    <div key={cert.id} className="p-3 bg-background border border-border rounded-lg text-xs space-y-0.5 relative group">
                      <button
                        onClick={() => handleDeleteSection('cert', cert.id)}
                        className="absolute top-2 right-2 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-foreground block">{cert.name}</span>
                      {cert.issuer && <span className="text-muted-foreground block">{cert.issuer}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Inline form thêm mục */}
              {sectionForm !== null && sectionForm.resumeId === resume.resumeId && (
                <form
                  onSubmit={handleSectionSubmit}
                  className="mx-5 mb-5 p-4 bg-secondary/60 border border-border rounded-xl space-y-3 animate-in fade-in"
                >
                  <h4 className="text-xs font-bold text-foreground">
                    {sectionForm.type === 'exp' && 'Thêm kinh nghiệm làm việc'}
                    {sectionForm.type === 'edu' && 'Thêm học vấn'}
                    {sectionForm.type === 'cert' && 'Thêm chứng chỉ'}
                  </h4>

                  {sectionForm.type === 'exp' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input className={inputClass} placeholder="Công ty *" required
                        value={sectionData.company || ''}
                        onChange={(e) => setSectionData({ ...sectionData, company: e.target.value })} />
                      <input className={inputClass} placeholder="Vị trí *" required
                        value={sectionData.position || ''}
                        onChange={(e) => setSectionData({ ...sectionData, position: e.target.value })} />
                      <input className={inputClass} type="date" required title="Ngày bắt đầu"
                        value={sectionData.startDate || ''}
                        onChange={(e) => setSectionData({ ...sectionData, startDate: e.target.value })} />
                      <input className={inputClass} type="date" title="Ngày kết thúc (bỏ trống nếu đang làm)"
                        value={sectionData.endDate || ''}
                        onChange={(e) => setSectionData({ ...sectionData, endDate: e.target.value })} />
                      <textarea className={`${inputClass} md:col-span-2 resize-none`} rows={2}
                        placeholder="Mô tả công việc"
                        value={sectionData.description || ''}
                        onChange={(e) => setSectionData({ ...sectionData, description: e.target.value })} />
                    </div>
                  )}

                  {sectionForm.type === 'edu' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input className={inputClass} placeholder="Trường *" required
                        value={sectionData.school || ''}
                        onChange={(e) => setSectionData({ ...sectionData, school: e.target.value })} />
                      <input className={inputClass} placeholder="Bằng cấp (Đại học, Thạc sĩ...) *" required
                        value={sectionData.degree || ''}
                        onChange={(e) => setSectionData({ ...sectionData, degree: e.target.value })} />
                      <input className={inputClass} placeholder="Chuyên ngành *" required
                        value={sectionData.major || ''}
                        onChange={(e) => setSectionData({ ...sectionData, major: e.target.value })} />
                      <div className="flex gap-2">
                        <input className={inputClass} type="number" placeholder="Năm bắt đầu *" required
                          value={sectionData.startYear || ''}
                          onChange={(e) => setSectionData({ ...sectionData, startYear: e.target.value })} />
                        <input className={inputClass} type="number" placeholder="Năm kết thúc"
                          value={sectionData.endYear || ''}
                          onChange={(e) => setSectionData({ ...sectionData, endYear: e.target.value })} />
                      </div>
                    </div>
                  )}

                  {sectionForm.type === 'cert' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input className={inputClass} placeholder="Tên chứng chỉ (VD: TOPIK II Level 5) *" required
                        value={sectionData.name || ''}
                        onChange={(e) => setSectionData({ ...sectionData, name: e.target.value })} />
                      <input className={inputClass} placeholder="Đơn vị cấp"
                        value={sectionData.issuer || ''}
                        onChange={(e) => setSectionData({ ...sectionData, issuer: e.target.value })} />
                      <input className={inputClass} type="date" title="Ngày cấp"
                        value={sectionData.issuedAt || ''}
                        onChange={(e) => setSectionData({ ...sectionData, issuedAt: e.target.value })} />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setSectionForm(null)} className="text-xs">
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      disabled={savingSection}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg"
                    >
                      {savingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lưu mục này'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
