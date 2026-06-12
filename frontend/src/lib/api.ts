const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  requiredSkills: string[];
  minTopikRequired: string;
  similarityScore?: number;
  status?: string;
  jobType?: string;
  experienceYearsMin?: number;
  applicationDeadline?: string;
  viewsCount?: number;
  applyCount?: number;
  company?: {
    companyName: string;
    logoUrl: string | null;
  };
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
    id: job.jobId ?? job.job_id ?? job.id,
    companyId: job.companyId ?? job.company_id ?? '',
    title: job.title,
    description: job.description,
    location: job.location,
    salaryMin: job.salaryMin ?? job.salary_min,
    salaryMax: job.salaryMax ?? job.salary_max,
    requiredSkills: job.requiredSkills ?? job.required_skills ?? [],
    minTopikRequired: job.minTopikRequired ?? job.min_topik_required,
    similarityScore: job.similarity_score ?? job.similarityScore,
    status: job.status,
    jobType: job.jobType ?? job.job_type,
    experienceYearsMin: job.experienceYearsMin ?? job.experience_years_min,
    applicationDeadline: job.applicationDeadline ?? job.application_deadline,
    viewsCount: job.viewsCount ?? job.views_count,
    applyCount: job.applyCount ?? job.apply_count,
    company: job.company
      ? {
          companyName: job.company.companyName ?? job.company.company_name,
          logoUrl: job.company.logoUrl ?? job.company.logo_url ?? null,
        }
      : undefined,
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
  return data;
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

export async function queryChatbot(
  userId: string,
  message: string,
  token?: string,
): Promise<{ reply: string; retrievedJobsCount: number }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}/chatbot/query`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId, message }),
  });
  if (!res.ok) throw new Error('AI Advisor đang bận (503)');
  return res.json();
}

// ==================== 1. TÌM KIẾM NÂNG CAO ====================
export async function searchAdvancedJobs(
  filters: {
    query?: string;
    locations?: string[];
    salaryMin?: number;
    salaryMax?: number;
    topikLevel?: string;
    jobType?: string;
    skills?: string[];
  },
  token?: string,
): Promise<Job[]> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}/search/jobs`, {
    method: 'POST',
    headers,
    body: JSON.stringify(filters),
  });
  if (!res.ok) throw new Error('Lọc tìm kiếm thất bại');
  const data = await res.json();
  return data.map(normalizeJob);
}

export async function fetchSearchSuggestions(): Promise<Array<{ query: string; searchCount: number }>> {
  const res = await fetch(`${BASE_URL}/search/suggestions`);
  if (!res.ok) throw new Error('Lỗi tải từ khóa gợi ý');
  return res.json();
}

export async function fetchMySearchHistory(token: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/search/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải lịch sử tìm kiếm');
  return res.json();
}

