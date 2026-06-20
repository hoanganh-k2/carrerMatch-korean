import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, Loader2, RotateCcw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkillPicker } from '@/components/skill-picker';
import { ReadinessCard } from '@/components/readiness-card';
import { useAuth } from '@/context/auth-context';
import { fetchMyJobUserProfile } from '@/lib/api';
import {
  computeReadiness,
  readinessRank,
  ReadinessResult,
} from '@/lib/readiness';

const TOPIK_OPTIONS = [
  { label: 'Chưa học / Không chắc', value: 'NONE' },
  { label: 'Sơ cấp (TOPIK 1–2)', value: 'TOPIK_I_LEVEL_2' },
  { label: 'Trung cấp (TOPIK 3–4)', value: 'TOPIK_II_LEVEL_4' },
  { label: 'Cao cấp (TOPIK 5–6)', value: 'TOPIK_II_LEVEL_6' },
];

const EXP_OPTIONS = [
  { label: 'Chưa có', value: 0 },
  { label: 'Dưới 1 năm', value: 0.5 },
  { label: '1–3 năm', value: 2 },
  { label: '3–5 năm', value: 4 },
  { label: 'Trên 5 năm', value: 6 },
];

function clampScore(raw: string | null): number | null {
  if (raw === null) return null;
  const n = parseInt(raw, 10);
  if (isNaN(n)) return null;
  return Math.max(0, Math.min(100, n));
}

/** Mini-quiz cho khách (và bạn bè mở từ link chia sẻ) */
function ReadinessQuiz({ onDone }: { onDone: (r: ReadinessResult) => void }) {
  const [topik, setTopik] = useState('NONE');
  const [skills, setSkills] = useState<string[]>([]);
  const [years, setYears] = useState(0);
  const [isBrSE, setIsBrSE] = useState(false);

  const submit = () => {
    onDone(
      computeReadiness({
        topikLevel: topik,
        skillCount: skills.length,
        yearsExperience: years,
        isBrSE,
        hasKoreanRole: isBrSE,
      }),
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 md:p-8 space-y-6">
      <div>
        <h3 className="font-bold text-foreground mb-3">1. Trình độ tiếng Hàn của bạn?</h3>
        <div className="grid grid-cols-2 gap-3">
          {TOPIK_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTopik(t.value)}
              className={`p-3 rounded-md border text-center font-bold text-sm transition-all ${
                topik === t.value
                  ? 'border-primary bg-accent/60 text-primary shadow-sm'
                  : 'border-border bg-background text-foreground hover:border-primary/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-foreground mb-3">2. Số năm kinh nghiệm IT?</h3>
        <div className="flex flex-wrap gap-2">
          {EXP_OPTIONS.map((e) => (
            <button
              key={e.label}
              type="button"
              onClick={() => setYears(e.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                years === e.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary/40'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-foreground mb-1">3. Kỹ năng IT của bạn?</h3>
        <p className="text-xs text-muted-foreground mb-3">Chọn vài kỹ năng nổi bật (có thể bỏ qua).</p>
        <SkillPicker selected={skills} onChange={setSkills} label="Kỹ năng" />
      </div>

      <div>
        <h3 className="font-bold text-foreground mb-3">4. Bạn nhắm vị trí tiếng Hàn (BrSE/Comtor)?</h3>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsBrSE(true)}
            className={`flex-1 p-3 rounded-md border font-bold text-sm transition-all ${
              isBrSE
                ? 'border-primary bg-accent/60 text-primary shadow-sm'
                : 'border-border bg-background text-foreground hover:border-primary/40'
            }`}
          >
            Có chứ! 🇰🇷
          </button>
          <button
            type="button"
            onClick={() => setIsBrSE(false)}
            className={`flex-1 p-3 rounded-md border font-bold text-sm transition-all ${
              !isBrSE
                ? 'border-primary bg-accent/60 text-primary shadow-sm'
                : 'border-border bg-background text-foreground hover:border-primary/40'
            }`}
          >
            Chưa, IT thường thôi
          </button>
        </div>
      </div>

      <Button
        onClick={submit}
        className="w-full h-12 rounded-md font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        <Sparkles className="w-4 h-4" />
        Xem mức độ sẵn sàng của tôi
      </Button>
    </div>
  );
}

export default function ReadinessPage() {
  const [searchParams] = useSearchParams();
  const { token, role, displayName } = useAuth();

  const sharedScore = clampScore(searchParams.get('score'));
  const sharedName = searchParams.get('name');

  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [fromQuiz, setFromQuiz] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Ứng viên đăng nhập (và không phải đang xem link chia sẻ) → tự tính từ hồ sơ
  useEffect(() => {
    if (sharedScore !== null) return;
    if (!token || role !== 'candidate') return;
    setLoadingProfile(true);
    fetchMyJobUserProfile(token)
      .then((p) => {
        setResult(
          computeReadiness({
            topikLevel: p.topikLevel,
            skillCount: (p.skillsExtracted ?? []).length,
            yearsExperience: p.yearsExperience,
            isBrSE: p.isBrSE,
            hasKoreanRole: !!p.targetKoreanRole,
          }),
        );
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  }, [token, role, sharedScore]);

  const sharedRank = sharedScore !== null ? readinessRank(sharedScore) : null;

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 w-full space-y-6">
      <div className="space-y-2">
        <p className="eyebrow">Đánh giá</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Mức độ sẵn sàng thị trường Hàn 🇰🇷
        </h1>
        <p className="text-sm text-muted-foreground">
          Xem bạn đã sẵn sàng bao nhiêu % để đi làm thị trường Hàn — rồi khoe với bạn bè!
        </p>
      </div>

      {/* Banner khi mở từ link chia sẻ của người khác */}
      {sharedScore !== null && sharedRank && (
        <div className="rounded-lg border border-primary/20 bg-accent/40 p-5 text-center">
          <p className="text-sm text-foreground">
            <span className="font-bold">{sharedName || 'Một người bạn'}</span> đạt{' '}
            <span className="font-extrabold text-primary text-lg">{sharedScore}%</span> — “{sharedRank.title}”
          </p>
          <p className="text-xs text-muted-foreground mt-1">Còn bạn thì sao? Thử ngay bên dưới 👇</p>
        </div>
      )}

      {/* Nội dung chính */}
      {loadingProfile ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      ) : result ? (
        <div className="space-y-4">
          <ReadinessCard result={result} name={fromQuiz ? undefined : displayName || undefined} />
          {fromQuiz ? (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResult(null);
                  setFromQuiz(false);
                }}
                className="rounded-lg text-xs gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Làm lại
              </Button>
              {!token && (
                <Button asChild size="sm" className="rounded-lg text-xs gap-1.5 font-bold">
                  <Link to="/register">
                    Tạo tài khoản miễn phí <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Điểm tính từ hồ sơ của bạn.{' '}
              <Link to="/candidate/profile" className="text-primary font-semibold hover:underline">
                Cập nhật hồ sơ
              </Link>{' '}
              để tăng điểm nhé!
            </p>
          )}
        </div>
      ) : (
        <ReadinessQuiz
          onDone={(r) => {
            setResult(r);
            setFromQuiz(true);
          }}
        />
      )}
    </main>
  );
}
