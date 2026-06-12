import React, { useEffect, useState } from 'react';
import { User, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkillPicker } from '@/components/skill-picker';
import { useAuth } from '@/context/auth-context';
import { fetchMyJobUserProfile, updateMyJobUserProfile } from '@/lib/api';

const TOPIK_OPTIONS = [
  { value: 'NONE', label: 'Chưa có chứng chỉ' },
  { value: 'TOPIK_I_LEVEL_1', label: 'TOPIK I - Cấp 1' },
  { value: 'TOPIK_I_LEVEL_2', label: 'TOPIK I - Cấp 2' },
  { value: 'TOPIK_II_LEVEL_3', label: 'TOPIK II - Cấp 3' },
  { value: 'TOPIK_II_LEVEL_4', label: 'TOPIK II - Cấp 4' },
  { value: 'TOPIK_II_LEVEL_5', label: 'TOPIK II - Cấp 5' },
  { value: 'TOPIK_II_LEVEL_6', label: 'TOPIK II - Cấp 6' },
];

const LOCATIONS = ['Hà Nội', 'Đà Nẵng', 'Hồ Chí Minh', 'Seoul', 'Busan', 'Remote'];
const TARGET_ROLES = ['BRSE', 'COMTOR', 'SE', 'QA', 'PM'];

const inputClass =
  'w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all';