// ==================== 2. SAVED JOBS ====================
export async function saveJob(jobId: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/saved-jobs/${jobId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lưu tin tuyển dụng thất bại');
  return res.json();
}

export async function unsaveJob(jobId: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/saved-jobs/${jobId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Bỏ lưu tin thất bại');
  return res.json();
}

export async function fetchMySavedJobs(token: string): Promise<Job[]> {
  const res = await fetch(`${BASE_URL}/saved-jobs/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải danh sách tin đã lưu');
  const data = await res.json();
  // SavedJob schema returns { id, savedAt, job: { ... } }
  return data.map((item: any) => normalizeJob(item.job));
}

export async function checkIsSaved(jobId: string, token: string): Promise<{ isSaved: boolean }> {
  const res = await fetch(`${BASE_URL}/saved-jobs/check/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { isSaved: false };
  return res.json();
}

// ==================== 3. SUBSCRIPTIONS ====================
export async function createSubscription(
  dto: { skills: string[]; locations?: string[]; topikLevel?: string },
  token: string,
): Promise<any> {
  const res = await fetch(`${BASE_URL}/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Đăng ký nhận thông tin việc làm thất bại');
  return res.json();
}

export async function fetchMySubscriptions(token: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/subscriptions/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('fetchMySubscriptions failed:', res.status, errText);
    throw new Error(`Lỗi tải danh sách đăng ký nhận tin (Status ${res.status})`);
  }
  return res.json();
}

export async function deleteSubscription(id: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/subscriptions/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Hủy nhận tin thất bại');
  return res.json();
}

export async function triggerEmailAlerts(token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/subscriptions/trigger-send-alerts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Kích hoạt quét việc làm thất bại');
  return res.json();
}

// ==================== 4. NOTIFICATIONS ====================
export async function fetchNotifications(token: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/notifications/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải thông báo');
  return res.json();
}

export async function fetchUnreadNotificationsCount(token: string): Promise<{ unreadCount: number }> {
  const res = await fetch(`${BASE_URL}/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { unreadCount: 0 };
  return res.json();
}

export async function markNotificationRead(id: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi đánh dấu đã đọc thông báo');
  return res.json();
}

export async function markAllNotificationsRead(token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi đánh dấu đọc tất cả thông báo');
  return res.json();
}

export async function deleteNotification(id: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi xóa thông báo');
  return res.json();
}

// ==================== 5. INTERVIEWS ====================
export async function fetchMyInterviews(token: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/interviews/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải danh sách lịch phỏng vấn');
  return res.json();
}

export async function updateInterviewStatus(id: string, status: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/interviews/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Cập nhật trạng thái phỏng vấn thất bại');
  return res.json();
}

export async function submitInterviewFeedback(id: string, feedback: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/interviews/${id}/feedback`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ feedback }),
  });
  if (!res.ok) throw new Error('Gửi phản hồi phỏng vấn thất bại');
  return res.json();
}

// ==================== 6. REVIEWS ====================
export async function createReview(
  dto: { companyId: string; rating: number; reviewText: string; isAnonymous?: boolean },
  token: string,
): Promise<any> {
  const res = await fetch(`${BASE_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gửi đánh giá công ty thất bại. Hãy chắc chắn bạn đã nộp hồ sơ vào công ty này.');
  }
  return res.json();
}

export async function fetchCompanyReviews(
  companyId: string,
): Promise<{ companyName: string; logoUrl: string | null; averageRating: number; totalReviews: number; reviews: any[] }> {
  const res = await fetch(`${BASE_URL}/reviews/company/${companyId}`);
  if (!res.ok) throw new Error('Lỗi tải danh sách đánh giá công ty');
  return res.json();
}

// ==================== 7. FILE UPLOADS ====================
export async function uploadFile(
  file: File,
  type: 'cv' | 'avatar' | 'logo',
  token: string,
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/uploads/${type}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Không thể tải lên file. Hãy kiểm tra định dạng và dung lượng file.');
  }
  return res.json();
}

// Helper to get raw file URL
export function getUploadedFileUrl(urlPath: string): string {
  return `${BASE_URL}${urlPath}`;
}

// ==================== 8. AUTH ====================
export async function loginApi(dto: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Đăng nhập thất bại');
  return res.json();
}

export async function registerApi(dto: any): Promise<any> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Đăng ký thất bại');
  }
  return res.json();
}

export async function fetchProfile(token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Không thể tải profile');
  return res.json();
}

// ==================== 9. JOB APPLICATIONS ====================
export async function applyJob(
  dto: { jobId: string; resumeId?: string; coverLetter?: string },
  token: string,
): Promise<any> {
  const res = await fetch(`${BASE_URL}/job-applications/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Nộp đơn ứng tuyển thất bại');
  }
  return res.json();
}

export async function fetchMyApplications(token: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/job-applications/my-applications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải danh sách đơn ứng tuyển');
  return res.json();
}

export async function updateApplicationStatus(
  id: string,
  dto: { status: string; recruiterNote?: string; recruiterRating?: number },
  token: string,
): Promise<any> {
  const res = await fetch(`${BASE_URL}/job-applications/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Cập nhật trạng thái đơn ứng tuyển thất bại');
  return res.json();
}

// Recruiter: danh sách đơn ứng tuyển của 1 tin tuyển dụng
export async function fetchApplicationsByJob(jobId: string, token: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/job-applications/job/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải danh sách đơn ứng tuyển của tin này');
  return res.json();
}

// ==================== 10. RECOMMENDATIONS & AI MATCHING ====================

// Candidate: việc làm gợi ý riêng (kèm điểm + giải thích + kỹ năng thiếu)
export async function fetchRecommendations(token: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/job-postings/recommendations/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải danh sách việc làm gợi ý');
  return res.json();
}

// Recruiter: ứng viên AI gợi ý cho 1 tin tuyển dụng
export async function fetchMatchCandidates(jobId: string, token: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/job-postings/${jobId}/match-candidates`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải danh sách ứng viên phù hợp');
  return res.json();
}

// ==================== 11. JOB POSTINGS CRUD (RECRUITER) ====================

export async function createJobPosting(data: any, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/job-postings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Đăng tin tuyển dụng thất bại');
  }
  return res.json();
}

export async function updateJobPosting(id: string, data: any, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/job-postings/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Cập nhật tin tuyển dụng thất bại');
  return res.json();
}

export async function deleteJobPosting(id: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/job-postings/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Xóa tin tuyển dụng thất bại');
  return res.json();
}

// ==================== 12. DASHBOARDS THEO ROLE ====================

export async function fetchCandidateDashboard(token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/dashboard/candidate`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải dashboard ứng viên');
  return res.json();
}

export async function fetchRecruiterDashboard(token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/dashboard/recruiter`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải dashboard nhà tuyển dụng');
  return res.json();
}

export async function fetchAdminDashboard(token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/dashboard/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải dashboard quản trị');
  return res.json();
}

// ==================== 13. COMPANIES ====================

export async function fetchMyCompany(token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/companies/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải hồ sơ công ty');
  return res.json();
}

export async function fetchCompanies(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/companies`);
  if (!res.ok) throw new Error('Lỗi tải danh sách công ty');
  return res.json();
}

export async function createCompany(data: any, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/companies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Tạo hồ sơ công ty thất bại');
  }
  return res.json();
}

