import 'dotenv/config';
import { PrismaClient, Role, JobType, TopikLevel, JobStatus, ApplicationStatus, EventType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';

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
    console.warn('Failed to parse prisma+postgres URL in seed.ts', err);
  }
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Danh sách dữ liệu mẫu Tiếng Hàn ngành IT để sinh dữ liệu chân thực
const KOREAN_NAMES = ['김민준', '이서연', '박지훈', '최수빈', '정우성', '강다은', '윤시우', '한지민'];
const VIETNAMESE_IT_KOREAN_SKILLS = [
    'Java', 'Spring Boot', 'React', 'Node.js', 'TypeScript', 'PostgreSQL',
    'Korean Translation', 'Business Korean', 'Technical Interpretation', 'Jira', 'Agile'
];

const JOB_TITLES = [
    '[Hà Nội] Kỹ sư cầu nối BrSE Tiếng Hàn (TOPIK 5+)',
    'IT Business Analyst (Korean Speaking)',
    'Senior Java Developer - Công ty phần mềm Hàn Quốc',
    'Junior Frontend Engineer (Yêu cầu biết Tiếng Hàn giao tiếp)',
    'QA/QC Engineer - Ngôn ngữ làm việc Hàn - Việt',
    'Technical Lead (Bridge Engineer) - Thu nhập hấp dẫn',
    '[Remote] Biên phiên dịch viên kỹ thuật dự án IT'
];

const JOB_DESCRIPTIONS = [
    'Tham gia vào các dự án phần mềm lớn với đối tác FPT tại Seoul. Quản lý tiến độ, dịch tài liệu spec từ tiếng Hàn sang tiếng Việt và ngược lại.',
    'Phối hợp với đội ngũ phát triển tại Việt Nam và khách hàng Hàn Quốc để làm rõ yêu cầu hệ thống. Đòi hỏi khả năng giao tiếp tiếng Hàn thương mại tốt.',
    'Phát triển hệ thống Backend sử dụng Java/Spring Boot. Thảo luận trực tiếp với Tech Lead người Hàn Quốc.'
];

const SKILL_TAXONOMY = [
  { skillName: 'Java', category: 'programming', aliases: ['Java SE', 'Java EE'], demandScore: 92 },
  { skillName: 'Spring Boot', category: 'programming', aliases: ['Spring', 'Spring Framework'], demandScore: 88 },
  { skillName: 'Python', category: 'programming', aliases: ['Python3'], demandScore: 90 },
  { skillName: 'JavaScript', category: 'programming', aliases: ['JS', 'ECMAScript'], demandScore: 91 },
  { skillName: 'TypeScript', category: 'programming', aliases: ['TS'], demandScore: 85 },
  { skillName: 'React', category: 'frontend', aliases: ['ReactJS', 'React.js'], demandScore: 88 },
  { skillName: 'Next.js', category: 'frontend', aliases: ['NextJS'], demandScore: 80 },
  { skillName: 'Vue.js', category: 'frontend', aliases: ['Vue', 'VueJS'], demandScore: 75 },
  { skillName: 'Node.js', category: 'backend', aliases: ['NodeJS', 'Node'], demandScore: 83 },
  { skillName: 'NestJS', category: 'backend', aliases: ['Nest'], demandScore: 72 },
  { skillName: 'C#', category: 'programming', aliases: ['CSharp'], demandScore: 78 },
  { skillName: '.NET', category: 'backend', aliases: ['dotnet', 'ASP.NET'], demandScore: 76 },
  { skillName: 'C++', category: 'programming', aliases: ['CPP'], demandScore: 70 },
  { skillName: 'PHP', category: 'programming', aliases: [], demandScore: 65 },
  { skillName: 'Go', category: 'programming', aliases: ['Golang'], demandScore: 74 },
  { skillName: 'MySQL', category: 'database', aliases: [], demandScore: 82 },
  { skillName: 'PostgreSQL', category: 'database', aliases: ['Postgres'], demandScore: 80 },
  { skillName: 'MongoDB', category: 'database', aliases: ['Mongo'], demandScore: 75 },
  { skillName: 'Redis', category: 'database', aliases: [], demandScore: 72 },
  { skillName: 'Docker', category: 'devops', aliases: [], demandScore: 83 },
  { skillName: 'Kubernetes', category: 'devops', aliases: ['K8s'], demandScore: 78 },
  { skillName: 'AWS', category: 'cloud', aliases: ['Amazon Web Services'], demandScore: 82 },
  { skillName: 'Azure', category: 'cloud', aliases: ['Microsoft Azure'], demandScore: 75 },
  { skillName: 'Linux', category: 'devops', aliases: ['Ubuntu', 'CentOS'], demandScore: 80 },
  { skillName: 'BrSE', category: 'korean-role', aliases: ['Bridge SE', 'Bridge System Engineer'], demandScore: 95 },
  { skillName: 'COMTOR', category: 'korean-role', aliases: ['Communication Translator'], demandScore: 90 },
  { skillName: 'Technical Documentation', category: 'korean-role', aliases: ['Spec Writing'], demandScore: 82 },
  { skillName: 'Korean', category: 'language', aliases: ['Tiếng Hàn', '한국어'], demandScore: 99 },
  { skillName: 'Business Korean', category: 'language', aliases: ['비즈니스 한국어'], demandScore: 90 },
  { skillName: 'Technical Korean', category: 'language', aliases: ['기술 한국어'], demandScore: 88 },
  { skillName: 'Korean Translation', category: 'language', aliases: ['Dịch Tiếng Hàn'], demandScore: 85 },
  { skillName: 'Technical Interpretation', category: 'language', aliases: ['Phiên dịch kỹ thuật'], demandScore: 83 },
  { skillName: 'Agile', category: 'methodology', aliases: ['Scrum', 'Kanban'], demandScore: 78 },
  { skillName: 'Jira', category: 'methodology', aliases: [], demandScore: 75 },
  { skillName: 'QA Testing', category: 'testing', aliases: ['QA', 'Quality Assurance'], demandScore: 72 },
  { skillName: 'React Native', category: 'mobile', aliases: [], demandScore: 72 },
];

