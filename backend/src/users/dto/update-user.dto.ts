import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { TopikLevel, JobType } from '@prisma/client';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateJobUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEnum(TopikLevel)
  @IsOptional()
  topikLevel?: TopikLevel;

  @IsInt()
  @Min(0)
  @Max(300)
  @IsOptional()
  koreanScore?: number;

  @IsBoolean()
  @IsOptional()
  isBrSE?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  yearsExperience?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  desiredSalaryMin?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  desiredSalaryMax?: number;

  @IsEnum(JobType)
  @IsOptional()
  jobTypePrefs?: JobType;

  @IsBoolean()
  @IsOptional()
  openToWork?: boolean;

  @IsString()
  @IsOptional()
  targetKoreanRole?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  brseExperienceYears?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  koreanWorkExperienceYears?: number;
}
