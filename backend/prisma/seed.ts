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

async function main() {
    console.log('🌱 Bắt đầu quá trình seeding dữ liệu...');

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
            // Tạo JobUser profile cho candidate
            const jobUser = await prisma.jobUser.create({
                data: {
                    userId: user.id,
                    fullName: faker.person.fullName(),
                    topikLevel: faker.helpers.arrayElement(topikLevels),
                    koreanScore: faker.number.int({ min: 140, max: 280 }),
                    isBrSE: faker.datatype.boolean(0.6),
                    skillsExtracted: faker.helpers.arrayElements(VIETNAMESE_IT_KOREAN_SKILLS, { min: 3, max: 6 }),
                    yearsExperience: faker.number.float({ min: 0.5, max: 6, multipleOf: 0.5 }),
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
        const job = await prisma.jobPosting.create({
            data: {
                companyId: recruiterCompanies.length > 0 
                    ? faker.helpers.arrayElement(recruiterCompanies).companyId 
                    : faker.string.uuid(),
                title: faker.helpers.arrayElement(JOB_TITLES),
                description: faker.helpers.arrayElement(JOB_DESCRIPTIONS),
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
    const candidates = users.filter(u => u.role === Role.candidate);

    for (let i = 0; i < 250; i++) {
        const randomCandidate = faker.helpers.arrayElement(candidates);
        const randomJob = faker.helpers.arrayElement(jobs);

        await prisma.jobApplication.create({
            data: {
                jobId: randomJob.jobId,
                candidateId: randomCandidate.userId,
                matchScore: faker.number.float({ min: 0.5, max: 0.95, multipleOf: 0.01 }),
                matchBreakdownJson: {
                    it_skill: faker.number.float({ min: 0.6, max: 1.0 }),
                    korean_skill: faker.number.float({ min: 0.7, max: 1.0 }),
                    experience: faker.number.float({ min: 0.5, max: 1.0 })
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