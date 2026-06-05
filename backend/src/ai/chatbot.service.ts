/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class ChatbotService {
  private ai: GoogleGenAI;

  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
  ) {
    // Khởi tạo Google Gen AI SDK với API Key lấy từ file .env
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async chatWithCareerBot(userId: string, userMessage: string) {
    // 1. Lấy thông tin profile thực tế của ứng viên trong hệ thống để cá nhân hóa câu trả lời
    const userProfile = await this.prisma.jobUser.findUnique({
      where: { userId },
    });

    // 2. Chuyển câu hỏi của user thành Vector để truy vấn dữ liệu việc làm thực tế (RAG)
    const queryVector =
      await this.embeddingService.generateEmbedding(userMessage);
    const vectorString = `[${queryVector.join(',')}]`;

    // Quét top 3 công việc phù hợp nhất ngữ nghĩa câu hỏi trong database
    let dynamicJobs: any[] = [];
    try {
      dynamicJobs = await this.prisma.$queryRaw`
        SELECT title, description, required_skills, min_topik_required, location
        FROM job_postings
        WHERE status = 'active'
        ORDER BY jd_embedding <=> ${vectorString}::vector ASC
        LIMIT 3;
      `;
    } catch (err: any) {
      if (err.message?.includes('vector') || err.code === 'P2010') {
        const allJobs = await this.prisma.jobPosting.findMany({
          where: { status: 'active' },
        });
        const scored = allJobs.map((job) => {
          let score = 0.0;
          if (job.jdEmbedding) {
            try {
              let jobVec: number[] = [];
              try {
                jobVec = JSON.parse(job.jdEmbedding) as number[];
              } catch {
                const cleaned = job.jdEmbedding
                  .replace('[', '')
                  .replace(']', '');
                jobVec = cleaned.split(',').map(Number);
              }
              score = cosineSimilarity(queryVector, jobVec);
            } catch {
              // ignore
            }
          }
          return {
            title: job.title,
            description: job.description,
            required_skills: job.requiredSkills,
            min_topik_required: job.minTopikRequired,
            location: job.location,
            score,
          };
        });
        scored.sort((a, b) => b.score - a.score);
        dynamicJobs = scored.slice(0, 3);
      } else {
        throw err;
      }
    }

    // 3. Xây dựng ngữ cảnh dữ liệu hệ thống (System Prompt + Context Data)
    const jobsContext = dynamicJobs
      .map(
        (j, idx) =>
          `[Việc làm ${idx + 1}]: ${j.title} tại ${j.location}. Yêu cầu TOPIK: ${j.min_topik_required}. Kỹ năng chuyên môn: ${j.required_skills.join(', ')}.`,
      )
      .join('\n');

    const userContext = userProfile
      ? `Thông tin ứng viên hiện tại: Họ tên ${userProfile.fullName}, trình độ hiện tại: ${userProfile.topikLevel}, kỹ năng đã có: ${userProfile.skillsExtracted.join(', ')}.`
      : 'Chưa có thông tin profile.';

    const systemInstruction = `
      Bạn là 'CareerMatch BrSE Bot' - Trợ lý tư vấn lộ trình sự nghiệp Kỹ sư cầu nối (BrSE) và IT Tiếng Hàn chuyên nghiệp.
      Nhiệm vụ của bạn là dựa vào thông tin thực tế của ứng viên và danh sách việc làm đang có trong hệ thống để tư vấn, so sánh và đưa ra lời khuyên thiết thực.
      
      Dưới đây là dữ liệu thực tế trích xuất trực tiếp từ hệ thống:
      ---
      ${userContext}
      ---
      Danh sách việc làm phù hợp tìm thấy trong DB hệ thống:
      ${jobsContext}
      ---
      
      Hãy trả lời câu hỏi của người dùng một cách thân thiện, chuyên nghiệp bằng Tiếng Việt (hoặc Tiếng Hàn nếu được yêu cầu). Luôn đối chiếu kỹ năng của họ với yêu cầu của việc làm để chỉ ra họ đang thiếu chứng chỉ TOPIK gì hoặc công nghệ gì và hướng dẫn họ cải thiện.
    `;

    // 4. Gọi mô hình Gemini để sinh câu trả lời thông minh dựa trên dữ liệu hệ thống
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash', // Sử dụng model có tốc độ phản hồi tối ưu
      contents: userMessage,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return {
      reply: response.text,
      retrievedJobsCount: dynamicJobs.length, // Trả về số lượng bản ghi đã truy vấn để chứng minh với hội đồng
    };
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
