import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wallet } from 'lucide-react';
import { Job } from '@/lib/api';

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const hasScore = typeof job.similarityScore === 'number';
  const scorePct = hasScore ? Math.round(job.similarityScore! * 100) : 0;

  const formatTopik = (level: string) => {
    if (level?.startsWith('TOPIK_II_LEVEL_')) {
      return `TOPIK II - Cấp ${level.replace('TOPIK_II_LEVEL_', '')}`;
    }
    if (level?.startsWith('TOPIK_I_LEVEL_')) {
      return `TOPIK I - Cấp ${level.replace('TOPIK_I_LEVEL_', '')}`;
    }
    return 'Không yêu cầu TOPIK';
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (min && max) {
      return `${(min / 1000000).toFixed(0)}M - ${(max / 1000000).toFixed(0)}M VND`;
    }
    if (min) return `Từ ${(min / 1000000).toFixed(0)}M VND`;
    if (max) return `Lên đến ${(max / 1000000).toFixed(0)}M VND`;
    return 'Thỏa thuận';
  };

  return (
    <Card
      onClick={onClick}
      className={`group bg-card border transition-all duration-300 flex flex-col justify-between h-full hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
        hasScore
          ? 'border-primary/30 shadow-md shadow-primary/5 hover:border-primary/50'
          : 'border-border hover:border-primary/30'
      }`}
    >
      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge
            variant="outline"
            className="bg-accent text-accent-foreground border-accent rounded-md py-0.5 text-[10px] font-semibold"
          >
            {formatTopik(job.minTopikRequired)}
          </Badge>

          {hasScore && (
            <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-md font-bold text-[10px] tracking-wide">
              ĐỘ PHÙ HỢP AI: {scorePct}%
            </Badge>
          )}
        </div>

        <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {job.title}
        </CardTitle>
        {job.company?.companyName && (
          <span className="text-xs text-muted-foreground font-medium">{job.company.companyName}</span>
        )}
      </CardHeader>

      <CardContent className="py-2 flex-grow space-y-4">
        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">{job.description}</p>

        <div className="grid grid-cols-2 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <Wallet className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-primary font-bold truncate">
              {formatSalary(job.salaryMin, job.salaryMax)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-border bg-secondary/40 flex flex-wrap gap-1.5">
        <div className="flex flex-wrap gap-1 w-full mb-3">
          {job.requiredSkills.slice(0, 6).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-background text-foreground/70 border border-border"
            >
              {skill}
            </span>
          ))}
        </div>

        <button
          type="button"
          className="w-full text-center text-xs font-bold rounded-lg bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all py-2 cursor-pointer"
        >
          Xem chi tiết và ứng tuyển
        </button>
      </CardFooter>
    </Card>
  );
}
