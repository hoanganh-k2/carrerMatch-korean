-- CreateEnum
CREATE TYPE "Role" AS ENUM ('candidate', 'recruiter', 'admin');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('fulltime', 'parttime', 'remote', 'hybrid');

-- CreateEnum
CREATE TYPE "TopikLevel" AS ENUM ('TOPIK_I_LEVEL_1', 'TOPIK_I_LEVEL_2', 'TOPIK_II_LEVEL_3', 'TOPIK_II_LEVEL_4', 'TOPIK_II_LEVEL_5', 'TOPIK_II_LEVEL_6', 'NONE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('active', 'paused', 'filled', 'expired');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('applied', 'screening', 'interview', 'offer', 'rejected', 'accepted');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('view_job', 'search', 'apply', 'save', 'profile_update', 'skill_add');

-- CreateTable
CREATE TABLE "job_users" (
    "user_id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'candidate',
    "full_name" TEXT NOT NULL,
    "topik_level" "TopikLevel" NOT NULL DEFAULT 'NONE',
    "korean_score" INTEGER,
    "is_brse" BOOLEAN NOT NULL DEFAULT false,
    "skills_vector" TEXT,
    "skills_extracted" TEXT[],
    "years_experience" DOUBLE PRECISION,
    "desired_salary_min" INTEGER,
    "desired_salary_max" INTEGER,
    "job_type_prefs" "JobType" NOT NULL DEFAULT 'fulltime',
    "location_prefs" TEXT[],
    "open_to_work" BOOLEAN NOT NULL DEFAULT true,
    "profile_completeness" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "job_users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "job_postings" (
    "job_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "jd_embedding" TEXT,
    "min_topik_required" "TopikLevel" NOT NULL DEFAULT 'NONE',
    "required_skills" TEXT[],
    "preferred_skills" TEXT[],
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "job_type" "JobType" NOT NULL,
    "experience_years_min" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "location" TEXT NOT NULL,
    "application_deadline" TIMESTAMP(3) NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'active',
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "apply_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "job_postings_pkey" PRIMARY KEY ("job_id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "application_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "match_score" DOUBLE PRECISION NOT NULL,
    "match_breakdown_json" JSONB NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'applied',
    "cover_letter" TEXT,
    "recruiter_note" TEXT,
    "recruiter_rating" INTEGER,
    "stage_timestamps" JSONB NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("application_id")
);

-- CreateTable
CREATE TABLE "skill_taxonomy" (
    "skill_id" TEXT NOT NULL,
    "skill_name" TEXT NOT NULL,
    "skill_embedding" TEXT,
    "category" TEXT NOT NULL,
    "parent_skill_id" TEXT,
    "aliases" TEXT[],
    "demand_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "skill_taxonomy_pkey" PRIMARY KEY ("skill_id")
);

-- CreateTable
CREATE TABLE "career_events" (
    "event_id" BIGSERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" "EventType" NOT NULL,
    "job_id" TEXT,
    "search_query" TEXT,
    "search_filters_json" JSONB,
    "click_position" INTEGER,
    "time_spent_seconds" INTEGER,
    "device_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_taxonomy_skill_name_key" ON "skill_taxonomy"("skill_name");

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("job_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "job_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_taxonomy" ADD CONSTRAINT "skill_taxonomy_parent_skill_id_fkey" FOREIGN KEY ("parent_skill_id") REFERENCES "skill_taxonomy"("skill_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_events" ADD CONSTRAINT "career_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "job_users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_events" ADD CONSTRAINT "career_events_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_postings"("job_id") ON DELETE SET NULL ON UPDATE CASCADE;
