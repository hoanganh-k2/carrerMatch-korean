import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');
  private readonly resend: Resend;
  private readonly from: string;
  // Dev: không gọi Resend (tránh giới hạn domain chưa verify), coi như gửi thành công.
  private readonly isDev = process.env.NODE_ENV !== 'production';

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.from = process.env.MAIL_FROM ?? 'KBRIDGE <noreply@kbridge.vn>';
  }

  // Điểm gửi email dùng chung. Ở dev sẽ bỏ qua Resend và trả về thành công.
  private async deliver(opts: {
    to: string;
    subject: string;
    html: string;
    label: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    if (this.isDev) {
      this.logger.log(
        `[DEV] Bỏ qua gửi email "${opts.label}" tới ${opts.to} (đặt NODE_ENV=production để gửi thật).`,
      );
      return { success: true, id: 'dev-skip' };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      });
      if (error) {
        this.logger.error(
          `Gửi email "${opts.label}" thất bại tới ${opts.to}: ${error.message}`,
        );
        return { success: false, error: error.message };
      }
      this.logger.log(
        `✅ Đã gửi email "${opts.label}" tới ${opts.to} (id: ${data?.id})`,
      );
      return { success: true, id: data?.id };
    } catch (err: any) {
      this.logger.error(`Lỗi Resend (${opts.label}): ${err.message}`);
      return { success: false, error: err.message };
    }
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

    return this.deliver({
      to: toEmail,
      subject: `🇰🇷 KBRIDGE: ${jobs.length} việc làm IT mới phù hợp với bạn`,
      html,
      label: 'job alert',
    });
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

    const result = await this.deliver({
      to: toEmail,
      subject: `📅 KBRIDGE: Lịch phỏng vấn - ${jobTitle}`,
      html,
      label: 'interview',
    });
    return { success: result.success };
  }

  private wrapEmail(title: string, bodyHtml: string) {
    return `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">🇰🇷 KBRIDGE</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;">${title}</p>
    </div>
    <div style="padding:24px;">${bodyHtml}</div>
    <div style="padding:16px 24px;background:#f3f4f6;text-align:center;color:#6b7280;font-size:12px;">
      Đây là email tự động từ KBRIDGE — Sàn tìm việc IT Tiếng Hàn.
    </div>
  </div>
</body>
</html>`;
  }

  async sendPasswordResetEmail(toEmail: string, resetUrl: string) {
    const html = this.wrapEmail(
      'Đặt lại mật khẩu',
      `<p>Xin chào,</p>
       <p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới để tạo mật khẩu mới (liên kết có hiệu lực trong 15 phút):</p>
       <div style="text-align:center;margin:24px 0;">
         <a href="${resetUrl}" style="background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Đặt lại mật khẩu →</a>
       </div>
       <p style="color:#6b7280;font-size:13px;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
    );

    const result = await this.deliver({
      to: toEmail,
      subject: '🔐 KBRIDGE: Đặt lại mật khẩu',
      html,
      label: 'reset mật khẩu',
    });
    return { success: result.success };
  }

  async sendVerifyEmail(toEmail: string, verifyUrl: string) {
    const html = this.wrapEmail(
      'Xác minh email',
      `<p>Xin chào,</p>
       <p>Cảm ơn bạn đã đăng ký KBRIDGE. Nhấn nút bên dưới để xác minh địa chỉ email của bạn:</p>
       <div style="text-align:center;margin:24px 0;">
         <a href="${verifyUrl}" style="background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Xác minh email →</a>
       </div>`,
    );

    const result = await this.deliver({
      to: toEmail,
      subject: '✅ KBRIDGE: Xác minh email của bạn',
      html,
      label: 'xác minh email',
    });
    return { success: result.success };
  }
}
