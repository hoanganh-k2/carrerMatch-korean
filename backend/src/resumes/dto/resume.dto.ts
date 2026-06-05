import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsInt,
  IsUrl,
} from 'class-validator';

export class CreateResumeDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsUrl()
  @IsOptional()
  fileUrl?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateResumeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsUrl()
  @IsOptional()
  fileUrl?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class CreateWorkExperienceDto {
  @IsString()
  company: string;

  @IsString()
  position: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateEducationDto {
  @IsString()
  school: string;

  @IsString()
  degree: string;

  @IsString()
  major: string;

  @IsInt()
  startYear: number;

  @IsInt()
  @IsOptional()
  endYear?: number;
}

export class CreateCertificationDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  issuer?: string;

  @IsDateString()
  @IsOptional()
  issuedAt?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
