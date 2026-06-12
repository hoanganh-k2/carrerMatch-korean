import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let connectionString = `${process.env.DATABASE_URL}`;
if (connectionString.startsWith('prisma+postgres://')) {
  try {
    const parsedUrl = new URL(connectionString);
    const apiKey = parsedUrl.searchParams.get('api_key');
    if (apiKey) {
      const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString('utf-8'));
      if (decoded && decoded.databaseUrl) {
        connectionString = decoded.databaseUrl;
      }
    }
  } catch (err) {
    console.warn('Failed to parse prisma+postgres URL', err);
  }
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const [users, candidates, companies, jobs, applications, events, skills] = await Promise.all([
    prisma.user.count(),
    prisma.jobUser.count(),
    prisma.company.count(),
    prisma.jobPosting.count(),
    prisma.jobApplication.count(),
    prisma.careerEvent.count(),
    prisma.skillTaxonomy.count(),
  ]);

  const jobsWithEmbedding = await prisma.jobPosting.count({
    where: { jdEmbedding: { not: null } },
  });
  const candidatesWithVector = await prisma.jobUser.count({
    where: { skillsVector: { not: null } },
  });

  const sampleJob = await prisma.jobPosting.findFirst({
    where: { jdEmbedding: { not: null } },
    select: { title: true, jdEmbedding: true },
  });
  const sampleDims = sampleJob?.jdEmbedding
    ? (JSON.parse(sampleJob.jdEmbedding) as number[]).length
    : 0;

  const oldestEvent = await prisma.careerEvent.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } });
  const newestEvent = await prisma.careerEvent.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } });

  console.log('===== KIỂM TRA DỮ LIỆU SEED =====');
  console.log(`Users: ${users} (yêu cầu ≥ 200)`);
  console.log(`  - Candidates (JobUser): ${candidates}, có skillsVector: ${candidatesWithVector}`);
  console.log(`  - Companies: ${companies}`);
  console.log(`Job postings: ${jobs} (yêu cầu ≥ 500), có jdEmbedding: ${jobsWithEmbedding}`);
  console.log(`  - Số chiều vector mẫu: ${sampleDims} (chuẩn 768)`);
  console.log(`Applications: ${applications}`);
  console.log(`Career events: ${events} (yêu cầu ≥ 1.000)`);
  console.log(`  - Lịch sử từ ${oldestEvent?.createdAt.toISOString().slice(0, 10)} đến ${newestEvent?.createdAt.toISOString().slice(0, 10)}`);
  console.log(`Skill taxonomy: ${skills}`);

  const sampleApp = await prisma.jobApplication.findFirst({
    select: { matchScore: true, matchBreakdownJson: true },
  });
  console.log(`Application mẫu: matchScore=${sampleApp?.matchScore}, breakdown=${JSON.stringify(sampleApp?.matchBreakdownJson)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
