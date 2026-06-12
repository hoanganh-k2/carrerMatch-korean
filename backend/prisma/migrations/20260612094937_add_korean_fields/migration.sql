-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "business_registration_number" TEXT,
ADD COLUMN     "company_country" TEXT NOT NULL DEFAULT 'South Korea',
ADD COLUMN     "korean_company_name" TEXT;

-- AlterTable
ALTER TABLE "interviews" ADD COLUMN     "interpreter_needed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "interview_language" TEXT;

-- AlterTable
ALTER TABLE "job_postings" ADD COLUMN     "interview_language" TEXT,
ADD COLUMN     "is_remote_from_vietnam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sponsorship_offered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "target_role" TEXT;

-- AlterTable
ALTER TABLE "job_users" ADD COLUMN     "brse_experience_years" DOUBLE PRECISION,
ADD COLUMN     "korean_work_experience_years" DOUBLE PRECISION,
ADD COLUMN     "target_korean_role" TEXT;
