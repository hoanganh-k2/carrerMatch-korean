import * as dotenv from 'dotenv';
dotenv.config({ override: true });
import { PrismaService } from './prisma/prisma.service';
import { EmbeddingService } from './ai/embedding.service';

async function run() {
  console.log('🌱 Starting to populate vector embeddings for job postings...');
  const embeddingService = new EmbeddingService();
  await embeddingService.onModuleInit();
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const jobs = await prisma.jobPosting.findMany({
    where: {
      OR: [
        { jdEmbedding: null },
        { jdEmbedding: '' }
      ]
    }
  });

  console.log(`- Found ${jobs.length} jobs without embeddings.`);

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const fullContent = `${job.title}. Yêu cầu: ${job.description}`;
    const embedding = await embeddingService.generateEmbedding(fullContent);
    const vectorString = JSON.stringify(embedding);

    await prisma.jobPosting.update({
      where: { jobId: job.jobId },
      data: { jdEmbedding: vectorString }
    });

    if ((i + 1) % 50 === 0 || i === jobs.length - 1) {
      console.log(`- Progress: ${i + 1}/${jobs.length} jobs updated.`);
    }
  }

  console.log('🎉 Vector embeddings populated successfully!');
  await prisma.onModuleDestroy();
}

run().catch(console.error);
