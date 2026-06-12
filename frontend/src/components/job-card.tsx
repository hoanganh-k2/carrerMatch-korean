import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign } from 'lucide-react';
import { Job } from '@/lib/api';

interface JobCardProps {
  job: Job;
  onClick?: () => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const hasScore = typeof job.similarityScore === 'number';
  const scorePct = hasScore ? Math.round(job.similarityScore! * 100) : 0;

  // Helper to format TOPIK label cleanly
  const formatTopik = (level: string) => {
    if (level.startsWith('TOPIK_II_LEVEL_')) {
      return `TOPIK II - Cấp ${level.replace('TOPIK_II_LEVEL_', '')}`;
    }
    if (level.startsWith('TOPIK_I_LEVEL_')) {
      return `TOPIK I - Cấp ${level.replace('TOPIK_I_LEVEL_', '')}`;
    }
    return 'Không yêu cầu TOPIK';
  };

  // Helper to format salary cleanly
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
      className={`group bg-zinc-900 border transition-all duration-300 flex flex-col justify-between h-full hover:-translate-y-1 hover:shadow-2xl cursor-pointer ${
        hasScore 
          ? 'border-indigo-500/25 shadow-lg shadow-indigo-500/5 hover:border-indigo-500/40' 
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <CardHeader className="relative pb-2">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="outline" className="bg-indigo-500/5 text-indigo-400 border-indigo-500/20 rounded-md py-0.5 text-[10px]">
            {formatTopik(job.minTopikRequired)}
          </Badge>
          
          {/* Similarity Score */}
          {hasScore && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] rounded-md font-bold text-[10px] tracking-wide">
              ĐỘ PHÙ HỢP AI: {scorePct}%
            </Badge>
          )}
        </div>
        
        <CardTitle className="text-lg font-bold text-zinc-100 group-hover:text-white transition-colors line-clamp-2 leading-snug">
          {job.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="py-2 flex-grow space-y-4">
        <p className="text-zinc-400 text-sm line-clamp-3 leading-relaxed">
          {job.description}
        </p>
        
        {/* Job Details Row */}
        <div className="grid grid-cols-2 gap-y-2 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <DollarSign className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="text-emerald-500 font-semibold truncate">
              {formatSalary(job.salaryMin, job.salaryMax)}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 border-t border-zinc-800/40 bg-zinc-950/20 flex flex-wrap gap-1.5">
        {/* Skills Badges */}
        <div className="flex flex-wrap gap-1 w-full mb-3">
          {job.requiredSkills.map((skill, index) => (
            <span 
              key={index}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/50"
            >
              {skill}
            </span>
          ))}
        </div>
        
        <button
          type="button"
          className="w-full text-center text-xs font-semibold rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-750 hover:bg-zinc-700 hover:text-white transition-all py-1.5 cursor-pointer"
        >
          Xem chi tiết và ứng tuyển
        </button>
      </CardFooter>
    </Card>
  );
}
