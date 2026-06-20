import { Link } from 'react-router-dom';
import { MapPin, Wallet } from 'lucide-react';
import type { Job } from '@/lib/api';
import { CompanyLogo } from '@/components/ui/company-logo';
import { Badge } from '@/components/ui/badge';
import { MatchBadge } from '@/components/ui/match-badge';
import { formatSalary, topikLabel, jobTypeLabel } from '@/lib/utils';

export function JobCard({ job }: { job: Job }) {
  const hasMatch = typeof job.similarityScore === 'number';

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CompanyLogo name={job.company?.companyName} logoUrl={job.company?.logoUrl} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{job.company?.companyName ?? 'Công ty Hàn Quốc'}</p>
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" /> {job.location}
            </p>
          </div>
        </div>
        {hasMatch && <MatchBadge score={job.similarityScore!} size="sm" />}
      </div>

      <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug tracking-tight group-hover:text-primary">
        {job.title}
      </h3>

      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <Badge variant="cobalt">{topikLabel(job.minTopikRequired)}</Badge>
        {job.jobType && <Badge variant="outline">{jobTypeLabel(job.jobType)}</Badge>}
        {job.requiredSkills.slice(0, 2).map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
        {job.requiredSkills.length > 2 && (
          <Badge variant="outline">+{job.requiredSkills.length - 2}</Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-border pt-3 text-sm font-medium text-foreground">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        <span className="signage-num">{formatSalary(job.salaryMin, job.salaryMax)}</span>
      </div>
    </Link>
  );
}
