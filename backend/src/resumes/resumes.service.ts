import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateResumeDto,
  UpdateResumeDto,
  CreateWorkExperienceDto,
  CreateEducationDto,
  CreateCertificationDto,
} from './dto/resume.dto';

@Injectable()
export class ResumesService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== RESUME ==========

  async create(userId: string, dto: CreateResumeDto) {
    // Nếu đây là CV mặc định, bỏ default của CV cũ
    if (dto.isDefault) {
      await this.prisma.resume.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.resume.create({
      data: { userId, ...dto },
      include: { experiences: true, educations: true, certifications: true },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.resume.findMany({
      where: { userId },
      include: {
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startYear: 'desc' } },
        certifications: { orderBy: { issuedAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(resumeId: string, requestUserId: string, userRole: string) {
    const resume = await this.prisma.resume.findUnique({
      where: { resumeId },
      include: {
        experiences: { orderBy: { startDate: 'desc' } },
        educations: { orderBy: { startYear: 'desc' } },
        certifications: { orderBy: { issuedAt: 'desc' } },
      },
    });
    if (!resume) throw new NotFoundException(`Resume "${resumeId}" không tồn tại`);

    // Ứng viên chỉ xem CV của mình, recruiter và admin xem được tất cả
    if (resume.userId !== requestUserId && userRole === 'candidate') {
      throw new ForbiddenException('Bạn không có quyền xem CV này');
    }
    return resume;
  }

  async update(resumeId: string, userId: string, dto: UpdateResumeDto) {
    const resume = await this.prisma.resume.findUnique({ where: { resumeId } });
    if (!resume) throw new NotFoundException(`Resume "${resumeId}" không tồn tại`);
    if (resume.userId !== userId) throw new ForbiddenException('Bạn không có quyền sửa CV này');

    if (dto.isDefault) {
      await this.prisma.resume.updateMany({
        where: { userId, isDefault: true, resumeId: { not: resumeId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.resume.update({
      where: { resumeId },
      data: dto,
      include: { experiences: true, educations: true, certifications: true },
    });
  }

  async remove(resumeId: string, userId: string) {
    const resume = await this.prisma.resume.findUnique({ where: { resumeId } });
    if (!resume) throw new NotFoundException(`Resume "${resumeId}" không tồn tại`);
    if (resume.userId !== userId) throw new ForbiddenException('Bạn không có quyền xóa CV này');
    return this.prisma.resume.delete({ where: { resumeId } });
  }

  // ========== WORK EXPERIENCE ==========

  async addExperience(resumeId: string, userId: string, dto: CreateWorkExperienceDto) {
    await this.checkResumeOwnership(resumeId, userId);
    return this.prisma.workExperience.create({
      data: {
        resumeId,
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });
  }

  async removeExperience(id: string, userId: string) {
    const exp = await this.prisma.workExperience.findUnique({
      where: { id },
      include: { resume: true },
    });
    if (!exp) throw new NotFoundException('Kinh nghiệm không tồn tại');
    if (exp.resume.userId !== userId) throw new ForbiddenException('Không có quyền');
    return this.prisma.workExperience.delete({ where: { id } });
  }

  // ========== EDUCATION ==========

  async addEducation(resumeId: string, userId: string, dto: CreateEducationDto) {
    await this.checkResumeOwnership(resumeId, userId);
    return this.prisma.education.create({ data: { resumeId, ...dto } });
  }

  async removeEducation(id: string, userId: string) {
    const edu = await this.prisma.education.findUnique({
      where: { id },
      include: { resume: true },
    });
    if (!edu) throw new NotFoundException('Học vấn không tồn tại');
    if (edu.resume.userId !== userId) throw new ForbiddenException('Không có quyền');
    return this.prisma.education.delete({ where: { id } });
  }

  // ========== CERTIFICATION ==========

  async addCertification(resumeId: string, userId: string, dto: CreateCertificationDto) {
    await this.checkResumeOwnership(resumeId, userId);
    return this.prisma.certification.create({
      data: {
        resumeId,
        ...dto,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async removeCertification(id: string, userId: string) {
    const cert = await this.prisma.certification.findUnique({
      where: { id },
      include: { resume: true },
    });
    if (!cert) throw new NotFoundException('Chứng chỉ không tồn tại');
    if (cert.resume.userId !== userId) throw new ForbiddenException('Không có quyền');
    return this.prisma.certification.delete({ where: { id } });
  }

  // ========== HELPERS ==========

  private async checkResumeOwnership(resumeId: string, userId: string) {
    const resume = await this.prisma.resume.findUnique({ where: { resumeId } });
    if (!resume) throw new NotFoundException(`Resume "${resumeId}" không tồn tại`);
    if (resume.userId !== userId) throw new ForbiddenException('Bạn không sở hữu CV này');
    return resume;
  }
}
