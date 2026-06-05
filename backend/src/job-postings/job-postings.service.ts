/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from 'src/ai/embedding.service';
import { Prisma, JobPosting } from '@prisma/client';

@Injectable()
export class JobPostingsService {
  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
  ) {}

  async create(data: any) {
    // 1. Tự động gom tiêu đề và mô tả để sinh Vector ngữ nghĩa tổng hợp
    const fullContentForAI = `${data.title}. Yêu cầu: ${data.description}`;
    const embedding =
      await this.embeddingService.generateEmbedding(fullContentForAI);
    const vectorString = `[${embedding.join(',')}]`;

    // 2. Lưu vào PostgreSQL bằng lệnh SQL thô để nạp được kiểu dữ liệu Unsupported("vector(768)")
    await this.prisma.$executeRaw`
      INSERT INTO job_postings (
        job_id, company_id, title, description, jd_embedding, 
        required_skills, preferred_skills, salary_min, salary_max, 
        job_type, experience_years_min, location, application_deadline, status
      ) VALUES (
        gen_random_uuid(), ${data.companyId}, ${data.title}, ${data.description}, 
        ${vectorString}::vector, ${data.requiredSkills}, ${data.preferredSkills}, 
        ${data.salaryMin}, ${data.salaryMax}, ${data.jobType}::"JobType", 
        ${data.experienceYearsMin}, ${data.location}, ${new Date(data.applicationDeadline)}, 'active'
      );
    `;

    return {
      message: 'Đăng tin tuyển dụng và thiết lập Vector AI thành công!',
    };
  }

  async findAll(): Promise<JobPosting[]> {
    return this.prisma.jobPosting.findMany();
  }

  async findOne(jobId: string): Promise<JobPosting> {
    const posting = await this.prisma.jobPosting.findUnique({
      where: { jobId },
    });
    if (!posting) {
      throw new NotFoundException(`JobPosting with ID "${jobId}" not found`);
    }
    return posting;
  }

  async update(
    jobId: string,
    data: Prisma.JobPostingUpdateInput,
  ): Promise<JobPosting> {
    await this.findOne(jobId);
    return this.prisma.jobPosting.update({
      where: { jobId },
      data,
    });
  }

  async remove(jobId: string): Promise<JobPosting> {
    await this.findOne(jobId);
    return this.prisma.jobPosting.delete({
      where: { jobId },
    });
  }

  // F1 - Tìm kiếm thông minh bằng Vector (Semantic Search)
  async searchSemantic(queryEmbedding: number[], limit = 10) {
    // Chuyển mảng số thực thành chuỗi định dạng vector của PostgreSQL: '[0.1, 0.2, ...]'
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Thực thi SQL thô để tính Cosine Distance (<=>). Khoảng cách càng nhỏ, độ tương đồng càng cao (1 - Distance)
    const jobs = await this.prisma.$queryRaw`
      SELECT 
        job_id, title, location, salary_min, salary_max, required_skills, min_topik_required,
        (1 - (jd_embedding <=> ${vectorString}::vector)) AS similarity_score
      FROM job_postings
      WHERE status = 'active'
      ORDER BY jd_embedding <=> ${vectorString}::vector ASC
      LIMIT ${limit};
    `;

    return jobs;
  }

  // F3 - AI Job Matching cho Nhà tuyển dụng
  async matchCandidatesForJob(jobId: string, limit = 10) {
    // 1. Lấy thông tin và embedding của Job trước
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobId },
    });

    if (!job || !job.jdEmbedding) {
      throw new Error(
        'Không tìm thấy tin tuyển dụng hoặc tin chưa được cấu hình Vector Embedding',
      );
    }

    // 2. Quét và tính toán độ tương đồng với skills_vector của các ứng viên (JobUser)
    const matchedCandidates = await this.prisma.$queryRaw`
      SELECT 
        user_id, full_name, topik_level, years_experience, skills_extracted,
        (1 - (skills_vector <=> (SELECT jd_embedding FROM job_postings WHERE job_id = ${jobId})::vector)) AS semantic_score
      FROM job_users
      WHERE role = 'candidate' AND open_to_work = true
      ORDER BY skills_vector <=> (SELECT jd_embedding FROM job_postings WHERE job_id = ${jobId})::vector ASC
      LIMIT ${limit};
    `;

    // 3. Re-rank & Tạo breakdown giải thích lý do gợi ý (Đạt chuẩn quy định tính năng F3)
    return (matchedCandidates as any[]).map((candidate) => {
      // Tính toán trọng số bổ sung từ năng lực Tiếng Hàn thực tế của ứng viên
      let languageBonus = 0;
      if (candidate.topik_level === job.minTopikRequired) languageBonus = 0.1;

      const finalScore = Math.min(
        candidate.semantic_score * 0.7 + languageBonus * 0.3,
        1.0,
      );

      return {
        candidateId: candidate.user_id,
        fullName: candidate.full_name,
        finalMatchScore: Math.round(finalScore * 100) / 100,
        breakdown: {
          semanticMatch: Math.round(candidate.semantic_score * 100) + '%',
          koreanLevelMatch:
            candidate.topik_level === job.minTopikRequired
              ? 'Đạt chuẩn (TOPIK ' + job.minTopikRequired + ')'
              : 'Cần kiểm tra thêm',
          explanation: `Phù hợp kỹ năng chuyên môn đạt ${Math.round(candidate.semantic_score * 100)}%. Năng lực tiếng Hàn ${candidate.topik_level}.`,
        },
      };
    });
  }
}
