import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SkillTaxonomyService } from './skill-taxonomy.service';
import { Prisma } from '@prisma/client';

@Controller('skill-taxonomy')
export class SkillTaxonomyController {
  constructor(private readonly skillTaxonomyService: SkillTaxonomyService) {}

  @Post()
  create(@Body() createSkillTaxonomyDto: Prisma.SkillTaxonomyCreateInput) {
    return this.skillTaxonomyService.create(createSkillTaxonomyDto);
  }

  @Get()
  findAll() {
    return this.skillTaxonomyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillTaxonomyService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSkillTaxonomyDto: Prisma.SkillTaxonomyUpdateInput,
  ) {
    return this.skillTaxonomyService.update(id, updateSkillTaxonomyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.skillTaxonomyService.remove(id);
  }
}
