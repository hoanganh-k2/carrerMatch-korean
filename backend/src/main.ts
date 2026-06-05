import * as dotenv from 'dotenv';
dotenv.config({ override: true });
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật validation pipe toàn cục cho tất cả DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Bỏ các field không có trong DTO
      forbidNonWhitelisted: false,
      transform: true,       // Tự động transform types
    }),
  );

  // Bật CORS cho frontend
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 CareerMatch Korean Backend đang chạy tại http://localhost:${port}`);
  console.log(`📋 Các API endpoint chính:`);
  console.log(`   POST /auth/register - Đăng ký tài khoản`);
  console.log(`   POST /auth/login    - Đăng nhập`);
  console.log(`   GET  /auth/me       - Xem profile (cần JWT)`);
  console.log(`   GET  /companies     - Danh sách công ty`);
  console.log(`   GET  /resumes/me    - CV của tôi (cần JWT)`);
}
void bootstrap();
