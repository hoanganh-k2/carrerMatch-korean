console.log('--- BEFORE DOTENV:', process.env.DATABASE_URL);
import * as dotenv from 'dotenv';
dotenv.config({ override: true });
console.log('--- AFTER DOTENV:', process.env.DATABASE_URL);
import { PrismaService } from './prisma/prisma.service';
import { EmbeddingService } from './ai/embedding.service';

async function run() {
  const embeddingService = new EmbeddingService();
  await embeddingService.onModuleInit();
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  try {
    console.log('--- ENABLING VECTOR EXTENSION...');
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('--- ENABLING VECTOR EXTENSION SUCCESSFUL!');
  } catch (err) {
    console.error('--- FAILED TO ENABLE VECTOR EXTENSION:', err);
  }

  const query = 'Tìm việc BrSE tiếng Hàn lương cao ở Hà Nội';
  const vector = await embeddingService.generateEmbedding(query);
  console.log('Vector length:', vector.length);

  const count = await prisma.jobPosting.count();
  console.log('Job posting count:', count);

  const allJobs = await prisma.jobPosting.findMany({ take: 1 });
  const sampleJob = allJobs[0];
  console.log('Sample job title:', sampleJob.title);
  console.log('Sample job jdEmbedding exists:', !!sampleJob.jdEmbedding);
  if (sampleJob.jdEmbedding) {
    try {
      const jobVector = JSON.parse(sampleJob.jdEmbedding) as number[];
      console.log('Parsed vector length:', jobVector.length);
      const score = cosineSimilarity(vector, jobVector);
      console.log('Computed cosine similarity score:', score);
    } catch (err) {
      console.error('Error parsing/computing similarity:', err);
    }
  }
  await prisma.onModuleDestroy();
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

run().catch(console.error);
