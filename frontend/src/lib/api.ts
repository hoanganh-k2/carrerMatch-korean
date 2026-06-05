const BASE_URL = 'http://localhost:3000';

export interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  requiredSkills: string[];
  minTopikRequired: string;
  similarityScore?: number;
}

export interface Candidate {
  userId: string;
  fullName: string;
  topikLevel: string;
  skillsExtracted: string[];
  yearsExperience: number;
}

// Normalize key formats from backend (supporting both snake_case and camelCase)
export const normalizeJob = (job: any): Job => {
  return {
    id: job.jobId ?? job.job_id,
    title: job.title,
    description: job.description,
    location: job.location,
    salaryMin: job.salaryMin ?? job.salary_min,
    salaryMax: job.salaryMax ?? job.salary_max,
    requiredSkills: job.requiredSkills ?? job.required_skills ?? [],
    minTopikRequired: job.minTopikRequired ?? job.min_topik_required,
    similarityScore: job.similarity_score,
  };
};

export async function fetchJobs(): Promise<Job[]> {
  const res = await fetch(`${BASE_URL}/job-postings`);
  if (!res.ok) throw new Error('Không thể kết nối đến máy chủ tuyển dụng');
  const data = await res.json();
  return data.map(normalizeJob);
}

export async function fetchCandidates(): Promise<Candidate[]> {
  const res = await fetch(`${BASE_URL}/job-users`);
  if (!res.ok) throw new Error('Không thể kết nối đến máy chủ người dùng');
  const data = await res.json();
  return data.filter((u: any) => u.role === 'candidate');
}

export async function searchSemantic(query: string): Promise<Job[]> {
  const res = await fetch(`${BASE_URL}/job-postings/search-semantic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Lỗi kết nối AI Search');
  const data = await res.json();
  return data.map(normalizeJob);
}

export async function queryChatbot(userId: string, message: string): Promise<{ reply: string; retrievedJobsCount: number }> {
  const res = await fetch(`${BASE_URL}/chatbot/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, message }),
  });
  if (!res.ok) throw new Error('AI Advisor đang bận (503)');
  return res.json();
}
