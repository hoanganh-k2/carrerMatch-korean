import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SkillTaxonomy } from '@prisma/client';

@Injectable()
export class SkillTaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SkillTaxonomyCreateInput): Promise<SkillTaxonomy> {
    return this.prisma.skillTaxonomy.create({
      data,
    });
  }

  async findAll(): Promise<SkillTaxonomy[]> {
    return this.prisma.skillTaxonomy.findMany({
      include: {
        parent: true,
        subSkills: true,
      },
    });
  }

  async findOne(skillId: string): Promise<SkillTaxonomy> {
    const skill = await this.prisma.skillTaxonomy.findUnique({
      where: { skillId },
      include: {
        parent: true,
        subSkills: true,
      },
    });
    if (!skill) {
      throw new NotFoundException(
        `SkillTaxonomy with ID "${skillId}" not found`,
      );
    }
    return skill;
  }

  async update(
    skillId: string,
    data: Prisma.SkillTaxonomyUpdateInput,
  ): Promise<SkillTaxonomy> {
    // Ensure skill exists first
    await this.findOne(skillId);
    return this.prisma.skillTaxonomy.update({
      where: { skillId },
      data,
    });
  }

  async remove(skillId: string): Promise<SkillTaxonomy> {
    // Ensure skill exists first
    await this.findOne(skillId);
    return this.prisma.skillTaxonomy.delete({
      where: { skillId },
    });
  }
}
