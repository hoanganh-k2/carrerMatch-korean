import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { TopikLevel } from '@prisma/client';
import { meetsTopikRequirement } from '../shared/topik.utils';

export class CreateSubscriptionDto {
  skills: string[];
  locations?: string[];
  topikLevel?: TopikLevel;
}

interface MatchedJob {
  title: string;
  companyName: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  requiredSkills: string[];
}


@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger('SubscriptionsService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // 1. Tạo đăng ký nhận tin việc làm mới
  async create(userId: string, dto: CreateSubscriptionDto) {
    if (!dto.skills || dto.skills.length === 0) {
      throw new Error('Danh sách kỹ năng đăng ký không được để trống');
    }

    return this.prisma.subscription.create({
      data: {
        userId,
        skills: dto.skills,
        locations: dto.locations || [],
        topikLevel: dto.topikLevel || TopikLevel.NONE,
      },
    });
  }

  // 2. Lấy danh sách đăng ký nhận tin của tôi
  async findMySubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 3. Xóa đăng ký nhận tin
  async remove(id: string, userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!sub) {
      throw new NotFoundException('Đăng ký không tồn tại');
    }

    if (sub.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đăng ký này');
    }

    return this.prisma.subscription.delete({
      where: { id },
    });
  }

  // 4. Quét việc làm phù hợp và gửi Email
  async sendMatchingJobAlerts() {
    this.logger.log(
      '🚀 Bắt đầu quét việc làm phù hợp cho các đăng ký nhận tin...',
    );

    // Lấy tất cả subscriptions kèm thông tin ứng viên
    const subscriptions = await this.prisma.subscription.findMany({
      include: {
        user: {
          select: {
            email: true,
            jobUser: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (subscriptions.length === 0) {
      this.logger.log('Không có đăng ký nhận tin nào trong hệ thống.');
      return { message: 'Không có đăng ký nào được quét.' };
    }

    // Lấy tất cả việc làm mới đăng trong vòng 7 ngày qua
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const activeJobs = await this.prisma.jobPosting.findMany({
      where: {
        status: 'active',
        createdAt: {
          gte: lastWeek,
        },
      },
      include: {
        company: {
          select: {
            companyName: true,
          },
        },
      },
    });

    if (activeJobs.length === 0) {
      this.logger.log('Không có việc làm mới nào được đăng trong 7 ngày qua.');
      return { message: 'Không có việc làm mới nào để gửi thông báo.' };
    }

    let alertCount = 0;

    for (const sub of subscriptions) {
      const matchedJobs: MatchedJob[] = [];

      for (const job of activeJobs) {
        // A. Kiểm tra kỹ năng (Phải trùng khớp ít nhất 1 kỹ năng đăng ký)
        const hasMatchingSkill = job.requiredSkills.some((skill) =>
          sub.skills.some(
            (subSkill) => subSkill.toLowerCase() === skill.toLowerCase(),
          ),
        );

        if (!hasMatchingSkill) continue;

        // B. Kiểm tra địa điểm (Nếu sub có đăng ký địa điểm, kiểm tra job.location có chứa)
        if (sub.locations && sub.locations.length > 0) {
          const locationMatch = sub.locations.some((loc) =>
            job.location.toLowerCase().includes(loc.toLowerCase()),
          );
          if (!locationMatch) continue;
        }

        // C. Ứng viên phải đủ TOPIK để apply job này
        if (!meetsTopikRequirement(sub.topikLevel, job.minTopikRequired)) continue;

        matchedJobs.push({
          title: job.title,
          companyName: job.company?.companyName || 'Công ty ẩn danh',
          location: job.location,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          requiredSkills: job.requiredSkills,
        });
      }

      // Gửi email nếu tìm thấy việc làm phù hợp
      if (matchedJobs.length > 0) {
        const candidateName = sub.user.jobUser?.fullName || 'Thành viên';
        await this.mailService.sendJobAlertEmail(
          sub.user.email,
          candidateName,
          matchedJobs,
        );
        alertCount++;
      }
    }

    this.logger.log(
      `✅ Quét hoàn tất! Đã gửi ${alertCount} email thông báo việc làm.`,
    );
    return {
      message: 'Quét hoàn tất!',
      totalSubscriptionsScanned: subscriptions.length,
      alertsSent: alertCount,
    };
  }
}
