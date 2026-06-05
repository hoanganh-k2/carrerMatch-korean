import { IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  name: string; // "job:create"

  @IsString()
  resource: string; // "job"

  @IsString()
  action: string; // "create"

  @IsString()
  @IsOptional()
  description?: string;
}

export class AssignPermissionDto {
  @IsString()
  permissionId: string;
}
