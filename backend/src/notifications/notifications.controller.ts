import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Xem tất cả thông báo của tôi
  @Get('me')
  findMyNotifications(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.findAllByUser(user.userId);
  }

  // Đếm thông báo chưa đọc
  @Get('unread-count')
  countUnread(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.countUnread(user.userId);
  }

  // Đánh dấu tất cả đã đọc
  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  // Đánh dấu một thông báo đã đọc
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.markAsRead(id, user.userId);
  }

  // Xóa một thông báo
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.notificationsService.remove(id, user.userId);
  }
}
