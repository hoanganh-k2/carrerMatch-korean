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
    let replyText = '';
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userMessage,
        config: {
          systemInstruction: systemInstruction,
        },
      });
      replyText = response.text || '';
    } catch (error25) {
      console.warn('Gemini 2.5 Flash error, trying 1.5 Flash:', error25);
      try {
        const response15 = await this.ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: userMessage,
          config: {
            systemInstruction: systemInstruction,
          },
        });
        replyText = response15.text || '';
      } catch (error15) {
        console.error('All Gemini models failed. Activating programmatic fallback.', error15);
        
        const candidateName = userProfile?.fullName || 'ứng viên';
        const topik = userProfile?.topikLevel ? formatTopikDisplay(userProfile.topikLevel) : 'chưa cập nhật';
        const userSkills = userProfile?.skillsExtracted || [];
        
        let analysis = `Chào bạn ${candidateName}! Rất tiếc, máy chủ AI chính hiện đang bận do lượng truy cập cao từ phía nhà cung cấp, nhưng tôi đã phân tích nhanh hồ sơ của bạn đối chiếu với cơ sở dữ liệu việc làm thực tế:\n\n`;
        analysis += `**1. Đánh giá hồ sơ của bạn:**\n`;
        analysis += `* Trình độ tiếng Hàn: **${topik}**\n`;
        analysis += `* Kỹ năng chuyên môn hiện có: **${userSkills.join(', ') || 'Chưa cập nhật'}**\n\n`;
        
        if (dynamicJobs.length > 0) {
          analysis += `**2. Đề xuất việc làm phù hợp nhất từ hệ thống:**\n`;
          dynamicJobs.forEach((job, idx) => {
            const jobTopik = formatTopikDisplay(job.min_topik_required || job.minTopikRequired);
            const jobSkills = job.required_skills || job.requiredSkills || [];
            analysis += `* **Việc làm ${idx + 1}:** ${job.title} (${job.location})\n`;
            analysis += `  * Yêu cầu tiếng Hàn: **${jobTopik}**\n`;
            analysis += `  * Yêu cầu công nghệ: **${jobSkills.join(', ')}**\n`;
            
            // Check missing skills
            const missing = jobSkills.filter((s: string) => !userSkills.some((us: string) => us.toLowerCase() === s.toLowerCase()));
            if (missing.length > 0) {
              analysis += `  * Kỹ năng bạn cần bổ sung: **${missing.join(', ')}**\n`;
            } else {
              analysis += `  * Phù hợp hoàn hảo về kỹ năng công nghệ!\n`;
            }
          });
          analysis += `\n**3. Lộ trình phát triển đề xuất:**\n`;
          analysis += `* Hãy tập trung trau dồi các kỹ năng công nghệ còn thiếu được liệt kê ở trên.\n`;
          analysis += `* Chuẩn bị CV tiếng Hàn chuẩn chỉnh để sẵn sàng ứng tuyển các cơ hội này.\n`;
        } else {
          analysis += `Hiện tại chưa có công việc hoạt động nào trong hệ thống trùng khớp với yêu cầu của bạn. Bạn vui lòng quay lại sau nhé!\n`;
        }
        
        replyText = analysis;
      }
    }

    return {
      reply: replyText,
      retrievedJobsCount: dynamicJobs.length,
    };
  }
}

function formatTopikDisplay(level: string): string {
  if (!level) return 'Không yêu cầu';
  if (level.startsWith('TOPIK_II_LEVEL_')) {
    return `TOPIK II - Cấp ${level.replace('TOPIK_II_LEVEL_', '')}`;
  }
  if (level.startsWith('TOPIK_I_LEVEL_')) {
    return `TOPIK I - Cấp ${level.replace('TOPIK_I_LEVEL_', '')}`;
  }
  return level;
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
