import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedJobsService {
  constructor(private readonly prisma: PrismaService) {}

  // Lưu tin tuyển dụng
  async save(userId: string, jobId: string) {
    // Kiểm tra tin tồn tại
    const job = await this.prisma.jobPosting.findUnique({ where: { jobId } });
    if (!job) throw new NotFoundException('Tin tuyển dụng không tồn tại');

    // Kiểm tra đã lưu chưa
    const existing = await this.prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (existing) throw new ConflictException('Bạn đã lưu tin này rồi');

    return this.prisma.savedJob.create({
      data: { userId, jobId },
      include: {
        job: {
          select: {
            title: true,
            location: true,
            salaryMin: true,
            salaryMax: true,
            company: { select: { companyName: true, logoUrl: true } },
          },
        },
      },
    });
  }

  // Bỏ lưu tin
  async unsave(userId: string, jobId: string) {
    const saved = await this.prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (!saved) throw new NotFoundException('Tin chưa được lưu');
    return this.prisma.savedJob.delete({
      where: { userId_jobId: { userId, jobId } },
    });
  }

  // Xem danh sách tin đã lưu
  async findMySavedJobs(userId: string) {
    return this.prisma.savedJob.findMany({
      where: { userId },
      include: {
        job: {
          select: {
            jobId: true,
            title: true,
            location: true,
            salaryMin: true,
            salaryMax: true,
            jobType: true,
            status: true,
            applicationDeadline: true,
            company: { select: { companyName: true, logoUrl: true } },
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    });
  }

  // Kiểm tra đã lưu tin chưa
  async isSaved(userId: string, jobId: string) {
    const saved = await this.prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    return { isSaved: !!saved };
  }
}
