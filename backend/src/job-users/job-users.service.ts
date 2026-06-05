import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, JobUser } from '@prisma/client';

@Injectable()
export class JobUsersService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.jobUser.update({
      where: { userId },
      data,
    });
  }

  async remove(userId: string): Promise<JobUser> {
    // Ensure user exists first
    await this.findOne(userId);
    return this.prisma.jobUser.delete({
      where: { userId },
    });
  }
}
