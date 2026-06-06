import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { RolesPermissionsService } from './roles-permissions.service';
import { CreatePermissionDto, AssignPermissionDto } from './dto/permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class RolesPermissionsController {
  constructor(
    private readonly rolesPermissionsService: RolesPermissionsService,
  ) {}

  // ========== PERMISSIONS ==========

  @Post('permissions')
  createPermission(@Body() dto: CreatePermissionDto) {
    return this.rolesPermissionsService.createPermission(dto);
  }

  @Get('permissions')
  findAllPermissions() {
    return this.rolesPermissionsService.findAllPermissions();
  }

  @Delete('permissions/:id')
  removePermission(@Param('id') id: string) {
    return this.rolesPermissionsService.removePermission(id);
  }

  @Post('permissions/seed')
  seedDefaultPermissions() {
    return this.rolesPermissionsService.seedDefaultPermissions();
  }

  // ========== USER PERMISSIONS ==========

  @Get('users/:userId/permissions')
  getUserPermissions(@Param('userId') userId: string) {
    return this.rolesPermissionsService.getUserPermissions(userId);
  }

  @Post('users/:userId/permissions')
  assignPermission(
    @Param('userId') userId: string,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.rolesPermissionsService.assignPermissionToUser(userId, dto);
  }

  @Delete('users/:userId/permissions/:permId')
  revokePermission(
    @Param('userId') userId: string,
    @Param('permId') permId: string,
  ) {
    return this.rolesPermissionsService.revokePermissionFromUser(
      userId,
      permId,
    );
  }
}
