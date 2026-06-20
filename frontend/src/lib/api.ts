/**
 * KBRIDGE API client.
 * Hợp đồng (endpoint, token key, kiểu dữ liệu) giữ nguyên với backend NestJS.
 * Tất cả request đi qua helper `request()` dùng chung.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
  formData?: FormData;
  /** Thông báo lỗi mặc định nếu backend không trả message */
  fallbackError?: string;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData; // KHÔNG set Content-Type — browser tự thêm boundary
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body,
  });

  if (!res.ok) {
    let msg = opts.fallbackError ?? 'Đã có lỗi xảy ra, vui lòng thử lại';
    try {
      const err = await res.json();
      if (err?.message) msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
    } catch {
      /* body không phải JSON */
    }
    throw new ApiError(msg, res.status);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/* ============================ KIỂU DỮ LIỆU ============================ */

export interface Job {
  id: string;
  companyId: string;
  title: string;
  description: string;
  jdFileUrl?: string | null;
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
  targetRole?: string;
  createdAt?: string;
  company?: {
    companyName: string;
    logoUrl: string | null;
  };
}

/** Chuẩn hoá key từ backend (hỗ trợ cả snake_case lẫn camelCase) */
export const normalizeJob = (job: any): Job => ({
  id: job.jobId ?? job.job_id ?? job.id,
  companyId: job.companyId ?? job.company_id ?? '',
  title: job.title,
  description: job.description,
  jdFileUrl: job.jdFileUrl ?? job.jd_file_url ?? null,
  location: job.location,
  salaryMin: job.salaryMin ?? job.salary_min ?? null,
  salaryMax: job.salaryMax ?? job.salary_max ?? null,
  requiredSkills: job.requiredSkills ?? job.required_skills ?? [],
  minTopikRequired: job.minTopikRequired ?? job.min_topik_required ?? 'NONE',
  similarityScore: job.similarity_score ?? job.similarityScore,
  status: job.status,
  jobType: job.jobType ?? job.job_type,
  experienceYearsMin: job.experienceYearsMin ?? job.experience_years_min,
  applicationDeadline: job.applicationDeadline ?? job.application_deadline,
  viewsCount: job.viewsCount ?? job.views_count,
  applyCount: job.applyCount ?? job.apply_count,
  targetRole: job.targetRole ?? job.target_role,
  createdAt: job.createdAt ?? job.created_at,
  company: job.company
    ? {
        companyName: job.company.companyName ?? job.company.company_name,
        logoUrl: job.company.logoUrl ?? job.company.logo_url ?? null,
      }
    : undefined,
});

/** Kết quả phân trang chung từ backend */
export interface Paged<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ============================ 1. JOBS ============================ */

export interface JobListParams {
  page?: number;
  limit?: number;
  location?: string;
  jobType?: string;
  minTopik?: string;
  sort?: string;
  status?: string;
}

export async function fetchJobsPaged(params: JobListParams = {}): Promise<Paged<Job>> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const data = await request<any>(`/job-postings?${qs.toString()}`, {
    fallbackError: 'Không thể kết nối đến máy chủ tuyển dụng',
  });
  return { ...data, data: (data.data ?? []).map(normalizeJob) };
}

/** Trả về mảng Job (1 trang lớn) — cho các chỗ chưa cần phân trang */
export async function fetchJobs(): Promise<Job[]> {
  const paged = await fetchJobsPaged({ page: 1, limit: 1000 });
  return paged.data;
}

export async function fetchJobById(id: string): Promise<Job> {
  const data = await request<any>(`/job-postings/${id}`, {
    fallbackError: 'Không tìm thấy tin tuyển dụng',
  });
  return normalizeJob(data);
}

export async function searchSemantic(query: string): Promise<Job[]> {
  const data = await request<any[]>('/job-postings/search-semantic', {
    method: 'POST',
    body: { query },
    fallbackError: 'Lỗi kết nối AI Search',
  });
  return data.map(normalizeJob);
}

