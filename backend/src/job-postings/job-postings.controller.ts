import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';
import { EmbeddingService } from '../ai/embedding.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('job-postings')
export class JobPostingsController {
  constructor(
    private readonly jobPostingsService: JobPostingsService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  // Public: Tìm kiếm ngữ nghĩa (ai cũng tìm được)
  @Post('search-semantic')
  async searchSemantic(@Body('query') query: string) {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    return this.jobPostingsService.searchSemantic(queryEmbedding);
  }

  // Candidate: Việc làm gợi ý dành riêng cho tôi (kèm giải thích lý do)
  @Get('recommendations/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('candidate')
  recommendForMe(@CurrentUser() user: CurrentUserPayload) {
    return this.jobPostingsService.recommendJobsForCandidate(user.userId);
  }

  // Recruiter/Admin: Xem ứng viên phù hợp cho tin tuyển dụng
  @Get(':jobId/match-candidates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'admin')
  matchCandidates(@Param('jobId') jobId: string) {
    return this.jobPostingsService.matchCandidatesForJob(jobId);
  }

  // Recruiter/Admin: Tạo tin tuyển dụng mới
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'admin')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createJobPostingDto: Prisma.JobPostingCreateInput,
  ) {
    return this.jobPostingsService.create(createJobPostingDto);
  }

  // Public: Xem danh sách tin tuyển dụng (phân trang + lọc server-side)
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('location') location?: string,
    @Query('jobType') jobType?: string,
    @Query('minTopik') minTopik?: string,
    @Query('sort') sort?: string,
    @Query('status') status?: string,
  ) {
    return this.jobPostingsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 12,
      location,
      jobType,
      minTopik,
      sort,
      status,
    });
  }

  // Public: Xem chi tiết tin tuyển dụng
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobPostingsService.findOne(id);
  }

  // Recruiter/Admin: Cập nhật tin tuyển dụng
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'admin')
  update(
    @Param('id') id: string,
    @Body() updateJobPostingDto: Prisma.JobPostingUpdateInput,
  ) {
    return this.jobPostingsService.update(id, updateJobPostingDto);
  }

  // Recruiter/Admin: Xóa tin tuyển dụng
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'admin')
  remove(@Param('id') id: string) {
    return this.jobPostingsService.remove(id);
  }
}
