import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApplicationStatus } from '@prisma/client';

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
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;

  @IsString()
  @IsOptional()
  recruiterNote?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  recruiterRating?: number;
}
