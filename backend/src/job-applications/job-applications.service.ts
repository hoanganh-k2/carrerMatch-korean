import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../ai/embedding.service';
import { ApplyJobDto, UpdateApplicationStatusDto } from './dto/application.dto';
import { ApplicationStatus } from '@prisma/client';
import { getTopikOrder, meetsTopikRequirement } from '../shared/topik.utils';

@Injectable()
export class JobApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  // Candidate nộp đơn ứng tuyển (tự động tính matchScore bằng AI)
  async apply(candidateId: string, dto: ApplyJobDto) {
    // 1. Kiểm tra tin tuyển dụng tồn tại và đang active
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobId: dto.jobId },
    });
    if (!job) throw new NotFoundException('Tin tuyển dụng không tồn tại');
    if (job.status !== 'active')
      throw new ForbiddenException('Tin tuyển dụng đã đóng');

    // 2. Kiểm tra đã ứng tuyển chưa
    const existing = await this.prisma.jobApplication.findFirst({
      where: { jobId: dto.jobId, candidateId },
    });
    if (existing) throw new ConflictException('Bạn đã ứng tuyển tin này rồi');

    // 3. Lấy thông tin ứng viên để tính matching score
    const candidate = await this.prisma.jobUser.findUnique({
      where: { userId: candidateId },
    });

    // 4. Tính matchScore bằng AI (so sánh skills vector)
    let matchScore = 0.5;
    const matchBreakdown: Record<string, number> = {
      it_skill: 0.5,
      korean_skill: 0.5,
      experience: 0.5,
    };

    if (candidate) {
      // Tính điểm kỹ năng IT
      const candidateSkills = candidate.skillsExtracted || [];
      const requiredSkills = job.requiredSkills || [];
      if (requiredSkills.length > 0) {
        const matched = candidateSkills.filter((s) =>
          requiredSkills.some((r) => r.toLowerCase() === s.toLowerCase()),
        );
        matchBreakdown.it_skill =
          Math.round((matched.length / requiredSkills.length) * 100) / 100;
      }

      // Tính điểm TOPIK
      const candidateTopik = getTopikOrder(candidate.topikLevel);
      const requiredTopik = getTopikOrder(job.minTopikRequired);
      matchBreakdown.korean_skill =
        requiredTopik <= 0
          ? 1.0
          : Math.min(candidateTopik / requiredTopik, 1.0);
      matchBreakdown.korean_skill =
        Math.round(matchBreakdown.korean_skill * 100) / 100;
      // Bonus: đạt đúng yêu cầu thì điểm tối đa
      if (meetsTopikRequirement(candidate.topikLevel, job.minTopikRequired)) {
        matchBreakdown.korean_skill = Math.max(matchBreakdown.korean_skill, 1.0);
      }

      // Tính điểm kinh nghiệm
      const expMin = job.experienceYearsMin || 0;
      if (expMin > 0 && candidate.yearsExperience) {
        matchBreakdown.experience = Math.min(
          candidate.yearsExperience / expMin,
          1.0,
        );
      } else {
        matchBreakdown.experience = 1.0;
      }
      matchBreakdown.experience =
        Math.round(matchBreakdown.experience * 100) / 100;

      // Tổng hợp: IT 50%, Korean 30%, Experience 20%
      matchScore =
        matchBreakdown.it_skill * 0.5 +
        matchBreakdown.korean_skill * 0.3 +
        matchBreakdown.experience * 0.2;
      matchScore = Math.round(matchScore * 100) / 100;
    }

    // 5. Tạo đơn ứng tuyển
    const application = await this.prisma.jobApplication.create({
      data: {
        jobId: dto.jobId,
        candidateId,
        resumeId: dto.resumeId || null,
        matchScore,
        matchBreakdownJson: matchBreakdown,
        coverLetter: dto.coverLetter || null,
        status: 'applied',
        stageTimestamps: { applied: new Date().toISOString() },
      },
      include: { job: { select: { title: true, location: true } } },
    });

    // 6. Tăng applyCount của tin tuyển dụng
    await this.prisma.jobPosting.update({
      where: { jobId: dto.jobId },
      data: { applyCount: { increment: 1 } },
    });

    return {
      ...application,
      matchScorePercent: `${Math.round(matchScore * 100)}%`,
      message: 'Nộp đơn ứng tuyển thành công!',
    };
  }

  // Candidate: Xem đơn ứng tuyển của tôi
  async findMyApplications(candidateId: string) {
    return this.prisma.jobApplication.findMany({
      where: { candidateId },
      include: {
        job: {
          select: {
            title: true,
            location: true,
            salaryMin: true,
            salaryMax: true,
            status: true,
            company: { select: { companyName: true, logoUrl: true } },
          },
        },
      },
      orderBy: { applicationId: 'desc' },
    });
  }

  // Recruiter: Xem đơn cho tin tuyển dụng của mình
  async findApplicationsForJob(jobId: string, recruiterId: string) {
    // Kiểm tra quyền: recruiter phải sở hữu tin tuyển dụng này
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobId },
      include: { company: true },
    });
    if (!job) throw new NotFoundException('Tin tuyển dụng không tồn tại');
    if (job.company && job.company.userId !== recruiterId) {
      throw new ForbiddenException(
        'Bạn không có quyền xem đơn ứng tuyển cho tin này',
      );
    }

    return this.prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        candidate: {
          select: {
            fullName: true,
            topikLevel: true,
            yearsExperience: true,
            skillsExtracted: true,
          },
        },
      },
      orderBy: { matchScore: 'desc' },
    });
  }

  // Recruiter: Cập nhật trạng thái đơn (screening → interview → offer/rejected)
  async updateStatus(
    applicationId: string,
    recruiterId: string,
    userRole: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { applicationId },
      include: { job: { include: { company: true } } },
    });
    if (!application)
      throw new NotFoundException('Đơn ứng tuyển không tồn tại');

    // Chỉ recruiter sở hữu tin hoặc admin mới được cập nhật
    if (userRole !== 'admin') {
      if (
        !application.job.company ||
        application.job.company.userId !== recruiterId
      ) {
        throw new ForbiddenException('Bạn không có quyền cập nhật đơn này');
      }
    }

    // Cập nhật stage timestamps
    const timestamps =
      (application.stageTimestamps as Record<string, string>) || {};
    timestamps[dto.status] = new Date().toISOString();

    return this.prisma.jobApplication.update({
      where: { applicationId },
      data: {
        status: dto.status as ApplicationStatus,
        recruiterNote: dto.recruiterNote ?? application.recruiterNote,
        recruiterRating: dto.recruiterRating ?? application.recruiterRating,
        stageTimestamps: timestamps,
      },
    });
  }

  // Admin: Xem tất cả đơn ứng tuyển
  async findAll() {
    return this.prisma.jobApplication.findMany({
      include: {
        job: { select: { title: true } },
        candidate: { select: { fullName: true } },
      },
      orderBy: { applicationId: 'desc' },
    });
  }

  async findOne(applicationId: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { applicationId },
      include: { job: true, candidate: true },
    });
    if (!application) {
      throw new NotFoundException(
        `Đơn ứng tuyển "${applicationId}" không tồn tại`,
      );
    }
    return application;
  }

  async remove(applicationId: string, userId: string, userRole: string) {
    const application = await this.findOne(applicationId);
    // Chỉ chủ đơn hoặc admin mới xóa được
    if (application.candidateId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền xóa đơn này');
    }
    return this.prisma.jobApplication.delete({ where: { applicationId } });
  }
}
