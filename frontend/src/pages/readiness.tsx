import { useMemo, useState } from 'react';
import { computeReadiness } from '@/lib/readiness';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SkillPicker } from '@/components/skill-picker';
import { ReadinessCard } from '@/components/readiness-card';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const TOPIKS = [
  { value: 'NONE', label: 'Chưa có / mới học' },
  { value: 'TOPIK_I_LEVEL_1', label: 'TOPIK 1' },
  { value: 'TOPIK_I_LEVEL_2', label: 'TOPIK 2' },
  { value: 'TOPIK_II_LEVEL_3', label: 'TOPIK 3' },
  { value: 'TOPIK_II_LEVEL_4', label: 'TOPIK 4' },
  { value: 'TOPIK_II_LEVEL_5', label: 'TOPIK 5' },
  { value: 'TOPIK_II_LEVEL_6', label: 'TOPIK 6' },
];

export function ReadinessPage() {
  const [name, setName] = useState('');
  const [topik, setTopik] = useState('NONE');
  const [years, setYears] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [hasKoreanRole, setHasKoreanRole] = useState(false);
  const [isBrSE, setIsBrSE] = useState(false);

  const result = useMemo(
    () => computeReadiness({ topikLevel: topik, skillCount: skills.length, yearsExperience: years, isBrSE, hasKoreanRole }),
    [topik, skills.length, years, isBrSE, hasKoreanRole],
  );

  const shareUrl = useMemo(() => {
    const p = new URLSearchParams({ score: String(result.score) });
    if (name.trim()) p.set('name', name.trim());
    return `${BASE_URL}/share/readiness?${p.toString()}`;
  }, [result.score, name]);

  return (
    <Section>
      <Container className="max-w-5xl">
        <div className="text-center">
          <Eyebrow>Độ sẵn sàng · 준비도</Eyebrow>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Bạn đã sẵn sàng đi Hàn chưa?
          </h1>
          <p className="mt-3 text-muted-foreground">Điền nhanh hồ sơ, nhận điểm sẵn sàng và danh hiệu để khoe với hội bạn.</p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Quiz */}
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium">Tên hiển thị (để khoe)</label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Minh Anh" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="topik" className="text-sm font-medium">Trình độ tiếng Hàn</label>
                <Select id="topik" value={topik} onChange={(e) => setTopik(e.target.value)}>
                  {TOPIKS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="years" className="text-sm font-medium">Số năm kinh nghiệm IT</label>
                <Input id="years" type="number" min={0} max={30} value={years} onChange={(e) => setYears(Number(e.target.value) || 0)} />
              </div>
              <div className="flex flex-col justify-end gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={hasKoreanRole} onChange={(e) => setHasKoreanRole(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                  Mục tiêu vai trò tiếng Hàn (BrSE/Comtor)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isBrSE} onChange={(e) => setIsBrSE(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                  Đã/đang làm BrSE
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Kỹ năng IT của bạn</label>
              <SkillPicker value={skills} onChange={setSkills} max={12} columns />
            </div>
          </div>

          {/* Kết quả (sticky) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ReadinessCard result={result} name={name.trim() || undefined} shareUrl={shareUrl} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