export default function ProfilePage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [topikLevel, setTopikLevel] = useState('NONE');
  const [koreanScore, setKoreanScore] = useState<string>('');
  const [isBrSE, setIsBrSE] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState<string>('');
  const [desiredSalaryMin, setDesiredSalaryMin] = useState<string>('');
  const [desiredSalaryMax, setDesiredSalaryMax] = useState<string>('');
  const [jobTypePrefs, setJobTypePrefs] = useState('fulltime');
  const [locationPrefs, setLocationPrefs] = useState<string[]>([]);
  const [targetKoreanRole, setTargetKoreanRole] = useState('');
  const [openToWork, setOpenToWork] = useState(true);
  const [completeness, setCompleteness] = useState(0);

  useEffect(() => {
    if (!token) return;
    fetchMyJobUserProfile(token)
      .then((p) => {
        setFullName(p.fullName ?? '');
        setTopikLevel(p.topikLevel ?? 'NONE');
        setKoreanScore(p.koreanScore != null ? String(p.koreanScore) : '');
        setIsBrSE(Boolean(p.isBrSE));
        setSkills(p.skillsExtracted ?? []);
        setYearsExperience(p.yearsExperience != null ? String(p.yearsExperience) : '');
        setDesiredSalaryMin(p.desiredSalaryMin != null ? String(p.desiredSalaryMin) : '');
        setDesiredSalaryMax(p.desiredSalaryMax != null ? String(p.desiredSalaryMax) : '');
        setJobTypePrefs(p.jobTypePrefs ?? 'fulltime');
        setLocationPrefs(p.locationPrefs ?? []);
        setTargetKoreanRole(p.targetKoreanRole ?? '');
        setOpenToWork(p.openToWork ?? true);
        setCompleteness(p.profileCompleteness ?? 0);
      })
      .catch((err) => setError(err.message || 'Lỗi tải hồ sơ'))
      .finally(() => setLoading(false));
  }, [token]);

  const toggleLocation = (loc: string) => {
    setLocationPrefs((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc],
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await updateMyJobUserProfile(
        {
          fullName: fullName.trim() || undefined,
          topikLevel,
          koreanScore: koreanScore ? parseInt(koreanScore) : null,
          isBrSE,
          skillsExtracted: skills,
          yearsExperience: yearsExperience ? parseFloat(yearsExperience) : null,
          desiredSalaryMin: desiredSalaryMin ? parseInt(desiredSalaryMin) : null,
          desiredSalaryMax: desiredSalaryMax ? parseInt(desiredSalaryMax) : null,
          jobTypePrefs,
          locationPrefs,
          targetKoreanRole: targetKoreanRole || null,
          openToWork,
        },
        token,
      );
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Lưu hồ sơ thất bại');
    } finally {
      setSaving(false);
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
            <User className="w-6 h-6 text-primary" />
            Hồ sơ ứng viên
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hồ sơ càng đầy đủ, AI gợi ý việc làm càng chính xác. Khi bạn lưu, hệ thống tự sinh lại
            vector kỹ năng cho matching.
          </p>
        </div>
        <div className="shrink-0 text-center bg-accent rounded-xl px-4 py-3">
          <span className="block text-xl font-black text-primary">
            {Math.round(completeness * 100)}%
          </span>
          <span className="text-[10px] font-bold text-accent-foreground uppercase">Hoàn thiện</span>
        </div>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Đã lưu hồ sơ và cập nhật vector AI thành công! 화이팅!</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Thông tin cơ bản */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wide">
            Thông tin cơ bản
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Họ và tên
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Số năm kinh nghiệm
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className={inputClass}
                placeholder="VD: 2.5"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={openToWork}
              onChange={(e) => setOpenToWork(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border text-primary"
            />
            <span>
              Đang tìm việc (Open to work) — cho phép nhà tuyển dụng tìm thấy hồ sơ của bạn qua AI
              matching
            </span>
          </label>
        </section>

        {/* Năng lực tiếng Hàn */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wide">
            Năng lực tiếng Hàn 한국어
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Trình độ TOPIK
              </label>
              <select
                value={topikLevel}
                onChange={(e) => setTopikLevel(e.target.value)}
                className={inputClass}
              >
                {TOPIK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Điểm TOPIK (0-300)
              </label>
              <input
                type="number"
                min="0"
                max="300"
                value={koreanScore}
                onChange={(e) => setKoreanScore(e.target.value)}
                className={inputClass}
                placeholder="VD: 210"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Vai trò hướng tới
              </label>
              <select
                value={targetKoreanRole}
                onChange={(e) => setTargetKoreanRole(e.target.value)}
                className={inputClass}
              >
                <option value="">-- Chọn vai trò --</option>
                {TARGET_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isBrSE}
              onChange={(e) => setIsBrSE(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border text-primary"
            />
            <span>Tôi đã có kinh nghiệm làm Kỹ sư cầu nối (BrSE)</span>
          </label>
        </section>

        {/* Kỹ năng */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wide">
            Kỹ năng chuyên môn
          </h2>
          <SkillPicker selected={skills} onChange={setSkills} label="Chọn kỹ năng của bạn" />
        </section>

        {/* Mong muốn công việc */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-extrabold text-foreground uppercase tracking-wide">
            Mong muốn công việc
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Lương tối thiểu (VND)
              </label>
              <input
                type="number"
                min="0"
                step="1000000"
                value={desiredSalaryMin}
                onChange={(e) => setDesiredSalaryMin(e.target.value)}
                className={inputClass}
                placeholder="VD: 20000000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Lương mong muốn (VND)
              </label>
              <input
                type="number"
                min="0"
                step="1000000"
                value={desiredSalaryMax}
                onChange={(e) => setDesiredSalaryMax(e.target.value)}
                className={inputClass}
                placeholder="VD: 40000000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Hình thức làm việc
              </label>
              <select
                value={jobTypePrefs}
                onChange={(e) => setJobTypePrefs(e.target.value)}
                className={inputClass}
              >
                <option value="fulltime">Full-time</option>
                <option value="parttime">Part-time</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Khu vực mong muốn
            </span>
            <div className="flex flex-wrap gap-1.5">
              {LOCATIONS.map((loc) => {
                const isSel = locationPrefs.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isSel
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <Button
          type="submit"
          disabled={saving}
          className="w-full py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-xl shadow-md shadow-primary/20 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Đang lưu và sinh vector AI...' : 'Lưu hồ sơ'}</span>
        </Button>
      </form>
    </main>
  );
}