/* ============================ 2. TÌM KIẾM NÂNG CAO ============================ */

export interface SearchFilters {
  query?: string;
  locations?: string[];
  salaryMin?: number;
  salaryMax?: number;
  topikLevel?: string;
  jobType?: string;
  skills?: string[];
  page?: number;
  limit?: number;
}

export async function searchAdvancedJobsPaged(
  filters: SearchFilters,
  token?: string,
): Promise<Paged<Job>> {
  const data = await request<any>('/search/jobs', {
    method: 'POST',
    body: filters,
    token,
    fallbackError: 'Lọc tìm kiếm thất bại',
  });
  return { ...data, data: (data.data ?? []).map(normalizeJob) };
}

export async function searchAdvancedJobs(filters: SearchFilters, token?: string): Promise<Job[]> {
  const paged = await searchAdvancedJobsPaged({ ...filters, limit: filters.limit ?? 1000 }, token);
  return paged.data;
}

export function fetchSearchSuggestions(): Promise<Array<{ query: string; searchCount: number }>> {
  return request('/search/suggestions', { fallbackError: 'Lỗi tải từ khóa gợi ý' });
}

export function fetchMySearchHistory(token: string): Promise<any[]> {
  return request('/search/history', { token, fallbackError: 'Lỗi tải lịch sử tìm kiếm' });
}

export function fetchSkillTaxonomy(): Promise<any[]> {
  return request('/skill-taxonomy', { fallbackError: 'Lỗi tải danh mục kỹ năng' });
}

/* ============================ 3. CÔNG TY & ĐÁNH GIÁ ============================ */

export function fetchCompanies(): Promise<any[]> {
  return request('/companies', { fallbackError: 'Lỗi tải danh sách công ty' });
}

export function fetchCompanyById(id: string): Promise<any> {
  return request(`/companies/${id}`, { fallbackError: 'Không tìm thấy công ty' });
}

export function fetchMyCompany(token: string): Promise<any> {
  return request('/companies/me', { token, fallbackError: 'Lỗi tải hồ sơ công ty' });
}

export function createCompany(data: any, token: string): Promise<any> {
  return request('/companies', { method: 'POST', body: data, token, fallbackError: 'Tạo hồ sơ công ty thất bại' });
}

export function updateCompany(id: string, data: any, token: string): Promise<any> {
  return request(`/companies/${id}`, { method: 'PATCH', body: data, token, fallbackError: 'Cập nhật hồ sơ công ty thất bại' });
}

export function verifyCompany(id: string, token: string): Promise<any> {
  return request(`/companies/${id}/verify`, { method: 'PATCH', token, fallbackError: 'Duyệt công ty thất bại' });
}

export function fetchCompanyReviews(
  companyId: string,
): Promise<{ companyName: string; logoUrl: string | null; averageRating: number; totalReviews: number; reviews: any[] }> {
  return request(`/reviews/company/${companyId}`, { fallbackError: 'Lỗi tải đánh giá công ty' });
}

export function createReview(
  dto: { companyId: string; rating: number; reviewText: string; isAnonymous?: boolean },
  token: string,
): Promise<any> {
  return request('/reviews', {
    method: 'POST',
    body: dto,
    token,
    fallbackError: 'Gửi đánh giá thất bại. Bạn cần đã từng ứng tuyển vào công ty này.',
  });
}

/* ============================ 4. AUTH ============================ */

export function loginApi(dto: { email: string; password: string }): Promise<any> {
  return request('/auth/login', { method: 'POST', body: dto, fallbackError: 'Đăng nhập thất bại' });
}

/** Đăng nhập Google: gửi ID token (credential) từ Google Identity Services */
export function googleLoginApi(credential: string): Promise<any> {
  return request('/auth/google', { method: 'POST', body: { credential }, fallbackError: 'Đăng nhập Google thất bại' });
}

