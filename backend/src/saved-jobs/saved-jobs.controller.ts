import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SavedJobsService } from './saved-jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('saved-jobs')
@UseGuards(JwtAuthGuard)
export class SavedJobsController {
  constructor(private readonly savedJobsService: SavedJobsService) {}

  // Lưu tin tuyển dụng
  @Post(':jobId')
  save(@Param('jobId') jobId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.savedJobsService.save(user.userId, jobId);
  }

  // Bỏ lưu tin tuyển dụng
  @Delete(':jobId')
  unsave(
    @Param('jobId') jobId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.savedJobsService.unsave(user.userId, jobId);
  }

  // Xem tất cả tin đã lưu
  @Get('me')
  findMySavedJobs(@CurrentUser() user: CurrentUserPayload) {
    return this.savedJobsService.findMySavedJobs(user.userId);
  }

  // Kiểm tra đã lưu tin chưa
  @Get('check/:jobId')
  isSaved(
    @Param('jobId') jobId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.savedJobsService.isSaved(user.userId, jobId);
  }
}
