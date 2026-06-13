import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService, CreateReviewDto } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // 1. Gửi đánh giá công ty (Chỉ dành cho candidate)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('candidate')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user.userId, dto);
  }

  // Admin: lấy toàn bộ đánh giá để kiểm duyệt
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll() {
    return this.reviewsService.findAll();
  }

  // 2. Lấy danh sách đánh giá của công ty (Public)
  @Get('company/:companyId')
  findReviewsByCompany(@Param('companyId') companyId: string) {
    return this.reviewsService.findReviewsByCompany(companyId);
  }

  // 3. Xóa đánh giá (Admin hoặc chính candidate sở hữu)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.reviewsService.remove(id, user.userId, user.role);
  }
}
