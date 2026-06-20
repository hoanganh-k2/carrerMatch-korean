import { useEffect, useMemo, useState } from 'react';
import { fetchMyJobUserProfile, updateMyJobUserProfile } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { computeReadiness } from '@/lib/readiness';
import { DashboardShell, candidateNav } from '@/components/layout/dashboard-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { SkillPicker } from '@/components/skill-picker';
import { LoadingBlock } from '@/components/ui/spinner';

const TOPIKS = [
  { value: 'NONE', label: 'Chưa có / mới học' },
  { value: 'TOPIK_I_LEVEL_1', label: 'TOPIK 1' },
  { value: 'TOPIK_I_LEVEL_2', label: 'TOPIK 2' },
  { value: 'TOPIK_II_LEVEL_3', label: 'TOPIK 3' },
  { value: 'TOPIK_II_LEVEL_4', label: 'TOPIK 4' },
  { value: 'TOPIK_II_LEVEL_5', label: 'TOPIK 5' },
  { value: 'TOPIK_II_LEVEL_6', label: 'TOPIK 6' },
];

const ROLES = ['', 'BrSE', 'Comtor', 'SE', 'QA', 'PM'];

export function ProfilePage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const [topik, setTopik] = useState('NONE');
  const [years, setYears] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState<number | ''>('');
  const [salaryMax, setSalaryMax] = useState<number | ''>('');
  const [locations, setLocations] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isBrSE, setIsBrSE] = useState(false);
  const [openToWork, setOpenToWork] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchMyJobUserProfile(token)
      .then((p) => {
        if (!p) return;
        setTopik(p.topikLevel ?? 'NONE');
        setYears(p.yearsExperience ?? 0);
        setSkills(p.skillsExtracted ?? []);
        setSalaryMin(p.desiredSalaryMin ?? '');
        setSalaryMax(p.desiredSalaryMax ?? '');
        setLocations((p.locationPrefs ?? []).join(', '));
        setTargetRole(p.targetKoreanRole ?? '');
        setIsBrSE(!!p.isBrSE);
        setOpenToWork(p.openToWork ?? true);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Lỗi tải hồ sơ'))
      .finally(() => setLoading(false));
  }, [token]);

  const readiness = useMemo(
    () => computeReadiness({ topikLevel: topik, skillCount: skills.length, yearsExperience: years, isBrSE, hasKoreanRole: !!targetRole }).score,
    [topik, skills.length, years, isBrSE, targetRole],
  );

  const save = async () => {
    if (!token) return;
    setSaving(true); setMsg(''); setErr('');
    try {
      await updateMyJobUserProfile({
        topikLevel: topik,
        yearsExperience: Number(years) || 0,
        skillsExtracted: skills,
        desiredSalaryMin: salaryMin === '' ? undefined : Number(salaryMin),
        desiredSalaryMax: salaryMax === '' ? undefined : Number(salaryMax),
        locationPrefs: locations.split(',').map((s) => s.trim()).filter(Boolean),
        targetKoreanRole: targetRole || undefined,
        isBrSE,
        openToWork,
      }, token);
      setMsg('Đã lưu hồ sơ.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Cập nhật hồ sơ thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardShell
      nav={candidateNav}
      kr="프로필"
      eyebrow="Hồ sơ"
      title="Hồ sơ ứng viên"
      description="Hồ sơ càng đầy đủ, AI gợi ý việc càng chính xác."
      actions={
        <div className="flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
          Độ sẵn sàng <span className="signage-num font-bold">{readiness}%</span>
        </div>
      }
    >
      {loading ? (
        <LoadingBlock />
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Năng lực</CardTitle>
              <CardDescription>Tiếng Hàn, kinh nghiệm và kỹ năng IT.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Trình độ tiếng Hàn</label>
                  <Select value={topik} onChange={(e) => setTopik(e.target.value)}>
                    {TOPIKS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Số năm kinh nghiệm</label>
                  <Input type="number" min={0} max={40} value={years} onChange={(e) => setYears(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Kỹ năng IT</label>
                <SkillPicker value={skills} onChange={setSkills} columns />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mong muốn công việc</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Lương mong muốn tối thiểu (VND)</label>
                  <Input type="number" min={0} step={1000000} value={salaryMin} onChange={(e) => setSalaryMin(e.target.value === '' ? '' : Number(e.target.value))} placeholder="VD: 15000000" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Lương mong muốn tối đa (VND)</label>
                  <Input type="number" min={0} step={1000000} value={salaryMax} onChange={(e) => setSalaryMax(e.target.value === '' ? '' : Number(e.target.value))} placeholder="VD: 30000000" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Địa điểm mong muốn</label>
                  <Input value={locations} onChange={(e) => setLocations(e.target.value)} placeholder="Hà Nội, Seoul, Remote" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Vai trò mục tiêu</label>
                  <Select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                    {ROLES.map((r) => <option key={r} value={r}>{r || 'Chưa xác định'}</option>)}
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isBrSE} onChange={(e) => setIsBrSE(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                  Tôi đã/đang làm BrSE
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={openToWork} onChange={(e) => setOpenToWork(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                  Đang sẵn sàng tìm việc
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu hồ sơ'}</Button>
            {msg && <span className="text-sm text-primary">{msg}</span>}
            {err && <span className="text-sm text-destructive">{err}</span>}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
