import { useEffect, useMemo, useState } from 'react';
import { fetchSkillTaxonomy } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SkillPickerProps {
  value: string[];
  onChange: (skills: string[]) => void;
  max?: number;
  /** Xếp các nhóm kỹ năng thành nhiều cột để giảm chiều cao (ít cuộn hơn) */
  columns?: boolean;
}

const FALLBACK = [
  'Java', 'Spring', 'React', 'Node.js', 'Python', 'PHP', 'Vue.js', 'TypeScript',
  'AWS', 'Docker', 'Kotlin', 'Swift', 'Flutter', '.NET', 'SQL', 'Communication',
];

/** Chọn nhiều kỹ năng (chip toggle), gom nhóm theo category từ /skill-taxonomy. */
export function SkillPicker({ value, onChange, max, columns }: SkillPickerProps) {
  const [groups, setGroups] = useState<Record<string, string[]>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchSkillTaxonomy()
      .then((items) => {
        const g: Record<string, string[]> = {};
        for (const it of items) {
          const cat = it.category || 'Khác';
          (g[cat] ??= []).push(it.skillName);
        }
        setGroups(g);
      })
      .catch(() => setGroups({ 'Phổ biến': FALLBACK }))
      .finally(() => setLoaded(true));
  }, []);

  const toggle = (skill: string) => {
    if (value.includes(skill)) {
      onChange(value.filter((s) => s !== skill));
    } else {
      if (max && value.length >= max) return;
      onChange([...value, skill]);
    }
  };

  const entries = useMemo(() => Object.entries(groups), [groups]);

  if (!loaded) {
    return <div className="h-24 animate-pulse rounded-md bg-secondary" aria-hidden />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className={cn(columns ? 'grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2' : 'flex flex-col gap-4')}>
        {entries.map(([cat, skills]) => (
          <div key={cat}>
            <p className="eyebrow mb-2">{cat}</p>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => {
                const active = value.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggle(skill)}
                    aria-pressed={active}
                    className={cn(
                      'rounded-sm border px-3 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground hover:border-foreground/30',
                    )}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {max && (
        <p className="text-xs text-muted-foreground">
          Đã chọn {value.length}/{max} kỹ năng
        </p>
      )}
    </div>
  );
}
