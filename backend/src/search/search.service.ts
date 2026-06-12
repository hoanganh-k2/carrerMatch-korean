import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from '../ai/embedding.service';
import { Prisma, TopikLevel, JobType } from '@prisma/client';
import { getLevelsUpTo } from '../shared/topik.utils';

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0
    ? 0
    : dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  // 1. Tìm kiếm nâng cao kết hợp bộ lọc và Semantic Search
  async searchJobs(
    params: {
      query?: string;
      locations?: string[];
      salaryMin?: number;
      salaryMax?: number;
      topikLevel?: TopikLevel;
      jobType?: JobType;
      skills?: string[];
    },
    userId?: string,
  ) {
    const {
      query,
      locations,
      salaryMin,
      salaryMax,
      topikLevel,
      jobType,
      skills,
    } = params;

    // Lọc cơ bản
    const where: Prisma.JobPostingWhereInput = {
      status: 'active',
    };

    if (locations && locations.length > 0) {
      where.location = { in: locations };
    }

    if (salaryMin !== undefined) {
      where.salaryMin = { gte: salaryMin };
    }

    if (salaryMax !== undefined) {
      where.salaryMax = { lte: salaryMax };
    }

    if (topikLevel && topikLevel !== 'NONE') {
      // Lấy tất cả job có yêu cầu TOPIK <= trình độ của ứng viên
      where.minTopikRequired = { in: getLevelsUpTo(topikLevel) };
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (skills && skills.length > 0) {
      where.requiredSkills = { hasSome: skills };
    }

    // Lấy danh sách tin tuyển dụng từ database
    const jobs = await this.prisma.jobPosting.findMany({
      where,
      include: {
        company: {
          select: {
            companyName: true,
            logoUrl: true,
          },
        },
      },
    });

    // Log hành vi tìm kiếm nếu có userId đăng nhập
    if (userId) {
      await this.prisma.careerEvent.create({
        data: {
          userId,
          eventType: 'search',
          searchQuery: query || null,
          searchFiltersJson: JSON.stringify({
            locations,
            salaryMin,
            salaryMax,
            topikLevel,
            jobType,
            skills,
          }),
        },
      });
    }

    // Nếu có query, thực hiện tính toán độ tương đồng Vector ngữ nghĩa
    if (query && query.trim().length > 0) {
      const queryEmbedding =
        await this.embeddingService.generateEmbedding(query);
      const scoredJobs = jobs.map((job) => {
        let similarityScore = 0.0;
        if (job.jdEmbedding) {
          try {
            let jobVector: number[] = [];
            try {
              jobVector = JSON.parse(job.jdEmbedding) as number[];
            } catch {
              const cleaned = job.jdEmbedding.replace('[', '').replace(']', '');
              jobVector = cleaned.split(',').map(Number);
            }
            similarityScore = cosineSimilarity(queryEmbedding, jobVector);
          } catch (e) {
            console.error(
              'Error calculating similarity for job:',
              job.jobId,
              e,
            );
          }
        }
        return {
          ...job,
          similarityScore,
        };
      });

      // Sắp xếp giảm dần theo độ tương đồng ngữ nghĩa
      return scoredJobs.sort((a, b) => b.similarityScore - a.similarityScore);
    }

    // Nếu không có query, sắp xếp mặc định theo mới nhất
    return jobs;
  }

  // 2. Lấy lịch sử tìm kiếm gần nhất của user
  async getMySearchHistory(userId: string) {
    const events = await this.prisma.careerEvent.findMany({
      where: {
        userId,
        eventType: 'search',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Tránh lỗi serialize BigInt
    return events.map((event) => ({
      eventId: event.eventId.toString(),
      query: event.searchQuery,
      filters: event.searchFiltersJson ?? null,
      createdAt: event.createdAt,
    }));
  }

  // 3. Gợi ý từ khóa tìm kiếm hot
  async getSearchSuggestions() {
    const suggestions = await this.prisma.careerEvent.groupBy({
      by: ['searchQuery'],
      where: {
        eventType: 'search',
        searchQuery: {
          not: null,
          mode: 'insensitive',
        },
      },
      _count: {
        searchQuery: true,
      },
      orderBy: {
        _count: {
          searchQuery: 'desc',
        },
      },
      take: 5,
    });

    return suggestions.map((s) => ({
      query: s.searchQuery,
      searchCount: s._count.searchQuery,
    }));
  }
}