// ===== Sinh vector embedding ngay trong seed (model chạy local, cache theo nội dung) =====
let embedder: any = null;
const embeddingCache = new Map<string, string>();

async function getEmbeddingString(text: string): Promise<string> {
    const cached = embeddingCache.get(text);
    if (cached) return cached;
    if (!embedder) {
        const { pipeline } = await import('@xenova/transformers');
        embedder = await pipeline('feature-extraction', 'Xenova/multilingual-e5-base');
        console.log('🤖 Đã tải mô hình AI Multilingual Embedding (768 dims) cho seed.');
    }
    const output = await embedder(`query: ${text.replace(/\n/g, ' ')}`, {
        pooling: 'mean',
        normalize: true,
    });
    const vectorString = JSON.stringify(Array.from(output.data));
    embeddingCache.set(text, vectorString);
    return vectorString;
}

async function main() {
    console.log('🌱 Bắt đầu quá trình seeding dữ liệu...');

    // Dọn dữ liệu cũ (theo thứ tự khóa ngoại) để seed chạy lại không bị nhân đôi
    console.log('- Đang dọn dữ liệu cũ...');
    await prisma.careerEvent.deleteMany();
    await prisma.interview.deleteMany();
    await prisma.jobApplication.deleteMany();
    await prisma.savedJob.deleteMany();
    await prisma.companyReview.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.jobPosting.deleteMany();
    await prisma.workExperience.deleteMany();
    await prisma.education.deleteMany();
    await prisma.certification.deleteMany();
    await prisma.resume.deleteMany();
    await prisma.userPermission.deleteMany();
    await prisma.jobUser.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();

    // 0. Seed SkillTaxonomy
    console.log('- Đang seed danh mục kỹ năng (SkillTaxonomy)...');
    for (const skill of SKILL_TAXONOMY) {
        await prisma.skillTaxonomy.upsert({
            where: { skillName: skill.skillName },
            update: { category: skill.category, aliases: skill.aliases, demandScore: skill.demandScore },
            create: { skillName: skill.skillName, category: skill.category, aliases: skill.aliases, demandScore: skill.demandScore },
        });
    }
    console.log(`  ✅ Đã seed ${SKILL_TAXONOMY.length} kỹ năng.`);

    // 1. Tạo 200 Người dùng (Candidates & Recruiters) -> Đạt chuẩn số lượng tối thiểu
    const users: any[] = [];
    const recruiterCompanies: any[] = [];
    console.log('- Đang sinh 200 bản ghi Người dùng...');

    for (let i = 0; i < 205; i++) {
        const isCandidate = i < 180; // 180 ứng viên, 25 nhà tuyển dụng
        const topikLevels = [TopikLevel.TOPIK_II_LEVEL_3, TopikLevel.TOPIK_II_LEVEL_4, TopikLevel.TOPIK_II_LEVEL_5, TopikLevel.TOPIK_II_LEVEL_6];

        // Tạo User account trước
        const user = await prisma.user.create({
            data: {
                email: faker.internet.email(),
                passwordHash: '$2b$10$placeholderHashForSeedData000000000000000000000000000',
                role: isCandidate ? Role.candidate : Role.recruiter,
            }
        });

        if (isCandidate) {
            // Tạo JobUser profile cho candidate (kèm vector AI sinh từ hồ sơ)
            const topikLevel = faker.helpers.arrayElement(topikLevels);
            const skillsExtracted = faker.helpers.arrayElements(VIETNAMESE_IT_KOREAN_SKILLS, { min: 3, max: 6 });
            const yearsExperience = faker.number.float({ min: 0.5, max: 6, multipleOf: 0.5 });
            const profileText = `Kỹ năng: ${skillsExtracted.join(', ')}. Trình độ tiếng Hàn: ${topikLevel}. Kinh nghiệm: ${yearsExperience} năm.`;

            const jobUser = await prisma.jobUser.create({
                data: {
                    userId: user.id,
                    fullName: faker.person.fullName(),
                    topikLevel,
                    koreanScore: faker.number.int({ min: 140, max: 280 }),
                    isBrSE: faker.datatype.boolean(0.6),
                    skillsExtracted,
                    skillsVector: await getEmbeddingString(profileText),
                    yearsExperience,
                    desiredSalaryMin: faker.number.int({ min: 15000000, max: 30000000 }),
                    desiredSalaryMax: faker.number.int({ min: 35000000, max: 70000000 }),
                    jobTypePrefs: faker.helpers.arrayElement([JobType.fulltime, JobType.hybrid, JobType.remote]),
                    locationPrefs: [faker.helpers.arrayElement(['Hà Nội', 'Đà Nẵng', 'Hồ Chí Minh', 'Seoul', 'Remote'])],
                    profileCompleteness: faker.number.float({ min: 0.6, max: 1.0, multipleOf: 0.1 })
                }
            });
            users.push(jobUser);
        } else {
            // Tạo Company profile cho recruiter
            const company = await prisma.company.create({
                data: {
                    userId: user.id,
                    companyName: faker.helpers.arrayElement(KOREAN_NAMES) + ' IT Solutions',
                    industry: 'Information Technology',
                    companySize: faker.helpers.arrayElement(['1-50', '51-200', '201-500', '500+']),
                    location: faker.helpers.arrayElement(['Hà Nội', 'Hồ Chí Minh', 'Seoul']),
                    isVerified: faker.datatype.boolean(0.7),
                }
            });
            recruiterCompanies.push(company);
        }
    }

    // 2. Tạo 500 Tin tuyển dụng -> Đạt chuẩn số lượng tối thiểu
    const jobs: any[] = [];
    console.log('- Đang sinh 500 bản ghi Tin tuyển dụng...');

    for (let i = 0; i < 510; i++) {
        const title = faker.helpers.arrayElement(JOB_TITLES);
        const description = faker.helpers.arrayElement(JOB_DESCRIPTIONS);

        const job = await prisma.jobPosting.create({
            data: {
                companyId: recruiterCompanies.length > 0
                    ? faker.helpers.arrayElement(recruiterCompanies).companyId
                    : faker.string.uuid(),
                title,
                description,
                // Vector ngữ nghĩa của JD — cache nên chỉ tính 1 lần cho mỗi cặp title/description
                jdEmbedding: await getEmbeddingString(`${title}. Yêu cầu: ${description}`),
                minTopikRequired: faker.helpers.arrayElement([TopikLevel.TOPIK_II_LEVEL_3, TopikLevel.TOPIK_II_LEVEL_4, TopikLevel.TOPIK_II_LEVEL_5]),
                requiredSkills: faker.helpers.arrayElements(VIETNAMESE_IT_KOREAN_SKILLS, { min: 2, max: 4 }),
                preferredSkills: [faker.helpers.arrayElement(VIETNAMESE_IT_KOREAN_SKILLS)],
                salaryMin: faker.number.int({ min: 12000000, max: 25000000 }),
                salaryMax: faker.number.int({ min: 30000000, max: 60000000 }),
                jobType: faker.helpers.arrayElement([JobType.fulltime, JobType.hybrid, JobType.remote]),
                experienceYearsMin: faker.number.int({ min: 0, max: 3 }),
                location: faker.helpers.arrayElement(['Hà Nội (Cầu Giấy)', 'Hà Nội (Nam Từ Liêm)', 'Hồ Chí Minh', 'Seoul']),
                applicationDeadline: faker.date.future({ years: 0.5 }),
                status: JobStatus.active,
                viewsCount: faker.number.int({ min: 10, max: 500 }),
                applyCount: faker.number.int({ min: 0, max: 40 })
            }
        });
        jobs.push(job);
    }

    // 3. Tạo Đơn ứng tuyển (Applications)
    console.log('- Đang sinh các bản ghi Đơn ứng tuyển...');
    // Mảng `users` chỉ chứa các JobUser (profile ứng viên) nên dùng trực tiếp,
    // không lọc theo `role` vì JobUser không có trường này (role nằm ở bảng User)
    const candidates = users;

    // Thứ tự TOPIK để tính điểm tiếng Hàn giống logic apply thật trong job-applications.service
    const TOPIK_ORDER: Record<string, number> = {
        NONE: 0, TOPIK_I_LEVEL_1: 1, TOPIK_I_LEVEL_2: 2,
        TOPIK_II_LEVEL_3: 3, TOPIK_II_LEVEL_4: 4, TOPIK_II_LEVEL_5: 5, TOPIK_II_LEVEL_6: 6,
    };

    for (let i = 0; i < 250; i++) {
        const randomCandidate = faker.helpers.arrayElement(candidates);
        const randomJob = faker.helpers.arrayElement(jobs);

        // Tính matchScore thật từ hồ sơ (IT 50%, Korean 30%, Experience 20%)
        const candidateSkills: string[] = randomCandidate.skillsExtracted.map((s: string) => s.toLowerCase());
        const requiredSkills: string[] = randomJob.requiredSkills || [];
        const itSkill = requiredSkills.length > 0
            ? requiredSkills.filter((s) => candidateSkills.includes(s.toLowerCase())).length / requiredSkills.length
            : 1.0;
        const requiredTopik = TOPIK_ORDER[randomJob.minTopikRequired] ?? 0;
        const koreanSkill = requiredTopik <= 0
            ? 1.0
            : Math.min((TOPIK_ORDER[randomCandidate.topikLevel] ?? 0) / requiredTopik, 1.0);
        const expMin = randomJob.experienceYearsMin || 0;
        const experience = expMin > 0 && randomCandidate.yearsExperience
            ? Math.min(randomCandidate.yearsExperience / expMin, 1.0)
            : 1.0;
        const matchScore = Math.round((itSkill * 0.5 + koreanSkill * 0.3 + experience * 0.2) * 100) / 100;

        await prisma.jobApplication.create({
            data: {
                jobId: randomJob.jobId,
                candidateId: randomCandidate.userId,
                matchScore,
                matchBreakdownJson: {
                    it_skill: Math.round(itSkill * 100) / 100,
                    korean_skill: Math.round(koreanSkill * 100) / 100,
                    experience: Math.round(experience * 100) / 100
                },
                status: faker.helpers.arrayElement([ApplicationStatus.applied, ApplicationStatus.screening, ApplicationStatus.interview]),
                coverLetter: '안녕하세요, 저는 한국어 BrSE 포지션에 지원하고자 합니다. 잘 부탁드립니다.',
                stageTimestamps: { applied: new Date().toISOString() }
            }
        });
    }

    // 4. Tạo 1.000 Sự kiện tương tác (Career Events) -> Đạt chuẩn số lượng tối thiểu và lịch sử tương tác
    console.log('- Đang sinh 1000 bản ghi Log hành vi tương tác lịch sử...');

    for (let i = 0; i < 1050; i++) {
        const randomCandidate = faker.helpers.arrayElement(candidates);
        const randomJob = faker.helpers.arrayElement(jobs);

        await prisma.careerEvent.create({
            data: {
                userId: randomCandidate.userId,
                eventType: faker.helpers.arrayElement([EventType.view_job, EventType.search, EventType.apply, EventType.skill_add]),
                jobId: randomJob.jobId,
                searchQuery: faker.helpers.arrayElement(['BrSE', 'Tiếng Hàn Cầu Nối', 'Java Developer', 'TOPIK 5', 'FPT Korea']),
                clickPosition: faker.number.int({ min: 1, max: 10 }),
                timeSpentSeconds: faker.number.int({ min: 5, max: 300 }),
                deviceType: faker.helpers.arrayElement(['Desktop', 'Mobile', 'Tablet']),
                createdAt: faker.date.past({ years: 0.25 }) // Trải dài lịch sử tương tác 3 tháng gần nhất để huấn luyện AI
            }
        });
    }

    console.log('🎉 Quá trình seeding hoàn tất thành công rực rỡ!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });