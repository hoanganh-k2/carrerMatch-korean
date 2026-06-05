import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCompanyDto) {
    // Mỗi recruiter chỉ có một công ty
    const existing = await this.prisma.company.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('Bạn đã có hồ sơ công ty. Hãy cập nhật thay vì tạo mới.');
    }
    return this.prisma.company.create({
      data: { userId, ...dto },
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      include: {
        user: { select: { email: true } },
        _count: { select: { jobPostings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { companyId },
      include: {
        jobPostings: {
          where: { status: 'active' },
          orderBy: { applicationDeadline: 'asc' },
          take: 10,
        },
        _count: { select: { jobPostings: true } },
      },
    });
    if (!company) throw new NotFoundException(`Công ty với ID "${companyId}" không tồn tại`);
    return company;
  }

  async findByUser(userId: string) {
    return this.prisma.company.findUnique({
      where: { userId },
      include: {
        jobPostings: { orderBy: { applicationDeadline: 'asc' } },
      },
    });
  }

  async update(companyId: string, userId: string, userRole: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { companyId } });
    if (!company) throw new NotFoundException(`Công ty "${companyId}" không tồn tại`);

    // Chỉ chủ sở hữu hoặc admin mới được sửa
    if (company.userId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền cập nhật công ty này');
    }

    // Chỉ admin mới được verify
    if (dto.isVerified !== undefined && userRole !== 'admin') {
      throw new ForbiddenException('Chỉ admin mới có thể xác minh công ty');
    }

    return this.prisma.company.update({
      where: { companyId },
      data: dto,
    });
  }

  async verify(companyId: string) {
    await this.findOne(companyId);
    return this.prisma.company.update({
      where: { companyId },
      data: { isVerified: true },
      select: { companyId: true, companyName: true, isVerified: true },
    });
  }
}
