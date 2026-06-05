import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

// Auth & Users
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

// Core Domain
import { CompaniesModule } from './companies/companies.module';
import { ResumesModule } from './resumes/resumes.module';
import { JobUsersModule } from './job-users/job-users.module';
import { JobPostingsModule } from './job-postings/job-postings.module';
import { JobApplicationsModule } from './job-applications/job-applications.module';

// Support
import { SkillTaxonomyModule } from './skill-taxonomy/skill-taxonomy.module';
import { CareerEventsModule } from './career-events/career-events.module';
import { RolesPermissionsModule } from './roles-permissions/roles-permissions.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    // Auth
    AuthModule,
    UsersModule,
    // Core Domain
    CompaniesModule,
    ResumesModule,
    JobUsersModule,
    JobPostingsModule,
    JobApplicationsModule,
    // Support
    SkillTaxonomyModule,
    CareerEventsModule,
    RolesPermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
