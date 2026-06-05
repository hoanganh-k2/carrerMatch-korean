import { Module } from '@nestjs/common';
import { JobUsersService } from './job-users.service';
import { JobUsersController } from './job-users.controller';

@Module({
  controllers: [JobUsersController],
  providers: [JobUsersService],
  exports: [JobUsersService],
})
export class JobUsersModule {}
