import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { JobApplicationsService } from './job-applications.service';
import { Prisma } from '@prisma/client';

@Controller('job-applications')
export class JobApplicationsController {
  constructor(
    private readonly jobApplicationsService: JobApplicationsService,
  ) {}

  @Post()
  create(@Body() createJobApplicationDto: Prisma.JobApplicationCreateInput) {
    return this.jobApplicationsService.create(createJobApplicationDto);
  }

  @Get()
  findAll() {
    return this.jobApplicationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobApplicationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateJobApplicationDto: Prisma.JobApplicationUpdateInput,
  ) {
    return this.jobApplicationsService.update(id, updateJobApplicationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobApplicationsService.remove(id);
  }
}
