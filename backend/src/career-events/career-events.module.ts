import { Module } from '@nestjs/common';
import { CareerEventsService } from './career-events.service';
import { CareerEventsController } from './career-events.controller';

@Module({
  controllers: [CareerEventsController],
  providers: [CareerEventsService],
  exports: [CareerEventsService],
})
export class CareerEventsModule {}
