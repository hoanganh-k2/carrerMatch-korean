import React, { useEffect, useState } from 'react';
import { fetchSkillTaxonomy } from '@/lib/api';

/**
 * Multi-select kỹ năng lấy từ bảng skill_taxonomy của backend.
 * Dùng chung cho: profile ứng viên, form đăng tin recruiter, form subscription.
 */
export function SkillPicker({
  selected,
  onChange,
  label = 'Kỹ năng',
}: {
  selected: string[];
  onChange: (skills: string[]) => void;
  label?: string;
}) {
  const [skills, setSkills] = useState<Array<{ skillName: string; category: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkillTaxonomy()
      .then((data) =>
        setSkills(
          data.map((s: any) => ({
            skillName: s.skillName ?? s.skill_name,
            category: s.category,
          })),
        ),
      )
      .catch((err) => console.error('Lỗi tải skill taxonomy:', err))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (skill: string) => {
    onChange(
      selected.includes(skill) ? selected.filter((s) => s !== skill) : [...selected, skill],
    );
  };

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-7 w-20 rounded-lg bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  // Nhóm theo category để dễ chọn
  const byCategory = skills.reduce<Record<string, string[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s.skillName);
    return acc;
  }, {});

  const CATEGORY_LABELS: Record<string, string> = {
    programming: 'Ngôn ngữ lập trình',
    frontend: 'Frontend',
    backend: 'Backend',
    database: 'Database',
    devops: 'DevOps',
    cloud: 'Cloud',
    mobile: 'Mobile',
    testing: 'Kiểm thử',
    methodology: 'Quy trình',
    language: 'Tiếng Hàn',
    'korean-role': 'Vai trò Hàn - Việt',
  };

  return (
    <div className="space-y-3">
      <span className="block text-xs font-semibold text-muted-foreground">
        {label} <span className="text-primary font-bold">({selected.length} đã chọn)</span>
      </span>
      {Object.entries(byCategory).map(([category, names]) => (
        <div key={category} className="space-y-1.5">
          <span className="block text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">
            {CATEGORY_LABELS[category] || category}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {names.map((skill) => {
              const isSel = selected.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggle(skill)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    isSel
                      ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
