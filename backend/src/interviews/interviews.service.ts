import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InterviewStatus } from '@prisma/client';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// LƯU Ý: ValidationPipe toàn cục bật { whitelist: true } → field không có decorator
// class-validator sẽ bị loại bỏ khỏi body. Bắt buộc khai báo decorator cho mọi field.
export class CreateInterviewDto {
  @IsString()
  applicationId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  scheduledAt: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  meetingLink?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

@Injectable()
export class InterviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // 1. Tạo lịch phỏng vấn mới (Recruiter)
  async create(recruiterUserId: string, dto: CreateInterviewDto) {
    // Tìm đơn ứng tuyển và công ty
    const application = await this.prisma.jobApplication.findUnique({
      where: { applicationId: dto.applicationId },
      include: {
        job: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Đơn ứng tuyển không tồn tại');
    }

    // Kiểm tra xem recruiter này có sở hữu công ty đăng tuyển hay không
    if (
      !application.job.company ||
      application.job.company.userId !== recruiterUserId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền lên lịch phỏng vấn cho đơn ứng tuyển này',
      );
    }

    const scheduledDate = new Date(dto.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException('Thời gian phỏng vấn không hợp lệ');
    }
    if (scheduledDate <= new Date()) {
      throw new BadRequestException('Thời gian phỏng vấn phải là trong tương lai');
    }

    // Tạo cuộc phỏng vấn
    const interview = await this.prisma.interview.create({
      data: {
        applicationId: dto.applicationId,
        title: dto.title,
        description: dto.description || null,
        scheduledAt: scheduledDate,
        durationMinutes: dto.durationMinutes ?? 45,
        meetingLink: dto.meetingLink || null,
        notes: dto.notes || null,
        status: InterviewStatus.scheduled,
      },
    });

    // Cập nhật trạng thái đơn ứng tuyển thành "interview"
    await this.prisma.jobApplication.update({
      where: { applicationId: dto.applicationId },
      data: {
        status: 'interview',
      },
    });

    // Gửi thông báo cho candidate
    try {
      await this.notificationsService.create({
        userId: application.candidateId,
        title: 'Lịch phỏng vấn mới',
        message: `Bạn có lịch phỏng vấn "${dto.title}" cho công việc "${application.job.title}" vào ngày ${scheduledDate.toLocaleString('vi-VN')}.`,
        type: 'application_status',
        relatedId: application.applicationId,
      });
    } catch (err) {
      console.error('Failed to send interview notification to candidate:', err);
    }

    return interview;
  }

  // 2. Lấy danh sách lịch phỏng vấn của tôi (Candidate hoặc Recruiter)
  async findMyInterviews(userId: string, role: string) {
    if (role === 'recruiter') {
      return this.prisma.interview.findMany({
        where: {
          application: {
            job: {
              company: {
                userId,
              },
            },
          },
        },
        include: {
          application: {
            select: {
              applicationId: true,
              candidate: {
                select: {
                  fullName: true,
                  topikLevel: true,
                },
              },
              job: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      });
    } else {
      // Mặc định là candidate
      return this.prisma.interview.findMany({
        where: {
          application: {
            candidateId: userId,
          },
        },
        include: {
          application: {
            select: {
              applicationId: true,
              job: {
                select: {
                  title: true,
                  company: {
                    select: {
                      companyName: true,
                      logoUrl: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      });
    }
  }

  // 3. Cập nhật trạng thái lịch phỏng vấn
  async updateStatus(
    interviewId: string,
    status: InterviewStatus,
    userId: string,
  ) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Lịch phỏng vấn không tồn tại');
    }

    const candidateId = interview.application.candidateId;
    const recruiterId = interview.application.job.company?.userId;

    // Kiểm tra quyền truy cập lịch này
    if (userId !== candidateId && userId !== recruiterId) {
      throw new ForbiddenException(
        'Bạn không có quyền sửa đổi lịch phỏng vấn này',
      );
    }

    // Cập nhật trạng thái
    const updated = await this.prisma.interview.update({
      where: { id: interviewId },
      data: { status },
    });

    // Gửi thông báo cho đối phương
    try {
      const isUpdatedByRecruiter = userId === recruiterId;
      const recipientId = isUpdatedByRecruiter ? candidateId : recruiterId;
      const updaterName = isUpdatedByRecruiter
        ? interview.application.job.company?.companyName || 'Nhà tuyển dụng'
        : 'Ứng viên';

      if (recipientId) {
        await this.notificationsService.create({
          userId: recipientId,
          title: `Cập nhật trạng thái phỏng vấn`,
          message: `${updaterName} đã cập nhật trạng thái lịch phỏng vấn "${interview.title}" thành "${status}".`,
          type: 'application_status',
          relatedId: interview.applicationId,
        });
      }
    } catch (err) {
      console.error(
        'Failed to send interview status change notification:',
        err,
      );
    }

    return updated;
  }

  // 4. Candidate gửi phản hồi / đề xuất lại lịch phỏng vấn
  async submitFeedback(
    interviewId: string,
    feedback: string,
    candidateUserId: string,
  ) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            job: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Lịch phỏng vấn không tồn tại');
    }

    if (interview.application.candidateId !== candidateUserId) {
      throw new ForbiddenException(
        'Chỉ ứng viên tham gia phỏng vấn mới được gửi phản hồi',
      );
    }

    const updated = await this.prisma.interview.update({
      where: { id: interviewId },
      data: { feedback },
    });

    // Thông báo cho recruiter
    try {
      const recruiterId = interview.application.job.company?.userId;
      if (recruiterId) {
        await this.notificationsService.create({
          userId: recruiterId,
          title: 'Phản hồi từ ứng viên',
          message: `Ứng viên vừa gửi phản hồi về lịch phỏng vấn "${interview.title}": "${feedback}"`,
          type: 'application_status',
          relatedId: interview.applicationId,
        });
      }
    } catch (err) {
      console.error(
        'Failed to send interview feedback notification to recruiter:',
        err,
      );
    }

    return updated;
  }
}
