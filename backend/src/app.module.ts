import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JobUsersModule } from './job-users/job-users.module';
import { JobPostingsModule } from './job-postings/job-postings.module';
import { JobApplicationsModule } from './job-applications/job-applications.module';
import { SkillTaxonomyModule } from './skill-taxonomy/skill-taxonomy.module';
import { CareerEventsModule } from './career-events/career-events.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    JobUsersModule,
    JobPostingsModule,
    JobApplicationsModule,
    SkillTaxonomyModule,
    CareerEventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
