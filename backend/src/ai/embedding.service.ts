/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class EmbeddingService implements OnModuleInit {
  private pipeline: any;

  async onModuleInit() {
    // Khởi tạo mô hình AI khi module được tải lên
    // Sử dụng xenova/multilingual-e5-base để sinh vector 768 chiều chuẩn ngữ nghĩa Hàn - Việt
    const { pipeline } = await import('@xenova/transformers');
    this.pipeline = await pipeline(
      'feature-extraction',
      'Xenova/multilingual-e5-base',
    );
    console.log(
      '🤖 Khởi tạo thành công mô hình AI Multilingual Embedding (768 dims)!',
    );
  }

  // Hàm chuyển đổi một văn bản (JD hoặc CV) thành mảng số thực 768 chiều
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text) return new Array(768).fill(0);

    // Tiền xử lý văn bản theo quy chuẩn của mô hình E5
    const formattedText = `query: ${text.replace(/\n/g, ' ')}`;

    const output = await this.pipeline(formattedText, {
      pooling: 'mean',
      normalize: true,
    });

    // Chuyển kết quả đầu ra thành mảng số thực JavaScript tiêu chuẩn
    return Array.from(output.data);
  }
}
