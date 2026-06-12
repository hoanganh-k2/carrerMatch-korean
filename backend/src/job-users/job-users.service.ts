import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, JobUser } from '@prisma/client';
import { EmbeddingService } from '../ai/embedding.service';

@Injectable()
export class JobUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async create(data: Prisma.JobUserCreateInput): Promise<JobUser> {
    return this.prisma.jobUser.create({
      data,
    });
  }

  async findAll(): Promise<JobUser[]> {
    return this.prisma.jobUser.findMany();
  }

  async findOne(userId: string): Promise<JobUser> {
    const user = await this.prisma.jobUser.findUnique({
      where: { userId },
    });
    if (!user) {
      throw new NotFoundException(`JobUser with ID "${userId}" not found`);
    }
    return user;
  }

  async update(
    userId: string,
    data: Prisma.JobUserUpdateInput,
  ): Promise<JobUser> {
    // Ensure user exists first
    await this.findOne(userId);
    const updated = await this.prisma.jobUser.update({
      where: { userId },
      data,
    });

    // Hồ sơ năng lực thay đổi → sinh lại skillsVector để matching/recommendation dùng vector mới
    const profileChanged =
      data.skillsExtracted !== undefined ||
      data.topikLevel !== undefined ||
      data.yearsExperience !== undefined;
    if (profileChanged) {
      const profileText = `Kỹ năng: ${updated.skillsExtracted.join(', ')}. Trình độ tiếng Hàn: ${updated.topikLevel}. Kinh nghiệm: ${updated.yearsExperience ?? 0} năm.`;
      const embedding =
        await this.embeddingService.generateEmbedding(profileText);
      return this.prisma.jobUser.update({
        where: { userId },
        data: { skillsVector: JSON.stringify(embedding) },
      });
    }

    return updated;
  }

  async remove(userId: string): Promise<JobUser> {
    // Ensure user exists first
    await this.findOne(userId);
    return this.prisma.jobUser.delete({
      where: { userId },
    });
  }
}
