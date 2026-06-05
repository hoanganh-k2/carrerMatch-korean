import { Module } from '@nestjs/common';
import { SkillTaxonomyService } from './skill-taxonomy.service';
import { SkillTaxonomyController } from './skill-taxonomy.controller';

@Module({
  controllers: [SkillTaxonomyController],
  providers: [SkillTaxonomyService],
  exports: [SkillTaxonomyService],
})
export class SkillTaxonomyModule {}
