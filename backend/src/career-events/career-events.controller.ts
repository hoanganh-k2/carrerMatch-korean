import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CareerEventsService } from './career-events.service';
import { Prisma } from '@prisma/client';

@Controller('career-events')
export class CareerEventsController {
  constructor(private readonly careerEventsService: CareerEventsService) {}

  @Post()
  create(@Body() createCareerEventDto: Prisma.CareerEventCreateInput) {
    return this.careerEventsService.create(createCareerEventDto);
  }

  @Get()
  findAll() {
    return this.careerEventsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.careerEventsService.findOne(BigInt(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCareerEventDto: Prisma.CareerEventUpdateInput,
  ) {
    return this.careerEventsService.update(BigInt(id), updateCareerEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.careerEventsService.remove(BigInt(id));
  }
}
