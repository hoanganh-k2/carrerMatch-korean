import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { TopikLevel, JobType } from '@prisma/client';

export class SearchJobsDto {
  query?: string;
  locations?: string[];
  salaryMin?: number;
  salaryMax?: number;
  topikLevel?: TopikLevel;
  jobType?: JobType;
  skills?: string[];
}

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly jwtService: JwtService,
  ) {}

  // 1. Tìm kiếm việc làm nâng cao (Public, tự động log nếu gửi token)
  @Post('jobs')
  async searchJobs(
    @Body() dto: SearchJobsDto,
    @Headers('authorization') authHeader?: string,
  ) {
    let userId: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded: unknown = this.jwtService.decode(token);
        const payload = decoded as Record<string, any> | null;
        if (payload && typeof payload === 'object' && payload.userId) {
          userId = payload.userId as string;
        }
      } catch (err) {
        console.error(
          'Failed to extract userId from token in search endpoint:',
          err,
        );
      }
    }

    return this.searchService.searchJobs(dto, userId);
  }

  // 2. Lấy lịch sử tìm kiếm cá nhân (Private)
  @Get('history')
  @UseGuards(JwtAuthGuard)
  getMyHistory(@CurrentUser() user: CurrentUserPayload) {
    return this.searchService.getMySearchHistory(user.userId);
  }

  // 3. Gợi ý các từ khóa hot (Public)
  @Get('suggestions')
  getSuggestions() {
    return this.searchService.getSearchSuggestions();
  }
}
