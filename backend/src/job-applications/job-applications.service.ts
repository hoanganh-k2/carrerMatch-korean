import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, JobApplication } from '@prisma/client';

@Injectable()
export class JobApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.JobApplicationCreateInput,
  ): Promise<JobApplication> {
    return this.prisma.jobApplication.create({
      data,
    });
  }

  async findAll(): Promise<JobApplication[]> {
    return this.prisma.jobApplication.findMany({
      include: {
        job: true,
        candidate: true,
      },
    });
  }

  async findOne(applicationId: string): Promise<JobApplication> {
    const application = await this.prisma.jobApplication.findUnique({
      where: { applicationId },
      include: {
        job: true,
        candidate: true,
      },
    });
    if (!application) {
      throw new NotFoundException(
        `JobApplication with ID "${applicationId}" not found`,
      );
    }
    return application;
  }

  async update(
    applicationId: string,
    data: Prisma.JobApplicationUpdateInput,
  ): Promise<JobApplication> {
    // Ensure application exists first
    await this.findOne(applicationId);
    return this.prisma.jobApplication.update({
      where: { applicationId },
      data,
    });
  }

  async remove(applicationId: string): Promise<JobApplication> {
    // Ensure application exists first
    await this.findOne(applicationId);
    return this.prisma.jobApplication.delete({
      where: { applicationId },
    });
  }
}
