import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';
import { EmbeddingService } from '../ai/embedding.service';
import { Prisma } from '@prisma/client';

@Controller('job-postings')
export class JobPostingsController {
  constructor(
    private readonly jobPostingsService: JobPostingsService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  @Post('search-semantic')
  async searchSemantic(@Body('query') query: string) {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    return this.jobPostingsService.searchSemantic(queryEmbedding);
  }

  @Get(':jobId/match-candidates')
  matchCandidates(@Param('jobId') jobId: string) {
    return this.jobPostingsService.matchCandidatesForJob(jobId);
  }

  @Post()
  create(@Body() createJobPostingDto: Prisma.JobPostingCreateInput) {

    return this.jobPostingsService.create(createJobPostingDto);
  }

  @Get()
  findAll() {
    return this.jobPostingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobPostingsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateJobPostingDto: Prisma.JobPostingUpdateInput,
  ) {
    return this.jobPostingsService.update(id, updateJobPostingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobPostingsService.remove(id);
  }
}
