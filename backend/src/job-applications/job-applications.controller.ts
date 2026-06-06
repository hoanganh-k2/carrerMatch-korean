import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JobApplicationsService } from './job-applications.service';
import { ApplyJobDto, UpdateApplicationStatusDto } from './dto/application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('job-applications')
@UseGuards(JwtAuthGuard)
export class JobApplicationsController {
  constructor(
    private readonly jobApplicationsService: JobApplicationsService,
  ) {}

  // Candidate: Nộp đơn ứng tuyển
  @Post('apply')
  @UseGuards(RolesGuard)
  @Roles('candidate')
  apply(@CurrentUser() user: CurrentUserPayload, @Body() dto: ApplyJobDto) {
    return this.jobApplicationsService.apply(user.userId, dto);
  }

  // Candidate: Xem tất cả đơn ứng tuyển của tôi
  @Get('my-applications')
  findMyApplications(@CurrentUser() user: CurrentUserPayload) {
    return this.jobApplicationsService.findMyApplications(user.userId);
  }

  // Recruiter: Xem đơn cho tin tuyển dụng cụ thể
  @Get('job/:jobId')
  @UseGuards(RolesGuard)
  @Roles('recruiter', 'admin')
  findApplicationsForJob(
    @Param('jobId') jobId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.jobApplicationsService.findApplicationsForJob(
      jobId,
      user.userId,
    );
  }

  // Recruiter/Admin: Cập nhật trạng thái đơn ứng tuyển
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('recruiter', 'admin')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.jobApplicationsService.updateStatus(
      id,
      user.userId,
      user.role,
      dto,
    );
  }

  // Admin: Xem tất cả đơn ứng tuyển
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll() {
    return this.jobApplicationsService.findAll();
  }

  // Xem chi tiết đơn ứng tuyển
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobApplicationsService.findOne(id);
  }

  // Xóa đơn ứng tuyển (chủ đơn hoặc admin)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.jobApplicationsService.remove(id, user.userId, user.role);
  }
}
