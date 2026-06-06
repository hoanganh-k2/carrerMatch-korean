import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InterviewsService, CreateInterviewDto } from './interviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { InterviewStatus } from '@prisma/client';

@Controller('interviews')
@UseGuards(JwtAuthGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  // 1. Tạo lịch phỏng vấn mới (Chỉ dành cho recruiter và admin)
  @Post()
  @UseGuards(RolesGuard)
  @Roles('recruiter', 'admin')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateInterviewDto,
  ) {
    return this.interviewsService.create(user.userId, dto);
  }

  // 2. Lấy lịch phỏng vấn của tôi (Cả candidate và recruiter đều xem được lịch của mình)
  @Get('me')
  findMyInterviews(@CurrentUser() user: CurrentUserPayload) {
    return this.interviewsService.findMyInterviews(user.userId, user.role);
  }

  // 3. Cập nhật trạng thái cuộc phỏng vấn (Dành cho cả candidate và recruiter tham gia lịch đó)
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('status') status: InterviewStatus,
  ) {
    return this.interviewsService.updateStatus(id, status, user.userId);
  }

  // 4. Gửi phản hồi lịch phỏng vấn (Chỉ dành cho candidate)
  @Patch(':id/feedback')
  @UseGuards(RolesGuard)
  @Roles('candidate')
  submitFeedback(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('feedback') feedback: string,
  ) {
    return this.interviewsService.submitFeedback(id, feedback, user.userId);
  }
}
