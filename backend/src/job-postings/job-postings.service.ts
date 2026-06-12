/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from 'src/ai/embedding.service';
import { Prisma, JobPosting } from '@prisma/client';
import { meetsTopikRequirement } from '../shared/topik.utils';

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
    const vectorString = JSON.stringify(embedding);

    try {
      // 2. Lưu vào PostgreSQL bằng lệnh SQL thô để nạp được kiểu dữ liệu Unsupported("vector(768)")
      await this.prisma.$executeRaw`
        INSERT INTO job_postings (
          job_id, company_id, title, description, jd_embedding,
          required_skills, preferred_skills, salary_min, salary_max,
          job_type, experience_years_min, location, application_deadline, status,
          min_topik_required
        ) VALUES (
          gen_random_uuid(), ${data.companyId}, ${data.title}, ${data.description},
          ${`[${embedding.join(',')}]`}::vector, ${data.requiredSkills}, ${data.preferredSkills},
          ${data.salaryMin}, ${data.salaryMax}, ${data.jobType}::"JobType",
          ${data.experienceYearsMin}, ${data.location}, ${new Date(data.applicationDeadline)}, 'active',
          ${data.minTopikRequired ?? 'NONE'}::"TopikLevel"
        );
      `;
    } catch (err: any) {
      if (err.message?.includes('vector') || err.code === 'P2010') {
        await this.prisma.jobPosting.create({
          data: {
            companyId: data.companyId,
            title: data.title,
            description: data.description,
            jdEmbedding: vectorString,
            requiredSkills: data.requiredSkills,
            preferredSkills: data.preferredSkills,
            salaryMin: data.salaryMin,
            salaryMax: data.salaryMax,
            jobType: data.jobType,
            experienceYearsMin: data.experienceYearsMin,
            location: data.location,
            applicationDeadline: new Date(data.applicationDeadline),
            status: 'active',
            minTopikRequired: data.minTopikRequired ?? 'NONE',
          },
        });
      } else {
        throw err;
      }
    }

    return {
      message: 'Đăng tin tuyển dụng và thiết lập Vector AI thành công!',
    };
  }

  async findAll() {
    // Bỏ jdEmbedding (vector 768 chiều dạng text ~17KB/tin) để response nhẹ;
    // kèm thông tin công ty cho card hiển thị
    return this.prisma.jobPosting.findMany({
      omit: { jdEmbedding: true },
      include: {
        company: { select: { companyName: true, logoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
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
    try {
      const vectorString = `[${queryEmbedding.join(',')}]`;
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
    } catch (err: any) {
      if (
        err.message?.includes('vector') ||
        err.message?.includes('operator') ||
        err.code === 'P2010'
      ) {
        const allJobs = await this.prisma.jobPosting.findMany({
          where: { status: 'active' },
        });

        const scoredJobs = allJobs.map((job) => {
          let similarityScore = 0.0;
          if (job.jdEmbedding) {
            try {
              let jobVector: number[] = [];
              try {
                jobVector = JSON.parse(job.jdEmbedding) as number[];
              } catch {
                const cleaned = job.jdEmbedding
                  .replace('[', '')
                  .replace(']', '');
                jobVector = cleaned.split(',').map(Number);
              }
              similarityScore = cosineSimilarity(queryEmbedding, jobVector);
            } catch (e) {
              console.error('--- FALLBACK SIMILARITY ERROR:', e);
            }
          }
          return {
            job_id: job.jobId,
            title: job.title,
            location: job.location,
            salary_min: job.salaryMin,
            salary_max: job.salaryMax,
            required_skills: job.requiredSkills,
            min_topik_required: job.minTopikRequired,
            similarity_score: Math.round(similarityScore * 100) / 100,
          };
        });

        scoredJobs.sort((a, b) => b.similarity_score - a.similarity_score);
        return scoredJobs.slice(0, limit);
      }
      throw err;
    }
  }

  // F3 - AI Job Matching cho Nhà tuyển dụng
  async matchCandidatesForJob(jobId: string, limit = 10) {
    // 1. Lấy thông tin và embedding của Job trước
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobId },
    });

    if (!job) {
      throw new Error('Không tìm thấy tin tuyển dụng');
    }

    try {
      // 2. Quét và tính toán độ tương đồng với skills_vector của các ứng viên (JobUser)
      const matchedCandidates = await this.prisma.$queryRaw`
        SELECT
          ju.user_id, ju.full_name, ju.topik_level, ju.years_experience, ju.skills_extracted,
          (1 - (ju.skills_vector::vector <=> (SELECT jd_embedding FROM job_postings WHERE job_id = ${jobId})::vector)) AS semantic_score
        FROM job_users ju
        JOIN users u ON u.id = ju.user_id
        WHERE u.role = 'candidate' AND ju.open_to_work = true AND ju.skills_vector IS NOT NULL
        ORDER BY ju.skills_vector::vector <=> (SELECT jd_embedding FROM job_postings WHERE job_id = ${jobId})::vector ASC
        LIMIT ${limit};
      `;

      return (matchedCandidates as any[])
        .map((candidate) => {
          let languageBonus = 0;
          if (candidate.topik_level === job.minTopikRequired)
            languageBonus = 0.1;
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
        })
        .sort((a, b) => b.finalMatchScore - a.finalMatchScore);
    } catch (err: any) {
      if (err.message?.includes('vector') || err.code === 'P2010') {
        const candidates = await this.prisma.jobUser.findMany({
          where: { openToWork: true, user: { role: 'candidate' } },
        });

        let jobVector: number[] = [];
        if (job.jdEmbedding) {
          try {
            jobVector = JSON.parse(job.jdEmbedding) as number[];
          } catch {
            const cleaned = job.jdEmbedding.replace('[', '').replace(']', '');
            jobVector = cleaned.split(',').map(Number);
          }
        }

        const scoredCandidates = candidates.map((candidate) => {
          let semanticScore = 0.0;
          if (candidate.skillsVector) {
            try {
              let candidateVector: number[] = [];
              try {
                candidateVector = JSON.parse(
                  candidate.skillsVector,
                ) as number[];
              } catch {
                const cleaned = candidate.skillsVector
                  .replace('[', '')
                  .replace(']', '');
                candidateVector = cleaned.split(',').map(Number);
              }
              semanticScore = cosineSimilarity(jobVector, candidateVector);
            } catch {
              // ignore
            }
          }
          return {
            user_id: candidate.userId,
            full_name: candidate.fullName,
            topik_level: candidate.topikLevel,
            years_experience: candidate.yearsExperience,
            skills_extracted: candidate.skillsExtracted,
            semantic_score: semanticScore,
          };
        });

        scoredCandidates.sort((a, b) => b.semantic_score - a.semantic_score);
        const matched = scoredCandidates.slice(0, limit);

        return matched
          .map((candidate) => {
            let languageBonus = 0;
            if (candidate.topik_level === job.minTopikRequired)
              languageBonus = 0.1;
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
          })
          .sort((a, b) => b.finalMatchScore - a.finalMatchScore);
      }
      throw err;
    }
  }

  // F3 (chiều ứng viên) - Gợi ý việc làm phù hợp cho candidate, có giải thích lý do
  async recommendJobsForCandidate(candidateId: string, limit = 10) {
    const candidate = await this.prisma.jobUser.findUnique({
      where: { userId: candidateId },
    });
    if (!candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên');
    }

    // Vector của ứng viên: ưu tiên skillsVector đã lưu, chưa có thì sinh mới từ hồ sơ
    let candidateVector: number[] = [];
    if (candidate.skillsVector) {
      try {
        candidateVector = JSON.parse(candidate.skillsVector) as number[];
      } catch {
        const cleaned = candidate.skillsVector
          .replace('[', '')
          .replace(']', '');
        candidateVector = cleaned.split(',').map(Number);
      }
    }
    if (candidateVector.length === 0) {
      const profileText = `Kỹ năng: ${candidate.skillsExtracted.join(', ')}. Trình độ tiếng Hàn: ${candidate.topikLevel}. Kinh nghiệm: ${candidate.yearsExperience ?? 0} năm.`;
      candidateVector =
        await this.embeddingService.generateEmbedding(profileText);
    }

    const jobs = await this.prisma.jobPosting.findMany({
      where: { status: 'active' },
      include: {
        company: { select: { companyName: true, logoUrl: true } },
      },
    });

    const candidateSkills = candidate.skillsExtracted.map((s) =>
      s.toLowerCase(),
    );

    const scoredJobs = jobs.map((job) => {
      let semanticScore = 0.0;
      if (job.jdEmbedding) {
        try {
          let jobVector: number[] = [];
          try {
            jobVector = JSON.parse(job.jdEmbedding) as number[];
          } catch {
            const cleaned = job.jdEmbedding.replace('[', '').replace(']', '');
            jobVector = cleaned.split(',').map(Number);
          }
          semanticScore = cosineSimilarity(candidateVector, jobVector);
        } catch {
          // ignore
        }
      }

      const requiredSkills = job.requiredSkills || [];
      const matchedSkills = requiredSkills.filter((s) =>
        candidateSkills.includes(s.toLowerCase()),
      );
      const missingSkills = requiredSkills.filter(
        (s) => !candidateSkills.includes(s.toLowerCase()),
      );
      const skillRatio =
        requiredSkills.length > 0
          ? matchedSkills.length / requiredSkills.length
          : 1.0;
      const topikOk = meetsTopikRequirement(
        candidate.topikLevel,
        job.minTopikRequired,
      );

      // Tổng hợp: ngữ nghĩa 50%, kỹ năng khớp 30%, TOPIK 20%
      const finalScore =
        semanticScore * 0.5 + skillRatio * 0.3 + (topikOk ? 0.2 : 0);

      return {
        jobId: job.jobId,
        title: job.title,
        company: job.company,
        location: job.location,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        jobType: job.jobType,
        minTopikRequired: job.minTopikRequired,
        recommendScore: Math.round(finalScore * 100) / 100,
        breakdown: {
          semanticMatch: Math.round(semanticScore * 100) + '%',
          skillMatch: `${matchedSkills.length}/${requiredSkills.length} kỹ năng (${matchedSkills.join(', ') || 'chưa khớp'})`,
          missingSkills,
          koreanLevelMatch: topikOk
            ? `Đạt yêu cầu (cần ${job.minTopikRequired}, bạn có ${candidate.topikLevel})`
            : `Chưa đạt (cần ${job.minTopikRequired}, bạn có ${candidate.topikLevel})`,
          explanation: `Gợi ý vì hồ sơ của bạn tương đồng ngữ nghĩa ${Math.round(semanticScore * 100)}% với JD, khớp ${matchedSkills.length}/${requiredSkills.length} kỹ năng bắt buộc${missingSkills.length > 0 ? `, cần bổ sung: ${missingSkills.join(', ')}` : ''}.`,
        },
      };
    });

    scoredJobs.sort((a, b) => b.recommendScore - a.recommendScore);
    return scoredJobs.slice(0, limit);
  }
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  const length = Math.min(vecA.length, vecB.length);
  for (let i = 0; i < length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0.0 || normB === 0.0) return 0.0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