export function registerApi(dto: any): Promise<any> {
  return request('/auth/register', { method: 'POST', body: dto, fallbackError: 'Đăng ký thất bại' });
}

export function fetchProfile(token: string): Promise<any> {
  return request('/auth/me', { token, fallbackError: 'Không thể tải hồ sơ' });
}

export function changePassword(dto: { currentPassword: string; newPassword: string }, token: string): Promise<any> {
  return request('/auth/change-password', { method: 'POST', body: dto, token, fallbackError: 'Đổi mật khẩu thất bại' });
}

export function forgotPassword(email: string): Promise<any> {
  return request('/auth/forgot-password', { method: 'POST', body: { email }, fallbackError: 'Gửi yêu cầu thất bại' });
}

export function resetPassword(token: string, newPassword: string): Promise<any> {
  return request('/auth/reset-password', { method: 'POST', body: { token, newPassword }, fallbackError: 'Đặt lại mật khẩu thất bại' });
}

export function verifyEmail(token: string): Promise<any> {
  return request(`/auth/verify-email?token=${encodeURIComponent(token)}`, { fallbackError: 'Xác minh email thất bại' });
}

export function resendVerifyEmail(token: string): Promise<any> {
  return request('/auth/resend-verify-email', { method: 'POST', body: {}, token, fallbackError: 'Gửi lại email thất bại' });
}

/* ============================ 5. TÀI KHOẢN & HỒ SƠ ============================ */

export function updateMyAccount(data: { avatarUrl?: string; email?: string }, token: string): Promise<any> {
  return request('/users/me', { method: 'PATCH', body: data, token, fallbackError: 'Cập nhật tài khoản thất bại' });
}

export function deleteMyAccount(token: string): Promise<any> {
  return request('/users/me', { method: 'DELETE', token, fallbackError: 'Xóa tài khoản thất bại' });
}

export function fetchMyJobUserProfile(token: string): Promise<any> {
  return request('/job-users/me', { token, fallbackError: 'Lỗi tải hồ sơ ứng viên' });
}

export function updateMyJobUserProfile(data: any, token: string): Promise<any> {
  return request('/job-users/me', { method: 'PATCH', body: data, token, fallbackError: 'Cập nhật hồ sơ thất bại' });
}

/* ============================ 6. ỨNG TUYỂN & TIN ĐÃ LƯU ============================ */

export function applyJob(dto: { jobId: string; resumeId?: string; coverLetter?: string }, token: string): Promise<any> {
  return request('/job-applications/apply', { method: 'POST', body: dto, token, fallbackError: 'Nộp đơn ứng tuyển thất bại' });
}

export function fetchMyApplications(token: string): Promise<any[]> {
  return request('/job-applications/my-applications', { token, fallbackError: 'Lỗi tải danh sách đơn ứng tuyển' });
}

export function deleteApplication(id: string, token: string): Promise<any> {
  return request(`/job-applications/${id}`, { method: 'DELETE', token, fallbackError: 'Rút đơn ứng tuyển thất bại' });
}

export function saveJob(jobId: string, token: string): Promise<any> {
  return request(`/saved-jobs/${jobId}`, { method: 'POST', token, fallbackError: 'Lưu tin thất bại' });
}

export function unsaveJob(jobId: string, token: string): Promise<any> {
  return request(`/saved-jobs/${jobId}`, { method: 'DELETE', token, fallbackError: 'Bỏ lưu tin thất bại' });
}

export async function fetchMySavedJobs(token: string): Promise<Job[]> {
  const data = await request<any[]>('/saved-jobs/me', { token, fallbackError: 'Lỗi tải danh sách tin đã lưu' });
  return data.map((item: any) => normalizeJob(item.job));
}

export async function checkIsSaved(jobId: string, token: string): Promise<{ isSaved: boolean }> {
  try {
    return await request(`/saved-jobs/check/${jobId}`, { token });
  } catch {
    return { isSaved: false };
  }
}

