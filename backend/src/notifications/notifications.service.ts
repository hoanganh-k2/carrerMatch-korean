import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Tạo thông báo (gọi từ service khác)
  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    relatedId?: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  // Xem tất cả thông báo của user
  async findAllByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Đếm thông báo chưa đọc
  async countUnread(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  // Đánh dấu đã đọc một thông báo
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Thông báo không tồn tại');
    if (notification.userId !== userId)
      throw new NotFoundException('Thông báo không tồn tại');
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // Đánh dấu tất cả đã đọc
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: `Đã đánh dấu ${result.count} thông báo là đã đọc` };
  }

  // Xóa một thông báo
  async remove(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Thông báo không tồn tại');
    if (notification.userId !== userId)
      throw new NotFoundException('Thông báo không tồn tại');
    return this.prisma.notification.delete({ where: { id } });
  }

  // ========== HELPER: Gửi thông báo theo nghiệp vụ ==========

  // Khi candidate nộp đơn → thông báo cho recruiter
  async notifyNewApplication(
    recruiterId: string,
    candidateName: string,
    jobTitle: string,
    applicationId: string,
  ) {
    return this.create({
      userId: recruiterId,
      title: 'Đơn ứng tuyển mới',
      message: `${candidateName} vừa ứng tuyển vị trí "${jobTitle}"`,
      type: 'new_application',
      relatedId: applicationId,
    });
  }

  // Khi recruiter cập nhật status → thông báo cho candidate
  async notifyApplicationStatusChanged(
    candidateId: string,
    jobTitle: string,
    newStatus: string,
    applicationId: string,
  ) {
    const statusMap: Record<string, string> = {
      screening: 'đang được xem xét',
      interview: 'đã được mời phỏng vấn',
      offer: 'đã nhận được offer',
      rejected: 'chưa phù hợp',
      accepted: 'đã được chấp nhận',
    };
    return this.create({
      userId: candidateId,
      title: 'Cập nhật đơn ứng tuyển',
      message: `Đơn ứng tuyển "${jobTitle}" của bạn ${statusMap[newStatus] || newStatus}`,
      type: 'application_status',
      relatedId: applicationId,
    });
  }
}
