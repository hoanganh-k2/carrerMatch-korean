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
import { SavedJobsModule } from './saved-jobs/saved-jobs.module';

// Support & Analytics
import { SkillTaxonomyModule } from './skill-taxonomy/skill-taxonomy.module';
import { CareerEventsModule } from './career-events/career-events.module';
import { RolesPermissionsModule } from './roles-permissions/roles-permissions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AiModule } from './ai/ai.module';
import { UploadsModule } from './uploads/uploads.module';
import { SearchModule } from './search/search.module';
import { InterviewsModule } from './interviews/interviews.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './mail/mail.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ShareModule } from './share/share.module';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    ScheduleModule.forRoot(),
    // Auth
    AuthModule,
    UsersModule,
    // Core Domain
    CompaniesModule,
    ResumesModule,
    JobUsersModule,
    JobPostingsModule,
    JobApplicationsModule,
    SavedJobsModule,
    // Support & Analytics
    SkillTaxonomyModule,
    CareerEventsModule,
    RolesPermissionsModule,
    NotificationsModule,
    DashboardModule,
    UploadsModule,
    SearchModule,
    InterviewsModule,
    ReviewsModule,
    MailModule,
    SubscriptionsModule,
    ShareModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
