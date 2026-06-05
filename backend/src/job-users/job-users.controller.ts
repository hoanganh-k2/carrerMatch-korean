import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { JobUsersService } from './job-users.service';
import { Prisma } from '@prisma/client';

@Controller('job-users')
export class JobUsersController {
  constructor(private readonly jobUsersService: JobUsersService) {}

  @Post()
  create(@Body() createJobUserDto: Prisma.JobUserCreateInput) {
    return this.jobUsersService.create(createJobUserDto);
  }

  @Get()
  findAll() {
    return this.jobUsersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobUsersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateJobUserDto: Prisma.JobUserUpdateInput,
  ) {
    return this.jobUsersService.update(id, updateJobUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobUsersService.remove(id);
  }
}