/* ============================ 7. FILE UPLOADS ============================ */

export function uploadFile(file: File, type: 'cv' | 'avatar' | 'logo' | 'jd', token: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return request(`/uploads/${type}`, {
    method: 'POST',
    formData,
    token,
    fallbackError: 'Không thể tải lên file. Kiểm tra định dạng và dung lượng.',
  });
}

/**
 * URL file:
 * - upload trả path tương đối (/uploads/file/...) → ghép BASE_URL.
 * - seed có thể là URL tuyệt đối / data / blob → giữ nguyên.
 */
export function getUploadedFileUrl(urlPath?: string | null): string {
  if (!urlPath) return '';
  if (/^(https?:|data:|blob:)/i.test(urlPath)) return urlPath;
  return `${BASE_URL}${urlPath}`;
}

/* ============================ 8. CHATBOT & EVENTS ============================ */

export function queryChatbot(
  userId: string,
  message: string,
  token?: string,
): Promise<{ reply: string; retrievedJobsCount: number }> {
  return request('/chatbot/query', {
    method: 'POST',
    body: { userId, message },
    token,
    fallbackError: 'AI Advisor đang bận, thử lại sau giây lát',
  });
}

/** Fire-and-forget: ghi log hành vi (view_job, save, search...) */
export function logCareerEvent(data: {
  userId: string;
  eventType: string;
  jobId?: string;
  searchQuery?: string;
  clickPosition?: number;
  timeSpentSeconds?: number;
  deviceType?: string;
}): void {
  request('/career-events', { method: 'POST', body: data }).catch(() => {
    /* log không chặn trải nghiệm chính */
  });
}

/* ============================ 9. RECOMMENDATIONS (Phase 2) ============================ */

export function fetchRecommendations(token: string): Promise<any[]> {
  return request('/job-postings/recommendations/me', { token, fallbackError: 'Lỗi tải việc làm gợi ý' });
}

export function fetchMatchCandidates(jobId: string, token: string): Promise<any[]> {
  return request(`/job-postings/${jobId}/match-candidates`, { token, fallbackError: 'Lỗi tải ứng viên phù hợp' });
}

/* ============================ 10. DASHBOARDS (Phase 2) ============================ */

export function fetchCandidateDashboard(token: string): Promise<any> {
  return request('/dashboard/candidate', { token, fallbackError: 'Lỗi tải dashboard ứng viên' });
}

export function fetchRecruiterDashboard(token: string): Promise<any> {
  return request('/dashboard/recruiter', { token, fallbackError: 'Lỗi tải dashboard nhà tuyển dụng' });
}

export function fetchAdminDashboard(token: string): Promise<any> {
  return request('/dashboard/admin', { token, fallbackError: 'Lỗi tải dashboard quản trị' });
}

/* ============================ 11. JOB POSTINGS CRUD (recruiter) ============================ */

export function createJobPosting(data: any, token: string): Promise<any> {
  return request('/job-postings', { method: 'POST', body: data, token, fallbackError: 'Đăng tin tuyển dụng thất bại' });
}

export function updateJobPosting(id: string, data: any, token: string): Promise<any> {
  return request(`/job-postings/${id}`, { method: 'PATCH', body: data, token, fallbackError: 'Cập nhật tin tuyển dụng thất bại' });
}

export function deleteJobPosting(id: string, token: string): Promise<any> {
  return request(`/job-postings/${id}`, { method: 'DELETE', token, fallbackError: 'Xóa tin tuyển dụng thất bại' });
}

/* ============================ 12. ĐƠN ỨNG TUYỂN (recruiter) ============================ */

export function fetchApplicationsByJob(jobId: string, token: string): Promise<any[]> {
  return request(`/job-applications/job/${jobId}`, { token, fallbackError: 'Lỗi tải đơn ứng tuyển của tin này' });
}

