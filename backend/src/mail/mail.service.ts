import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');
  private readonly resend: Resend;
  private readonly from: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.from = process.env.MAIL_FROM ?? 'KBRIDGE <noreply@kbridge.vn>';
  }

  async sendJobAlertEmail(
    toEmail: string,
    candidateName: string,
    jobs: Array<{
      title: string;
      companyName: string;
      location: string;
      salaryMin: number | null;
      salaryMax: number | null;
      requiredSkills: string[];
    }>,
  ) {
    const jobRows = jobs
      .map(
        (job, i) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">
            <strong style="color:#1d4ed8;">${i + 1}. ${job.title}</strong><br/>
            🏢 ${job.companyName} &nbsp;|&nbsp; 📍 ${job.location}<br/>
            💰 ${job.salaryMin || job.salaryMax ? `${(job.salaryMin ?? 0).toLocaleString()} ~ ${job.salaryMax ? job.salaryMax.toLocaleString() : 'Thỏa thuận'} KRW` : 'Thỏa thuận'}<br/>
            🛠️ ${job.requiredSkills.slice(0, 5).join(', ')}
          </td>
        </tr>`,
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">🇰🇷 KBRIDGE</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;">Sàn tìm việc IT Tiếng Hàn</p>
    </div>
    <div style="padding:24px;">
      <p>Xin chào <strong>${candidateName}</strong>,</p>
      <p>Chúng tôi tìm thấy <strong>${jobs.length} công việc mới</strong> phù hợp với đăng ký nhận tin của bạn:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
        ${jobRows}
      </table>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://kbridge.vn/jobs" style="background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Xem tất cả việc làm →</a>
      </div>
    </div>
    <div style="padding:16px 24px;background:#f3f4f6;text-align:center;color:#6b7280;font-size:12px;">
      Bạn nhận email này vì đã đăng ký nhận thông báo việc làm tại KBRIDGE.<br/>
      <a href="https://kbridge.vn/subscriptions" style="color:#3b82f6;">Quản lý đăng ký</a>
    </div>
  </div>
</body>
</html>`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: toEmail,
        subject: `🇰🇷 KBRIDGE: ${jobs.length} việc làm IT mới phù hợp với bạn`,
        html,
      });

      if (error) {
        this.logger.error(`Gửi email thất bại tới ${toEmail}: ${error.message}`);
        return { success: false, error: error.message };
      }

      this.logger.log(`✅ Đã gửi email job alert tới ${toEmail} (id: ${data?.id})`);
      return { success: true, id: data?.id };
    } catch (err: any) {
      this.logger.error(`Lỗi Resend: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendInterviewNotification(
    toEmail: string,
    candidateName: string,
    jobTitle: string,
    interviewTitle: string,
    scheduledAt: Date,
    meetingLink?: string,
  ) {
    const html = `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;">📅 Lịch phỏng vấn mới</h1>
    </div>
    <div style="padding:24px;">
      <p>Xin chào <strong>${candidateName}</strong>,</p>
      <p>Bạn có lịch phỏng vấn cho vị trí <strong>${jobTitle}</strong>:</p>
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;background:#f3f4f6;border-radius:8px;">
        <tr><td><strong>Tiêu đề:</strong></td><td>${interviewTitle}</td></tr>
        <tr><td><strong>Thời gian:</strong></td><td>${scheduledAt.toLocaleString('vi-VN')}</td></tr>
        ${meetingLink ? `<tr><td><strong>Link:</strong></td><td><a href="${meetingLink}">${meetingLink}</a></td></tr>` : ''}
      </table>
      <div style="text-align:center;margin-top:24px;">
        <a href="https://kbridge.vn/candidate/interviews" style="background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Xem lịch phỏng vấn →</a>
      </div>
    </div>
  </div>
</body>
</html>`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: toEmail,
        subject: `📅 KBRIDGE: Lịch phỏng vấn - ${jobTitle}`,
        html,
      });

      if (error) {
        this.logger.error(`Gửi email interview thất bại: ${error.message}`);
        return { success: false };
      }

      this.logger.log(`✅ Đã gửi email phỏng vấn tới ${toEmail} (id: ${data?.id})`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Lỗi Resend interview: ${err.message}`);
      return { success: false };
    }
  }
}
