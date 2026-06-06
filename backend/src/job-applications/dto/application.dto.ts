import { IsString, IsOptional } from 'class-validator';

export class ApplyJobDto {
  @IsString()
  jobId: string;

  @IsString()
  @IsOptional()
  resumeId?: string;

  @IsString()
  @IsOptional()
  coverLetter?: string;
}

export class UpdateApplicationStatusDto {
  @IsString()
  status: string; // 'screening' | 'interview' | 'offer' | 'rejected' | 'accepted'

  @IsString()
  @IsOptional()
  recruiterNote?: string;

  @IsOptional()
  recruiterRating?: number;
}