export async function updateCompany(id: string, data: any, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/companies/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Cập nhật hồ sơ công ty thất bại');
  return res.json();
}

// Admin: duyệt xác thực công ty
export async function verifyCompany(id: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/companies/${id}/verify`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Duyệt công ty thất bại');
  return res.json();
}

// ==================== 14. PROFILE (JOB USER) ====================

export async function fetchMyJobUserProfile(token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/job-users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải hồ sơ ứng viên');
  return res.json();
}

export async function updateMyJobUserProfile(data: any, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/job-users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Cập nhật hồ sơ thất bại');
  }
  return res.json();
}

// ==================== 15. RESUMES (CV) ====================

export async function fetchMyResumes(token: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/resumes/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Lỗi tải danh sách CV');
  return res.json();
}

export async function createResume(data: any, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/resumes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Tạo CV thất bại');
  return res.json();
}

export async function updateResume(id: string, data: any, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/resumes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Cập nhật CV thất bại');
  return res.json();
}

export async function deleteResume(id: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/resumes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Xóa CV thất bại');
  return res.json();
}

async function postResumeSection(path: string, data: any, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Thêm mục CV thất bại');
  }
  return res.json();
}

async function deleteResumeSection(path: string, token: string): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Xóa mục CV thất bại');
  return res.json();
}

export const addExperience = (resumeId: string, data: any, token: string) =>
  postResumeSection(`/resumes/${resumeId}/experiences`, data, token);
export const deleteExperience = (expId: string, token: string) =>
  deleteResumeSection(`/resumes/experiences/${expId}`, token);
export const addEducation = (resumeId: string, data: any, token: string) =>
  postResumeSection(`/resumes/${resumeId}/educations`, data, token);
export const deleteEducation = (eduId: string, token: string) =>
  deleteResumeSection(`/resumes/educations/${eduId}`, token);
export const addCertification = (resumeId: string, data: any, token: string) =>
  postResumeSection(`/resumes/${resumeId}/certifications`, data, token);
export const deleteCertification = (certId: string, token: string) =>
  deleteResumeSection(`/resumes/certifications/${certId}`, token);

// ==================== 16. INTERVIEWS (RECRUITER) ====================

export async function createInterview(
  data: {
    applicationId: string;
    title: string;
    description?: string;
    scheduledAt: string;
    durationMinutes?: number;
    meetingLink?: string;
    interviewLanguage?: string;
    interpreterNeeded?: boolean;
  },
  token: string,
): Promise<any> {
  const res = await fetch(`${BASE_URL}/interviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Tạo lịch phỏng vấn thất bại');
  }
  return res.json();
}

// ==================== 17. SKILL TAXONOMY ====================

export async function fetchSkillTaxonomy(): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/skill-taxonomy`);
  if (!res.ok) throw new Error('Lỗi tải danh mục kỹ năng');
  return res.json();
}

// ==================== 18. CAREER EVENTS (BEHAVIOR LOG) ====================

// Fire-and-forget: ghi log hành vi (view_job, save...) để nuôi Metadata dataset
export function logCareerEvent(data: {
  userId: string;
  eventType: string;
  jobId?: string;
  searchQuery?: string;
  clickPosition?: number;
  timeSpentSeconds?: number;
  deviceType?: string;
}): void {
  fetch(`${BASE_URL}/career-events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {
    // Log hành vi không được chặn trải nghiệm chính
  });
}
