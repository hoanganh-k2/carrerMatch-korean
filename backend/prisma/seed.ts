import 'dotenv/config';
import { PrismaClient, Role, JobType, TopikLevel, JobStatus, ApplicationStatus, EventType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

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

// ==================== TÀI KHOẢN ĐĂNG NHẬP MẪU ====================
// Mật khẩu dùng chung cho mọi tài khoản seed để dễ đăng nhập thử nghiệm.
const DEFAULT_PASSWORD = 'Password@123';
const ADMIN_EMAIL = 'admin@kbridge.com';
const ADMIN_PASSWORD = 'Admin@123456';

// ==================== DANH SÁCH CÔNG TY THẬT ====================
// Mix giữa công ty Việt Nam gia công cho thị trường Hàn và công ty Hàn Quốc.
// logo: dùng icon.horse theo domain (URL tuyệt đối → getUploadedFileUrl giữ nguyên,
// luôn có ảnh fallback nếu domain không có favicon). Clearbit Logo API đã ngừng hoạt động.
const logoFor = (domain: string) => `https://icon.horse/icon/${domain}`;
type SeedCompany = {
  name: string;
  koreanName?: string;
  domain: string;
  website: string;
  industry: string;
  size: '1-50' | '51-200' | '201-500' | '500+';
  location: string;
  country: 'Vietnam' | 'South Korea';
  brn?: string; // 사업자등록번호 cho công ty Hàn
  verified: boolean;
  description: string;
};

const COMPANIES: SeedCompany[] = [
  // ----- Công ty Việt Nam tuyển IT tiếng Hàn -----
  {
    name: 'FPT Software', domain: 'fptsoftware.com', website: 'https://www.fptsoftware.com',
    industry: 'Gia công phần mềm (Software Outsourcing)', size: '500+', location: 'Hà Nội', country: 'Vietnam', verified: true,
    description: 'Công ty xuất khẩu phần mềm lớn nhất Việt Nam với chi nhánh FPT Korea tại Seoul. Tuyển BrSE, COMTOR và kỹ sư phần mềm làm việc trực tiếp với khách hàng Hàn Quốc trong các dự án tài chính, sản xuất, viễn thông.',
  },
  {
    name: 'CMC Global', domain: 'cmcglobal.com.vn', website: 'https://cmcglobal.com.vn',
    industry: 'Gia công phần mềm (Software Outsourcing)', size: '500+', location: 'Hà Nội', country: 'Vietnam', verified: true,
    description: 'Thành viên Tập đoàn công nghệ CMC, cung cấp dịch vụ phát triển phần mềm cho thị trường Nhật - Hàn. Có Korea Business Unit chuyên trách các dự án cho đối tác Hàn Quốc.',
  },
  {
    name: 'NTQ Solution', domain: 'ntq.com.vn', website: 'https://ntq.com.vn',
    industry: 'Gia công phần mềm (Software Outsourcing)', size: '201-500', location: 'Hà Nội', country: 'Vietnam', verified: true,
    description: 'Doanh nghiệp công nghệ với văn phòng NTQ Korea, đối tác chiến lược của nhiều startup và tập đoàn Hàn Quốc. Thế mạnh về Web, Mobile, Blockchain và AI.',
  },
  {
    name: 'VMO Holdings', domain: 'vmogroup.com', website: 'https://vmogroup.com',
    industry: 'Gia công phần mềm (Software Outsourcing)', size: '201-500', location: 'Hà Nội', country: 'Vietnam', verified: true,
    description: 'Cung cấp giải pháp công nghệ và đội ngũ kỹ sư cho khách hàng Nhật Bản, Hàn Quốc, Mỹ. Tuyển dụng kỹ sư cầu nối và lập trình viên biết tiếng Hàn.',
  },
  {
    name: 'Rikkeisoft', domain: 'rikkeisoft.com', website: 'https://rikkeisoft.com',
    industry: 'Gia công phần mềm (Software Outsourcing)', size: '500+', location: 'Hà Nội', country: 'Vietnam', verified: true,
    description: 'Một trong những công ty công nghệ phát triển nhanh nhất Việt Nam, mở rộng mạnh sang thị trường Hàn Quốc với các dự án Cloud, AI và chuyển đổi số.',
  },
  {
    name: 'KMS Technology', domain: 'kms-technology.com', website: 'https://kms-technology.com',
    industry: 'Phần mềm & Dịch vụ IT', size: '500+', location: 'Hồ Chí Minh', country: 'Vietnam', verified: true,
    description: 'Công ty phát triển sản phẩm và dịch vụ phần mềm chất lượng cao, hợp tác với nhiều khách hàng quốc tế gồm cả các doanh nghiệp Hàn Quốc.',
  },
  {
    name: 'Luvina Software', domain: 'luvina.net', website: 'https://luvina.net',
    industry: 'Gia công phần mềm (Software Outsourcing)', size: '201-500', location: 'Hà Nội', country: 'Vietnam', verified: false,
    description: 'Chuyên gia công phần mềm cho thị trường Nhật - Hàn hơn 15 năm. Môi trường đào tạo tiếng Hàn và tiếng Nhật cho kỹ sư mới ra trường.',
  },
  {
    name: 'SmartOSC', domain: 'smartosc.com', website: 'https://www.smartosc.com',
    industry: 'Thương mại điện tử & Dịch vụ IT', size: '500+', location: 'Hà Nội', country: 'Vietnam', verified: true,
    description: 'Đối tác triển khai thương mại điện tử hàng đầu khu vực, có khách hàng tại Hàn Quốc. Tuyển dev Magento, Frontend và QA biết tiếng Hàn.',
  },

  // ----- Công ty Hàn Quốc (R&D tại VN hoặc HQ tại Hàn) -----
  {
    name: 'Samsung SDS Vietnam', koreanName: '삼성에스디에스', domain: 'samsungsds.com', website: 'https://www.samsungsds.com',
    industry: 'Phần mềm & Dịch vụ IT', size: '500+', location: 'Hà Nội', country: 'South Korea', brn: '220-81-09945', verified: true,
    description: 'Công ty IT của Tập đoàn Samsung, cung cấp giải pháp Cloud, Logistics và Enterprise. Trung tâm phát triển tại Việt Nam tuyển kỹ sư phối hợp với trụ sở Seoul.',
  },
  {
    name: 'Samsung Vietnam Mobile R&D (SVMC)', koreanName: '삼성전자', domain: 'samsung.com', website: 'https://www.samsung.com',
    industry: 'Điện tử & Sản xuất', size: '500+', location: 'Hà Nội', country: 'South Korea', brn: '124-81-00998', verified: true,
    description: 'Trung tâm Nghiên cứu & Phát triển di động lớn nhất của Samsung ngoài Hàn Quốc. Phát triển phần mềm cho thiết bị Galaxy, làm việc song ngữ Hàn - Anh.',
  },
  {
    name: 'LG CNS Vietnam', koreanName: '엘지씨엔에스', domain: 'lgcns.com', website: 'https://www.lgcns.com',
    industry: 'Phần mềm & Dịch vụ IT', size: '500+', location: 'Hà Nội', country: 'South Korea', brn: '104-81-37930', verified: true,
    description: 'Công ty tư vấn và tích hợp hệ thống của Tập đoàn LG. Triển khai dự án Smart Factory, Smart City cho khách hàng Hàn Quốc và toàn cầu.',
  },
  {
    name: 'LG Electronics Development Vietnam', koreanName: '엘지전자', domain: 'lg.com', website: 'https://www.lg.com',
    industry: 'Điện tử & Sản xuất', size: '500+', location: 'Hải Phòng', country: 'South Korea', brn: '107-86-14075', verified: true,
    description: 'Trung tâm R&D phần mềm nhúng cho thiết bị điện tử LG (TV, ô tô, gia dụng). Yêu cầu giao tiếp kỹ thuật bằng tiếng Hàn với đội ngũ tại Seoul.',
  },
  {
    name: 'NAVER', koreanName: '네이버', domain: 'navercorp.com', website: 'https://www.navercorp.com',
    industry: 'Internet & Nền tảng', size: '500+', location: 'Seoul', country: 'South Korea', brn: '220-81-62517', verified: true,
    description: 'Tập đoàn Internet số 1 Hàn Quốc, sở hữu công cụ tìm kiếm Naver và LINE. Tuyển kỹ sư backend, AI làm việc tại Seoul, hỗ trợ visa cho ứng viên Việt Nam.',
  },
  {
    name: 'Kakao', koreanName: '카카오', domain: 'kakaocorp.com', website: 'https://www.kakaocorp.com',
    industry: 'Internet & Nền tảng', size: '500+', location: 'Seoul', country: 'South Korea', brn: '120-81-47521', verified: true,
    description: 'Công ty vận hành KakaoTalk - ứng dụng nhắn tin quốc dân Hàn Quốc. Phát triển dịch vụ fintech, mobility, nội dung số. Môi trường làm việc tiếng Hàn.',
  },
  {
    name: 'Coupang', koreanName: '쿠팡', domain: 'coupang.com', website: 'https://www.coupang.com',
    industry: 'Thương mại điện tử', size: '500+', location: 'Seoul', country: 'South Korea', brn: '120-88-00767', verified: true,
    description: 'Nền tảng thương mại điện tử lớn nhất Hàn Quốc ("Amazon của Hàn Quốc"). Tuyển kỹ sư phần mềm quy mô lớn, ưu tiên ứng viên biết tiếng Hàn hoặc tiếng Anh tốt.',
  },
  {
    name: 'NCSOFT', koreanName: '엔씨소프트', domain: 'ncsoft.com', website: 'https://kr.ncsoft.com',
    industry: 'Game', size: '500+', location: 'Seoul', country: 'South Korea', brn: '220-81-58867', verified: false,
    description: 'Hãng game hàng đầu Hàn Quốc (Lineage, Blade & Soul). Tuyển lập trình viên game client/server, yêu cầu tiếng Hàn để phối hợp với đội ngũ phát triển.',
  },
  {
    name: 'Lotte Data Communication', koreanName: '롯데정보통신', domain: 'ldcc.co.kr', website: 'https://www.ldcc.co.kr',
    industry: 'Phần mềm & Dịch vụ IT', size: '201-500', location: 'Seoul', country: 'South Korea', brn: '214-81-44848', verified: true,
    description: 'Công ty IT của Tập đoàn Lotte, triển khai hệ thống bán lẻ, thanh toán và Smart Retail cho các thương hiệu thuộc Lotte tại Hàn Quốc và Việt Nam.',
  },
  {
    name: 'Shinhan DS', koreanName: '신한디에스', domain: 'shinhan.com', website: 'https://www.shinhan.com',
    industry: 'Tài chính - Ngân hàng', size: '201-500', location: 'Seoul', country: 'South Korea', brn: '202-81-00193', verified: true,
    description: 'Công ty công nghệ thông tin của Tập đoàn tài chính Shinhan. Phát triển hệ thống core banking, mobile banking; tuyển kỹ sư biết tiếng Hàn cho dự án tại Việt Nam và Hàn Quốc.',
  },
];

// ==================== MẪU TIN TUYỂN DỤNG (THEO VAI TRÒ) ====================
type JobTemplate = {
  role: string;
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minTopik: TopikLevel;
  jobType: JobType;
  salaryMin: number;
  salaryMax: number;
  expMin: number;
};

const JOB_TEMPLATES: JobTemplate[] = [
  {
    role: 'BRSE', title: 'Kỹ sư cầu nối BrSE Tiếng Hàn (TOPIK 5+)',
    description: 'Làm cầu nối giữa đội phát triển tại Việt Nam và khách hàng Hàn Quốc: dịch tài liệu spec, làm rõ yêu cầu, quản lý tiến độ và chất lượng dự án. Yêu cầu tiếng Hàn thương mại thành thạo và hiểu quy trình phát triển phần mềm.',
    requiredSkills: ['BrSE', 'Korean', 'Business Korean', 'Agile'], preferredSkills: ['Java', 'Jira'],
    minTopik: TopikLevel.TOPIK_II_LEVEL_5, jobType: JobType.fulltime, salaryMin: 30000000, salaryMax: 55000000, expMin: 2,
  },
  {
    role: 'COMTOR', title: 'Phiên dịch viên IT (COMTOR) Tiếng Hàn',
    description: 'Phiên dịch các buổi họp kỹ thuật, dịch tài liệu và hỗ trợ giao tiếp giữa kỹ sư Việt Nam và chuyên gia Hàn Quốc. Ưu tiên ứng viên có nền tảng CNTT và tiếng Hàn tốt.',
    requiredSkills: ['COMTOR', 'Korean', 'Technical Interpretation'], preferredSkills: ['Business Korean'],
    minTopik: TopikLevel.TOPIK_II_LEVEL_5, jobType: JobType.fulltime, salaryMin: 18000000, salaryMax: 35000000, expMin: 1,
  },
  {
    role: 'Backend', title: 'Senior Java/Spring Boot Developer (Dự án Hàn Quốc)',
    description: 'Phát triển và bảo trì hệ thống backend bằng Java/Spring Boot cho khách hàng Hàn Quốc. Thiết kế API, tối ưu cơ sở dữ liệu, thảo luận trực tiếp với Tech Lead người Hàn.',
    requiredSkills: ['Java', 'Spring Boot', 'PostgreSQL'], preferredSkills: ['Korean', 'Docker', 'AWS'],
    minTopik: TopikLevel.TOPIK_II_LEVEL_3, jobType: JobType.fulltime, salaryMin: 25000000, salaryMax: 50000000, expMin: 3,
  },
  {
    role: 'Frontend', title: 'Frontend Engineer (React/TypeScript)',
    description: 'Xây dựng giao diện web hiện đại với React và TypeScript, phối hợp với designer và backend. Biết tiếng Hàn giao tiếp là lợi thế lớn khi làm việc với product owner Hàn Quốc.',
    requiredSkills: ['React', 'TypeScript', 'JavaScript'], preferredSkills: ['Korean', 'Next.js'],
    minTopik: TopikLevel.TOPIK_II_LEVEL_3, jobType: JobType.hybrid, salaryMin: 18000000, salaryMax: 40000000, expMin: 1,
  },
  {
    role: 'Fullstack', title: 'Fullstack Developer (Node.js + React)',
    description: 'Phát triển sản phẩm web end-to-end với Node.js/NestJS và React. Tham gia toàn bộ vòng đời sản phẩm cùng đội ngũ đa quốc gia Việt - Hàn.',
    requiredSkills: ['Node.js', 'React', 'TypeScript', 'MySQL'], preferredSkills: ['Korean', 'Docker'],
    minTopik: TopikLevel.TOPIK_II_LEVEL_3, jobType: JobType.fulltime, salaryMin: 22000000, salaryMax: 45000000, expMin: 2,
  },
  {
    role: 'Mobile', title: 'Mobile Developer (React Native)',
    description: 'Phát triển ứng dụng di động đa nền tảng bằng React Native cho thị trường Hàn Quốc. Tối ưu hiệu năng, tích hợp API và phối hợp release theo lịch của khách hàng.',
    requiredSkills: ['React Native', 'JavaScript', 'TypeScript'], preferredSkills: ['Korean'],
    minTopik: TopikLevel.TOPIK_II_LEVEL_3, jobType: JobType.fulltime, salaryMin: 20000000, salaryMax: 42000000, expMin: 2,
  },
  {
    role: 'QA', title: 'QA/QC Engineer (Ngôn ngữ làm việc Hàn - Việt)',
    description: 'Lập kế hoạch và thực thi kiểm thử cho các dự án phần mềm Hàn Quốc, viết test case, báo cáo lỗi và đảm bảo chất lượng. Đọc hiểu tài liệu tiếng Hàn là yêu cầu cần thiết.',
    requiredSkills: ['QA Testing', 'Korean', 'Jira'], preferredSkills: ['Agile', 'Technical Korean'],
    minTopik: TopikLevel.TOPIK_II_LEVEL_4, jobType: JobType.fulltime, salaryMin: 15000000, salaryMax: 32000000, expMin: 1,
  },
  {
    role: 'DevOps', title: 'DevOps Engineer (AWS/Kubernetes)',
    description: 'Xây dựng và vận hành hạ tầng CI/CD, container hóa với Docker/Kubernetes trên AWS. Hỗ trợ các đội phát triển dự án cho khách hàng Hàn Quốc.',
    requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'Linux'], preferredSkills: ['Korean'],
    minTopik: TopikLevel.NONE, jobType: JobType.fulltime, salaryMin: 28000000, salaryMax: 55000000, expMin: 3,
  },
  {
    role: 'PM', title: 'IT Project Manager / PMO (Korean Speaking)',
    description: 'Quản lý dự án phần mềm với khách hàng Hàn Quốc: lập kế hoạch, kiểm soát tiến độ, rủi ro và ngân sách. Báo cáo trực tiếp bằng tiếng Hàn với stakeholder phía Hàn.',
    requiredSkills: ['Agile', 'Korean', 'Business Korean', 'Jira'], preferredSkills: ['BrSE'],
    minTopik: TopikLevel.TOPIK_II_LEVEL_5, jobType: JobType.fulltime, salaryMin: 35000000, salaryMax: 70000000, expMin: 5,
  },
  {
    role: 'BA', title: 'IT Business Analyst (Korean Speaking)',
    description: 'Thu thập và phân tích yêu cầu nghiệp vụ từ khách hàng Hàn Quốc, viết tài liệu đặc tả và phối hợp với đội phát triển. Yêu cầu giao tiếp tiếng Hàn thương mại tốt.',
    requiredSkills: ['Korean', 'Business Korean', 'Technical Documentation'], preferredSkills: ['Agile', 'Jira'],
    minTopik: TopikLevel.TOPIK_II_LEVEL_4, jobType: JobType.hybrid, salaryMin: 20000000, salaryMax: 42000000, expMin: 2,
  },
  {
    role: 'Data', title: 'Data Engineer (Python/SQL)',
    description: 'Xây dựng pipeline dữ liệu, ETL và data warehouse phục vụ phân tích cho sản phẩm tại thị trường Hàn Quốc. Làm việc với Python, SQL và các nền tảng cloud.',
    requiredSkills: ['Python', 'PostgreSQL', 'AWS'], preferredSkills: ['Korean', 'Docker'],
    minTopik: TopikLevel.NONE, jobType: JobType.fulltime, salaryMin: 25000000, salaryMax: 50000000, expMin: 2,
  },
  {
    role: 'DotNet', title: '.NET Developer (C#/ASP.NET)',
    description: 'Phát triển hệ thống doanh nghiệp bằng C# và .NET cho khách hàng Hàn Quốc trong lĩnh vực tài chính, bán lẻ. Tham gia phân tích, thiết kế và triển khai.',
    requiredSkills: ['C#', '.NET', 'MySQL'], preferredSkills: ['Korean', 'Azure'],
    minTopik: TopikLevel.TOPIK_II_LEVEL_3, jobType: JobType.fulltime, salaryMin: 20000000, salaryMax: 43000000, expMin: 2,
  },
  {
    role: 'Junior', title: 'Junior Developer - Đào tạo Tiếng Hàn (Fresher chào đón)',
    description: 'Vị trí dành cho lập trình viên mới ra trường yêu thích tiếng Hàn. Được đào tạo lộ trình trở thành BrSE/COMTOR, tham gia dự án thực tế cùng mentor.',
    requiredSkills: ['Java', 'Korean'], preferredSkills: ['React', 'Business Korean'],
    minTopik: TopikLevel.TOPIK_II_LEVEL_3, jobType: JobType.fulltime, salaryMin: 12000000, salaryMax: 22000000, expMin: 0,
  },
  {
    role: 'Game', title: 'Game Client Developer (Unity/C++)',
    description: 'Phát triển game client hiệu năng cao bằng C++/Unity, phối hợp với đội thiết kế và server tại Hàn Quốc. Giao tiếp kỹ thuật bằng tiếng Hàn trong quy trình phát triển.',
    requiredSkills: ['C++', 'Korean'], preferredSkills: ['Technical Korean'],
    minTopik: TopikLevel.TOPIK_II_LEVEL_4, jobType: JobType.fulltime, salaryMin: 25000000, salaryMax: 55000000, expMin: 3,
  },
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

// Pool kỹ năng dùng để sinh hồ sơ ứng viên (khớp tên với SkillTaxonomy để matching chuẩn)
const CANDIDATE_SKILL_POOL = [
  'Java', 'Spring Boot', 'React', 'Node.js', 'TypeScript', 'JavaScript', 'PostgreSQL', 'MySQL',
  'Docker', 'AWS', 'Python', 'C#', '.NET', 'React Native', 'QA Testing', 'Agile', 'Jira',
  'BrSE', 'COMTOR', 'Business Korean', 'Technical Korean',
];

// ----- Sinh tên ứng viên Việt Nam thực tế -----
const VN_SURNAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Vũ', 'Võ', 'Phan', 'Trương', 'Bùi', 'Đặng', 'Đỗ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đào'];
const VN_MIDDLE = ['Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Thành', 'Quang', 'Ngọc', 'Thanh', 'Gia', 'Bảo', 'Khánh', 'Hải', 'Tuấn', 'Phương'];
const VN_GIVEN = ['Anh', 'Bình', 'Châu', 'Dũng', 'Duy', 'Giang', 'Hà', 'Hiếu', 'Hoa', 'Huy', 'Hương', 'Khoa', 'Lan', 'Linh', 'Long', 'Mai', 'Nam', 'Nga', 'Phong', 'Quân', 'Sơn', 'Thảo', 'Trang', 'Trung', 'Tú', 'Vy', 'Đạt', 'Hằng', 'Hùng', 'Quỳnh'];

function randomVietnameseName(): string {
  return `${faker.helpers.arrayElement(VN_SURNAMES)} ${faker.helpers.arrayElement(VN_MIDDLE)} ${faker.helpers.arrayElement(VN_GIVEN)}`;
}

function slugify(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // bỏ dấu tiếng Việt
    .replace(/đ/gi, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Địa điểm chi tiết theo thành phố cho tin tuyển dụng
const LOCATION_DETAIL: Record<string, string[]> = {
  'Hà Nội': ['Hà Nội (Cầu Giấy)', 'Hà Nội (Nam Từ Liêm)', 'Hà Nội (Thanh Xuân)', 'Hà Nội (Tây Hồ)'],
  'Hồ Chí Minh': ['Hồ Chí Minh (Quận 1)', 'Hồ Chí Minh (Quận 7)', 'Hồ Chí Minh (Thủ Đức)'],
  'Hải Phòng': ['Hải Phòng (Tràng Duệ)'],
  'Seoul': ['Seoul (Gangnam-gu)', 'Seoul (Jung-gu)', 'Seoul (Seocho-gu)', 'Pangyo (Seongnam)'],
};

function jobLocationFor(city: string): string {
  const details = LOCATION_DETAIL[city];
  return details ? faker.helpers.arrayElement(details) : city;
}

const REVIEW_TEXTS = [
  'Môi trường làm việc chuyên nghiệp, được tiếp xúc trực tiếp với khách hàng Hàn Quốc nên tiếng Hàn tiến bộ nhanh.',
  'Lương thưởng cạnh tranh, có phụ cấp tiếng Hàn. Quy trình phỏng vấn rõ ràng, HR phản hồi nhanh.',
  'Dự án đa dạng, đồng nghiệp hỗ trợ nhiệt tình. Áp lực tiến độ khá cao nhưng học được nhiều.',
  'Cơ hội onsite tại Hàn Quốc tốt, công ty hỗ trợ visa và chỗ ở. Văn hóa làm việc khá Hàn.',
  'Chế độ đào tạo BrSE bài bản, sếp người Hàn thân thiện. Phù hợp cho bạn mới muốn theo hướng cầu nối.',
  'Phúc lợi ổn, review lương 2 lần/năm. Mong công ty cải thiện thêm về cân bằng công việc - cuộc sống.',
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
  const output = await embedder(`query: ${text.replace(/\n/g, ' ')}`, { pooling: 'mean', normalize: true });
  const vectorString = JSON.stringify(Array.from(output.data));
  embeddingCache.set(text, vectorString);
  return vectorString;
}

const TOPIK_ORDER: Record<string, number> = {
  NONE: 0, TOPIK_I_LEVEL_1: 1, TOPIK_I_LEVEL_2: 2,
  TOPIK_II_LEVEL_3: 3, TOPIK_II_LEVEL_4: 4, TOPIK_II_LEVEL_5: 5, TOPIK_II_LEVEL_6: 6,
};

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

  // Hash mật khẩu (1 lần dùng chung) để mọi tài khoản seed đăng nhập được
  const defaultHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

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

  // 0b. Tài khoản ADMIN
  console.log('- Đang tạo tài khoản admin...');
  await prisma.user.create({
    data: { email: ADMIN_EMAIL, passwordHash: adminHash, role: Role.admin },
  });

  // 1. Tạo các công ty THẬT + tài khoản recruiter sở hữu
  console.log(`- Đang tạo ${COMPANIES.length} công ty thật + tài khoản recruiter...`);
  const recruiterCompanies: any[] = [];
  for (const c of COMPANIES) {
    const slug = slugify(c.name);
    const recruiter = await prisma.user.create({
      data: { email: `hr.${slug}@kbridge.com`, passwordHash: defaultHash, role: Role.recruiter },
    });
    const company = await prisma.company.create({
      data: {
        userId: recruiter.id,
        companyName: c.name,
        koreanCompanyName: c.koreanName ?? null,
        logoUrl: logoFor(c.domain),
        website: c.website,
        industry: c.industry,
        companySize: c.size,
        description: c.description,
        location: c.location,
        isVerified: c.verified,
        businessRegistrationNumber: c.brn ?? null,
        companyCountry: c.country,
      },
    });
    recruiterCompanies.push({ ...company, _city: c.location });
  }
  console.log(`  ✅ Đã tạo ${recruiterCompanies.length} công ty.`);

  // 2. Tạo ứng viên (JobUser) với tên Việt + hồ sơ thực tế
  const CANDIDATE_COUNT = 185; // tổng users ≈ 1 admin + 18 recruiter + 185 candidate ≈ 204
  console.log(`- Đang sinh ${CANDIDATE_COUNT} ứng viên (tên Việt + vector AI)...`);
  const candidates: any[] = [];
  const topikLevels = [TopikLevel.TOPIK_II_LEVEL_3, TopikLevel.TOPIK_II_LEVEL_4, TopikLevel.TOPIK_II_LEVEL_5, TopikLevel.TOPIK_II_LEVEL_6];

  for (let i = 0; i < CANDIDATE_COUNT; i++) {
    const fullName = randomVietnameseName();
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email({ firstName: slugify(fullName).replace(/-/g, '.'), provider: 'gmail.com' }).toLowerCase(),
        passwordHash: defaultHash,
        role: Role.candidate,
      },
    });

    const topikLevel = faker.helpers.arrayElement(topikLevels);
    // Hầu hết ứng viên đều có 'Korean' trong hồ sơ (đây là sàn việc IT tiếng Hàn)
    const otherSkills = faker.helpers.arrayElements(CANDIDATE_SKILL_POOL.filter((s) => s !== 'Korean'), { min: 3, max: 6 });
    const skillsExtracted = ['Korean', ...otherSkills];
    const yearsExperience = faker.number.float({ min: 0.5, max: 8, multipleOf: 0.5 });
    const profileText = `Kỹ năng: ${skillsExtracted.join(', ')}. Trình độ tiếng Hàn: ${topikLevel}. Kinh nghiệm: ${yearsExperience} năm.`;

    const jobUser = await prisma.jobUser.create({
      data: {
        userId: user.id,
        fullName,
        topikLevel,
        koreanScore: faker.number.int({ min: 140, max: 290 }),
        isBrSE: faker.datatype.boolean(0.45),
        skillsExtracted,
        skillsVector: await getEmbeddingString(profileText),
        yearsExperience,
        desiredSalaryMin: faker.number.int({ min: 15000000, max: 30000000 }),
        desiredSalaryMax: faker.number.int({ min: 35000000, max: 70000000 }),
        jobTypePrefs: faker.helpers.arrayElement([JobType.fulltime, JobType.hybrid, JobType.remote]),
        locationPrefs: faker.helpers.arrayElements(['Hà Nội', 'Đà Nẵng', 'Hồ Chí Minh', 'Seoul', 'Remote'], { min: 1, max: 2 }),
        targetKoreanRole: faker.helpers.arrayElement(['BRSE', 'COMTOR', 'SE', 'QA', 'PM']),
        openToWork: faker.datatype.boolean(0.85),
        profileCompleteness: faker.number.float({ min: 0.6, max: 1.0, multipleOf: 0.1 }),
      },
    });
    candidates.push(jobUser);
  }
  console.log(`  ✅ Đã tạo ${candidates.length} ứng viên.`);

  // 3. Tạo 500 tin tuyển dụng gắn với công ty thật
  const JOB_COUNT = 500;
  console.log(`- Đang sinh ${JOB_COUNT} tin tuyển dụng...`);
  const jobs: any[] = [];
  for (let i = 0; i < JOB_COUNT; i++) {
    const company = faker.helpers.arrayElement(recruiterCompanies);
    const tpl = faker.helpers.arrayElement(JOB_TEMPLATES);
    const cityPrefix = company._city ? `[${company._city}] ` : '';
    const title = `${cityPrefix}${tpl.title} - ${company.companyName}`;

    const job = await prisma.jobPosting.create({
      data: {
        companyId: company.companyId,
        title,
        description: tpl.description,
        // Embedding theo template (cache → chỉ tính 1 lần mỗi mẫu) để seed nhanh
        jdEmbedding: await getEmbeddingString(`${tpl.title}. ${tpl.description}`),
        minTopikRequired: tpl.minTopik,
        requiredSkills: tpl.requiredSkills,
        preferredSkills: tpl.preferredSkills,
        salaryMin: tpl.salaryMin,
        salaryMax: tpl.salaryMax,
        jobType: tpl.jobType,
        experienceYearsMin: tpl.expMin,
        location: jobLocationFor(company._city),
        applicationDeadline: faker.date.future({ years: 0.5 }),
        status: faker.helpers.weightedArrayElement([
          { weight: 8, value: JobStatus.active },
          { weight: 1, value: JobStatus.paused },
          { weight: 1, value: JobStatus.filled },
        ]),
        targetRole: tpl.role,
        interviewLanguage: faker.helpers.arrayElement(['Korean', 'English', 'Mixed']),
        sponsorshipOffered: company._city === 'Seoul' || faker.datatype.boolean(0.2),
        viewsCount: faker.number.int({ min: 10, max: 800 }),
        applyCount: faker.number.int({ min: 0, max: 50 }),
      },
    });
    jobs.push(job);
  }
  console.log(`  ✅ Đã tạo ${jobs.length} tin tuyển dụng.`);

  // 4. Tạo đơn ứng tuyển với matchScore tính thật từ hồ sơ
  const APPLICATION_COUNT = 320;
  console.log(`- Đang sinh ${APPLICATION_COUNT} đơn ứng tuyển...`);
  const appliedPairs = new Set<string>();
  let appCreated = 0;
  for (let i = 0; i < APPLICATION_COUNT; i++) {
    const cand = faker.helpers.arrayElement(candidates);
    const job = faker.helpers.arrayElement(jobs);
    const pairKey = `${cand.userId}:${job.jobId}`;
    if (appliedPairs.has(pairKey)) continue;
    appliedPairs.add(pairKey);

    const candidateSkills: string[] = cand.skillsExtracted.map((s: string) => s.toLowerCase());
    const requiredSkills: string[] = job.requiredSkills || [];
    const itSkill = requiredSkills.length > 0
      ? requiredSkills.filter((s) => candidateSkills.includes(s.toLowerCase())).length / requiredSkills.length
      : 1.0;
    const requiredTopik = TOPIK_ORDER[job.minTopikRequired] ?? 0;
    const koreanSkill = requiredTopik <= 0 ? 1.0 : Math.min((TOPIK_ORDER[cand.topikLevel] ?? 0) / requiredTopik, 1.0);
    const expMin = job.experienceYearsMin || 0;
    const experience = expMin > 0 && cand.yearsExperience ? Math.min(cand.yearsExperience / expMin, 1.0) : 1.0;
    const matchScore = Math.round((itSkill * 0.5 + koreanSkill * 0.3 + experience * 0.2) * 100) / 100;

    await prisma.jobApplication.create({
      data: {
        jobId: job.jobId,
        candidateId: cand.userId,
        matchScore,
        matchBreakdownJson: {
          it_skill: Math.round(itSkill * 100) / 100,
          korean_skill: Math.round(koreanSkill * 100) / 100,
          experience: Math.round(experience * 100) / 100,
        },
        status: faker.helpers.arrayElement([
          ApplicationStatus.applied, ApplicationStatus.screening, ApplicationStatus.interview,
          ApplicationStatus.offer, ApplicationStatus.rejected,
        ]),
        coverLetter: '안녕하세요, 저는 한국어 IT 포지션에 지원하고자 합니다. 잘 부탁드립니다.',
        stageTimestamps: { applied: faker.date.recent({ days: 30 }).toISOString() },
      },
    });
    appCreated++;
  }
  console.log(`  ✅ Đã tạo ${appCreated} đơn ứng tuyển.`);

  // 5. Đánh giá công ty (CompanyReview) để làm phong phú trang công ty
  console.log('- Đang sinh đánh giá công ty...');
  let reviewCount = 0;
  for (const company of recruiterCompanies) {
    const reviewers = faker.helpers.arrayElements(candidates, { min: 3, max: 6 });
    const usedCandidates = new Set<string>();
    for (const reviewer of reviewers) {
      if (usedCandidates.has(reviewer.userId)) continue;
      usedCandidates.add(reviewer.userId);
      await prisma.companyReview.create({
        data: {
          companyId: company.companyId,
          candidateId: reviewer.userId, // = User.id
          rating: faker.helpers.weightedArrayElement([
            { weight: 5, value: 5 }, { weight: 6, value: 4 }, { weight: 2, value: 3 }, { weight: 1, value: 2 },
          ]),
          reviewText: faker.helpers.arrayElement(REVIEW_TEXTS),
          isAnonymous: faker.datatype.boolean(0.4),
          createdAt: faker.date.past({ years: 1 }),
        },
      });
      reviewCount++;
    }
  }
  console.log(`  ✅ Đã tạo ${reviewCount} đánh giá công ty.`);

  // 6. Tin đã lưu (SavedJob)
  console.log('- Đang sinh tin đã lưu...');
  const savedPairs = new Set<string>();
  let savedCount = 0;
  for (let i = 0; i < 200; i++) {
    const cand = faker.helpers.arrayElement(candidates);
    const job = faker.helpers.arrayElement(jobs);
    const key = `${cand.userId}:${job.jobId}`;
    if (savedPairs.has(key)) continue;
    savedPairs.add(key);
    await prisma.savedJob.create({
      data: { userId: cand.userId, jobId: job.jobId, savedAt: faker.date.recent({ days: 20 }) },
    });
    savedCount++;
  }
  console.log(`  ✅ Đã tạo ${savedCount} tin đã lưu.`);

  // 7. Log hành vi (CareerEvent) cho AI/analytics
  const EVENT_COUNT = 1000;
  console.log(`- Đang sinh ${EVENT_COUNT} log hành vi...`);
  for (let i = 0; i < EVENT_COUNT; i++) {
    const cand = faker.helpers.arrayElement(candidates);
    const job = faker.helpers.arrayElement(jobs);
    await prisma.careerEvent.create({
      data: {
        userId: cand.userId,
        eventType: faker.helpers.arrayElement([EventType.view_job, EventType.search, EventType.apply, EventType.save, EventType.skill_add]),
        jobId: job.jobId,
        searchQuery: faker.helpers.arrayElement(['BrSE', 'Tiếng Hàn Cầu Nối', 'Java Developer', 'TOPIK 5', 'FPT Korea', 'Samsung SDS', 'COMTOR', 'React Hàn Quốc']),
        clickPosition: faker.number.int({ min: 1, max: 10 }),
        timeSpentSeconds: faker.number.int({ min: 5, max: 300 }),
        deviceType: faker.helpers.arrayElement(['Desktop', 'Mobile', 'Tablet']),
        createdAt: faker.date.past({ years: 0.25 }),
      },
    });
  }
  console.log(`  ✅ Đã tạo ${EVENT_COUNT} log hành vi.`);

  console.log('\n🎉 Seeding hoàn tất!');
  console.log('================ TÀI KHOẢN ĐĂNG NHẬP ================');
  console.log(`👑 Admin     : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`🏢 Recruiter : hr.${slugify(COMPANIES[0].name)}@kbridge.com / ${DEFAULT_PASSWORD}  (FPT Software)`);
  console.log(`   (mỗi công ty: hr.<slug-tên-công-ty>@kbridge.com)`);
  console.log(`🧑 Candidate : đăng nhập bằng email ứng viên bất kỳ / ${DEFAULT_PASSWORD}`);
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
