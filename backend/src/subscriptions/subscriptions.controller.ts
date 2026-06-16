import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  SubscriptionsService,
  CreateSubscriptionDto,
} from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // 1. Đăng ký nhận thông tin việc làm mới (Chỉ candidate)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('candidate')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(user.userId, dto);
  }

  // 2. Xem các đăng ký nhận tin của tôi (Chỉ candidate)
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('candidate')
  findMySubscriptions(@CurrentUser() user: CurrentUserPayload) {
    return this.subscriptionsService.findMySubscriptions(user.userId);
  }

  // 3. Hủy đăng ký nhận tin (Chỉ candidate)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('candidate')
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.subscriptionsService.remove(id, user.userId);
  }

  // 4. Kích hoạt quét và gửi thông báo việc làm thủ công ngay lập tức (Chỉ Admin)
  @Post('trigger-send-alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  triggerSendAlerts() {
    return this.subscriptionsService.sendMatchingJobAlerts();
  }

  // 5. Candidate tự kích hoạt quét + gửi email cho RIÊNG các đăng ký của mình (nút Demo)
  @Post('trigger-my-alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('candidate')
  triggerMyAlerts(@CurrentUser() user: CurrentUserPayload) {
    return this.subscriptionsService.sendMatchingJobAlerts(user.userId);
  }
}
