import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== CANDIDATE DASHBOARD ==========
  async getCandidateDashboard(userId: string) {
    // Đơn ứng tuyển
    const applications = await this.prisma.jobApplication.findMany({
      where: { candidateId: userId },
      select: { status: true, matchScore: true },
    });

    const statusCounts: Record<string, number> = {};
    let totalScore = 0;
    applications.forEach((app) => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      totalScore += app.matchScore;
    });

    // Tin đã lưu
    const savedCount = await this.prisma.savedJob.count({ where: { userId } });

    // Profile completeness
    const profile = await this.prisma.jobUser.findUnique({
      where: { userId },
      select: {
        profileCompleteness: true,
        topikLevel: true,
        skillsExtracted: true,
      },
    });

    // Số CV
    const resumeCount = await this.prisma.resume.count({ where: { userId } });

    return {
      overview: {
        totalApplications: applications.length,
        savedJobs: savedCount,
        resumes: resumeCount,
        averageMatchScore:
          applications.length > 0
            ? Math.round((totalScore / applications.length) * 100) + '%'
            : 'N/A',
      },
      applicationsByStatus: statusCounts,
      profile: {
        completeness: profile?.profileCompleteness
          ? Math.round(profile.profileCompleteness * 100) + '%'
          : '0%',
        topikLevel: profile?.topikLevel || 'Chưa cập nhật',
        skillsCount: profile?.skillsExtracted?.length || 0,
      },
    };
  }

  // ========== RECRUITER DASHBOARD ==========
  async getRecruiterDashboard(userId: string) {
    // Tìm company của recruiter
    const company = await this.prisma.company.findUnique({
      where: { userId },
      select: { companyId: true, companyName: true, isVerified: true },
    });

    if (!company) {
      return { message: 'Bạn chưa tạo hồ sơ công ty', company: null };
    }

    // Số tin tuyển dụng
    const jobPostings = await this.prisma.jobPosting.findMany({
      where: { companyId: company.companyId },
      select: { jobId: true, status: true, viewsCount: true, applyCount: true },
    });

    const jobStatusCounts: Record<string, number> = {};
    let totalViews = 0;
    let totalApplies = 0;
    const jobIds: string[] = [];
    jobPostings.forEach((job) => {
      jobStatusCounts[job.status] = (jobStatusCounts[job.status] || 0) + 1;
      totalViews += job.viewsCount;
      totalApplies += job.applyCount;
      jobIds.push(job.jobId);
    });

    // Đơn ứng tuyển cho tất cả tin
    const applications = await this.prisma.jobApplication.findMany({
      where: { jobId: { in: jobIds } },
      select: { status: true, matchScore: true },
    });

    const appStatusCounts: Record<string, number> = {};
    applications.forEach((app) => {
      appStatusCounts[app.status] = (appStatusCounts[app.status] || 0) + 1;
    });

    // Thông báo chưa đọc
    const unreadNotifications = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      company: {
        name: company.companyName,
        isVerified: company.isVerified,
      },
      jobPostings: {
        total: jobPostings.length,
        byStatus: jobStatusCounts,
        totalViews,
        totalApplies,
        conversionRate:
          totalViews > 0
            ? Math.round((totalApplies / totalViews) * 100) + '%'
            : 'N/A',
      },
      applications: {
        total: applications.length,
        byStatus: appStatusCounts,
      },
      unreadNotifications,
    };
  }

  // ========== ADMIN DASHBOARD ==========
  async getAdminDashboard() {
    const [
      totalUsers,
      totalCandidates,
      totalRecruiters,
      totalCompanies,
      verifiedCompanies,
      totalJobs,
      activeJobs,
      totalApplications,
      totalResumes,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'candidate' } }),
      this.prisma.user.count({ where: { role: 'recruiter' } }),
      this.prisma.company.count(),
      this.prisma.company.count({ where: { isVerified: true } }),
      this.prisma.jobPosting.count(),
      this.prisma.jobPosting.count({ where: { status: 'active' } }),
      this.prisma.jobApplication.count(),
      this.prisma.resume.count(),
    ]);

    // Top 5 kỹ năng phổ biến nhất
    const candidates = await this.prisma.jobUser.findMany({
      select: { skillsExtracted: true },
    });
    const skillCount: Record<string, number> = {};
    candidates.forEach((c) => {
      c.skillsExtracted.forEach((skill) => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Đơn ứng tuyển theo status
    const applicationsByStatus = await this.prisma.jobApplication.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      users: {
        total: totalUsers,
        candidates: totalCandidates,
        recruiters: totalRecruiters,
      },
      companies: {
        total: totalCompanies,
        verified: verifiedCompanies,
      },
      jobPostings: {
        total: totalJobs,
        active: activeJobs,
      },
      applications: {
        total: totalApplications,
        byStatus: applicationsByStatus.map((a) => ({
          status: a.status,
          count: a._count,
        })),
      },
      resumes: totalResumes,
      topSkills,
    };
  }
}