export function updateApplicationStatus(
  id: string,
  dto: { status: string; recruiterNote?: string; recruiterRating?: number },
  token: string,
): Promise<any> {
  return request(`/job-applications/${id}/status`, { method: 'PATCH', body: dto, token, fallbackError: 'Cập nhật trạng thái thất bại' });
}

/* ============================ 13. PHỎNG VẤN ============================ */

export function fetchMyInterviews(token: string): Promise<any[]> {
  return request('/interviews/me', { token, fallbackError: 'Lỗi tải lịch phỏng vấn' });
}

export function createInterview(
  data: {
    applicationId: string; title: string; description?: string; scheduledAt: string;
    durationMinutes?: number; meetingLink?: string; interviewLanguage?: string; interpreterNeeded?: boolean;
  },
  token: string,
): Promise<any> {
  return request('/interviews', { method: 'POST', body: data, token, fallbackError: 'Tạo lịch phỏng vấn thất bại' });
}

export function updateInterviewStatus(id: string, status: string, token: string): Promise<any> {
  return request(`/interviews/${id}/status`, { method: 'PATCH', body: { status }, token, fallbackError: 'Cập nhật phỏng vấn thất bại' });
}

export function submitInterviewFeedback(id: string, feedback: string, token: string): Promise<any> {
  return request(`/interviews/${id}/feedback`, { method: 'PATCH', body: { feedback }, token, fallbackError: 'Gửi phản hồi thất bại' });
}

/* ============================ 14. RESUMES (CV) ============================ */

export function fetchMyResumes(token: string): Promise<any[]> {
  return request('/resumes/me', { token, fallbackError: 'Lỗi tải danh sách CV' });
}

export function createResume(data: any, token: string): Promise<any> {
  return request('/resumes', { method: 'POST', body: data, token, fallbackError: 'Tạo CV thất bại' });
}

export function updateResume(id: string, data: any, token: string): Promise<any> {
  return request(`/resumes/${id}`, { method: 'PATCH', body: data, token, fallbackError: 'Cập nhật CV thất bại' });
}

export function deleteResume(id: string, token: string): Promise<any> {
  return request(`/resumes/${id}`, { method: 'DELETE', token, fallbackError: 'Xóa CV thất bại' });
}

export const addExperience = (resumeId: string, data: any, token: string) =>
  request(`/resumes/${resumeId}/experiences`, { method: 'POST', body: data, token, fallbackError: 'Thêm kinh nghiệm thất bại' });
export const deleteExperience = (expId: string, token: string) =>
  request(`/resumes/experiences/${expId}`, { method: 'DELETE', token, fallbackError: 'Xóa kinh nghiệm thất bại' });
export const addEducation = (resumeId: string, data: any, token: string) =>
  request(`/resumes/${resumeId}/educations`, { method: 'POST', body: data, token, fallbackError: 'Thêm học vấn thất bại' });
export const deleteEducation = (eduId: string, token: string) =>
  request(`/resumes/educations/${eduId}`, { method: 'DELETE', token, fallbackError: 'Xóa học vấn thất bại' });
export const addCertification = (resumeId: string, data: any, token: string) =>
  request(`/resumes/${resumeId}/certifications`, { method: 'POST', body: data, token, fallbackError: 'Thêm chứng chỉ thất bại' });
export const deleteCertification = (certId: string, token: string) =>
  request(`/resumes/certifications/${certId}`, { method: 'DELETE', token, fallbackError: 'Xóa chứng chỉ thất bại' });

/* ============================ 15. THÔNG BÁO ============================ */

export function fetchNotifications(token: string): Promise<any[]> {
  return request('/notifications/me', { token, fallbackError: 'Lỗi tải thông báo' });
}

export async function fetchUnreadNotificationsCount(token: string): Promise<{ unreadCount: number }> {
  try {
    return await request('/notifications/unread-count', { token });
  } catch {
    return { unreadCount: 0 };
  }
}

