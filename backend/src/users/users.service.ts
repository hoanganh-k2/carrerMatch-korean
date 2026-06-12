import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, UpdateJobUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        jobUser: { select: { fullName: true } },
        company: { select: { companyName: true } },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        jobUser: true,
        company: true,
        userPermissions: {
          include: { permission: true },
        },
      },
    });
    if (!user) throw new NotFoundException(`User với ID "${id}" không tồn tại`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, email: true, role: true, isActive: true },
    });
  }

  async updateProfile(id: string, dto: UpdateJobUserDto) {
    await this.findOne(id);
    const updated = await this.prisma.jobUser.update({
      where: { userId: id },
      data: {
        fullName: dto.fullName,
        topikLevel: dto.topikLevel,
        koreanScore: dto.koreanScore,
        isBrSE: dto.isBrSE,
        yearsExperience: dto.yearsExperience,
        desiredSalaryMin: dto.desiredSalaryMin,
        desiredSalaryMax: dto.desiredSalaryMax,
        jobTypePrefs: dto.jobTypePrefs,
        openToWork: dto.openToWork,
        targetKoreanRole: dto.targetKoreanRole,
        brseExperienceYears: dto.brseExperienceYears,
        koreanWorkExperienceYears: dto.koreanWorkExperienceYears,
      },
    });
    return updated;
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });
  }
}
