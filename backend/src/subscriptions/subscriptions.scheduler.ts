import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class SubscriptionsScheduler {
  private readonly logger = new Logger('SubscriptionsScheduler');

  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // Cron chạy vào 8:00 sáng Thứ Hai hàng tuần (0 8 * * 1)
  @Cron('0 8 * * 1')
  async handleWeeklyJobAlerts() {
    this.logger.log(
      '⏰ [Tác vụ định kỳ] Bắt đầu tự động quét việc làm hàng tuần...',
    );
    try {
      await this.subscriptionsService.sendMatchingJobAlerts();
    } catch (err) {
      this.logger.error('Lỗi khi tự động gửi tin tuyển dụng hàng tuần:', err);
    }
  }
}