export function markNotificationRead(id: string, token: string): Promise<any> {
  return request(`/notifications/${id}/read`, { method: 'PATCH', token, fallbackError: 'Lỗi đánh dấu đã đọc' });
}

export function markAllNotificationsRead(token: string): Promise<any> {
  return request('/notifications/read-all', { method: 'PATCH', token, fallbackError: 'Lỗi đánh dấu đã đọc tất cả' });
}

export function deleteNotification(id: string, token: string): Promise<any> {
  return request(`/notifications/${id}`, { method: 'DELETE', token, fallbackError: 'Lỗi xóa thông báo' });
}

/* ============================ 16. ĐĂNG KÝ NHẬN VIỆC (subscriptions) ============================ */

export function createSubscription(
  dto: { skills: string[]; locations?: string[]; topikLevel?: string },
  token: string,
): Promise<any> {
  return request('/subscriptions', { method: 'POST', body: dto, token, fallbackError: 'Đăng ký nhận tin thất bại' });
}

export function fetchMySubscriptions(token: string): Promise<any[]> {
  return request('/subscriptions/me', { token, fallbackError: 'Lỗi tải danh sách đăng ký' });
}

export function deleteSubscription(id: string, token: string): Promise<any> {
  return request(`/subscriptions/${id}`, { method: 'DELETE', token, fallbackError: 'Hủy đăng ký thất bại' });
}

export function triggerEmailAlerts(token: string): Promise<any> {
  return request('/subscriptions/trigger-my-alerts', { method: 'POST', token, fallbackError: 'Kích hoạt quét việc thất bại' });
}

/* ============================ 17. ADMIN: USER & PHÂN QUYỀN ============================ */

export function fetchAllUsers(token: string): Promise<any[]> {
  return request('/users', { token, fallbackError: 'Lỗi tải danh sách người dùng' });
}

export function updateUserRole(id: string, role: string, token: string): Promise<any> {
  return request(`/users/${id}/role`, { method: 'PATCH', body: { role }, token, fallbackError: 'Đổi vai trò thất bại' });
}

export function setUserActive(id: string, isActive: boolean, token: string): Promise<any> {
  return isActive
    ? request(`/users/${id}/activate`, { method: 'PATCH', token, fallbackError: 'Mở khóa tài khoản thất bại' })
    : request(`/users/${id}`, { method: 'DELETE', token, fallbackError: 'Khóa tài khoản thất bại' });
}

export function fetchAllPermissions(token: string): Promise<any[]> {
  return request('/permissions', { token, fallbackError: 'Lỗi tải danh sách quyền' });
}

export function fetchUserPermissions(userId: string, token: string): Promise<any[]> {
  return request(`/users/${userId}/permissions`, { token, fallbackError: 'Lỗi tải quyền của người dùng' });
}

export const assignPermission = (userId: string, permissionId: string, token: string) =>
  request(`/users/${userId}/permissions`, { method: 'POST', body: { permissionId }, token, fallbackError: 'Cấp quyền thất bại' });

export function revokePermission(userId: string, permId: string, token: string): Promise<any> {
  return request(`/users/${userId}/permissions/${permId}`, { method: 'DELETE', token, fallbackError: 'Thu hồi quyền thất bại' });
}

export const seedPermissions = (token: string) =>
  request('/permissions/seed', { method: 'POST', token, fallbackError: 'Tạo quyền mặc định thất bại' });

/* ============================ 18. ADMIN: KIỂM DUYỆT ============================ */

export function fetchAllReviewsAdmin(token: string): Promise<any[]> {
  return request('/reviews', { token, fallbackError: 'Lỗi tải danh sách đánh giá' });
}

export function deleteReview(id: string, token: string): Promise<any> {
  return request(`/reviews/${id}`, { method: 'DELETE', token, fallbackError: 'Xóa đánh giá thất bại' });
}

/** Admin xóa tin tuyển dụng (dùng chung DELETE /job-postings/:id) */
export const adminDeleteJob = deleteJobPosting;
