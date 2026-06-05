import * as dotenv from 'dotenv';
dotenv.config({ override: true });
import { PrismaService } from './prisma/prisma.service';
import { EmbeddingService } from './ai/embedding.service';

async function run() {
  console.log('🌱 Starting to populate vector embeddings for candidates (job_users)...');
  const embeddingService = new EmbeddingService();
  await embeddingService.onModuleInit();
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const candidates = await prisma.jobUser.findMany({
    where: {
      user: { role: 'candidate' },
      OR: [
        { skillsVector: null },
        { skillsVector: '' }
      ]
    }
  });

  console.log(`- Found ${candidates.length} candidates without embeddings.`);

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const fullContent = `Kỹ năng: ${candidate.skillsExtracted.join(', ')}. Trình độ tiếng Hàn: ${candidate.topikLevel}. Kinh nghiệm: ${candidate.yearsExperience} năm.`;
    const embedding = await embeddingService.generateEmbedding(fullContent);
    const vectorString = JSON.stringify(embedding);

    await prisma.jobUser.update({
      where: { userId: candidate.userId },
      data: { skillsVector: vectorString }
    });

    if ((i + 1) % 50 === 0 || i === candidates.length - 1) {
      console.log(`- Progress: ${i + 1}/${candidates.length} candidates updated.`);
    }
  }

  console.log('🎉 Candidate embeddings populated successfully!');
  await prisma.onModuleDestroy();
}

run().catch(console.error);
