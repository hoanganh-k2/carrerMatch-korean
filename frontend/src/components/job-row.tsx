import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { MapPin, Briefcase, GraduationCap, Heart, Sparkles } from 'lucide-react';
import { CompanyLogo } from '@/components/ui/company-logo';
import { springSoft } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Job } from '@/lib/api';

interface JobRowProps {
  job: Job;
  onClick?: () => void;
  onSave?: () => void;
  saved?: boolean;
  featured?: boolean;
}

function formatTopik(level: string) {
  if (level?.startsWith('TOPIK_II_LEVEL_')) return `TOPIK II·${level.replace('TOPIK_II_LEVEL_', '')}`;
  if (level?.startsWith('TOPIK_I_LEVEL_')) return `TOPIK I·${level.replace('TOPIK_I_LEVEL_', '')}`;
  return null;
}

function formatSalary(min: number | null, max: number | null) {
  if (min && max) return `${(min / 1e6).toFixed(0)}–${(max / 1e6).toFixed(0)}M`;
  if (min) return `Từ ${(min / 1e6).toFixed(0)}M`;
  if (max) return `Đến ${(max / 1e6).toFixed(0)}M`;
  return 'Thỏa thuận';
}

/** Pill kỹ thuật: viền hairline, icon mảnh đơn sắc */
function Pill({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
      {icon}
      {children}
    </span>
  );
}

/**
 * Dòng việc làm gọn, ngang — logo công ty + thông tin súc tích (kiểu TopCV/ITviec).
 * Dùng ở trang Jobs (danh sách) thay cho lưới thẻ dọc.
 */
export function JobRow({ job, onClick, onSave, saved, featured }: JobRowProps) {
  const reduce = useReducedMotion();
  const hasScore = typeof job.similarityScore === 'number';
  const scorePct = hasScore ? Math.round(job.similarityScore! * 100) : 0;
  const topik = formatTopik(job.minTopikRequired);
  const skills = job.requiredSkills ?? [];
  const visibleSkills = skills.slice(0, 4);
  const extraSkills = skills.length - visibleSkills.length;

  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -2 }}
      transition={springSoft}
    >
      <div
        onClick={onClick}
        className="group flex cursor-pointer gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/20"
      >
        <CompanyLogo
          logoUrl={job.company?.logoUrl}
          name={job.company?.companyName}
          className="size-14"
          iconClassName="size-6"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {featured && (
                  <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                    Nổi bật
                  </span>
                )}
                <h3 className="truncate font-heading text-base font-bold text-foreground group-hover:text-primary">
                  {job.title}
                </h3>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {job.company?.companyName || 'Công ty đang cập nhật'}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="whitespace-nowrap font-mono text-sm font-bold text-primary">
                {formatSalary(job.salaryMin, job.salaryMax)}
              </span>
              {onSave && (
                <button
                  type="button"
                  aria-label={saved ? 'Bỏ lưu' : 'Lưu việc'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave();
                  }}
                  className="flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Heart className={cn('size-4', saved && 'fill-primary text-primary')} />
                </button>
              )}
            </div>
          </div>

          {/* Pills */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {job.location && (
              <Pill icon={<MapPin className="size-3" />}>{job.location}</Pill>
            )}
            {typeof job.experienceYearsMin === 'number' && (
              <Pill icon={<Briefcase className="size-3" />}>{job.experienceYearsMin} năm</Pill>
            )}
            {topik && <Pill icon={<GraduationCap className="size-3" />}>{topik}</Pill>}
            {hasScore && (
              <span className="inline-flex items-center gap-1 rounded-md border border-spark/30 bg-spark/10 px-2 py-0.5 font-mono text-xs font-bold text-spark">
                <Sparkles className="size-3" />
                {scorePct}%
              </span>
            )}
          </div>

          {/* Skills */}
          {visibleSkills.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {visibleSkills.map((s, i) => (
                <span
                  key={i}
                  className="rounded border border-border bg-secondary/50 px-1.5 py-0.5 text-xs text-foreground/70"
                >
                  {s}
                </span>
              ))}
              {extraSkills > 0 && (
                <span className="px-1 text-xs font-medium text-muted-foreground">+{extraSkills}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
