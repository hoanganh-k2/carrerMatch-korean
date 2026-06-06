import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JobUsersService } from './job-users.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('job-users')
@UseGuards(JwtAuthGuard)
export class JobUsersController {
  constructor(private readonly jobUsersService: JobUsersService) {}

  // Xem profile của tôi
  @Get('me')
  getMyProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.jobUsersService.findOne(user.userId);
  }

  // Admin: Xem tất cả profile
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll() {
    return this.jobUsersService.findAll();
  }

  // Xem profile theo id (recruiter có thể xem profile ứng viên)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobUsersService.findOne(id);
  }

  // Cập nhật profile của mình
  @Patch('me')
  updateMyProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() updateJobUserDto: Prisma.JobUserUpdateInput,
  ) {
    return this.jobUsersService.update(user.userId, updateJobUserDto);
  }
}
