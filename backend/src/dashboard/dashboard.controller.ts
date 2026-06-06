import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // Dashboard cho ứng viên
  @Get('candidate')
  @UseGuards(RolesGuard)
  @Roles('candidate')
  getCandidateDashboard(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getCandidateDashboard(user.userId);
  }

  // Dashboard cho nhà tuyển dụng
  @Get('recruiter')
  @UseGuards(RolesGuard)
  @Roles('recruiter')
  getRecruiterDashboard(@CurrentUser() user: CurrentUserPayload) {
    return this.dashboardService.getRecruiterDashboard(user.userId);
  }

  // Dashboard tổng quan cho admin
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }
}
