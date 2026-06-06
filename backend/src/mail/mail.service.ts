import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger('MailService');

  // Giả lập gửi Email bản tin việc làm phù hợp hàng tuần
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
    await Promise.resolve();
    this.logger.log(`📧 ĐANG KHỞI TẠO BẢN TIN GỬI TỚI EMAIL: ${toEmail}...`);

    // Tạo giao diện Email giả lập HTML Premium
    let emailHtml = `
================================================================================
                    CAREERMATCH KOREAN - BẢN TIN VIỆC LÀM HÀNG TUẦN
================================================================================
Xin chào ${candidateName},

Dựa trên đăng ký nhận tin của bạn, chúng tôi tìm thấy ${jobs.length} công việc mới
phù hợp với kỹ năng của bạn trong tuần này!
`;

    jobs.forEach((job, index) => {
      const salary =
        job.salaryMin || job.salaryMax
          ? `${job.salaryMin || 0} ~ ${job.salaryMax || 'Thỏa thuận'} KRW`
          : 'Thỏa thuận';
      emailHtml += `
[Tin tuyển dụng #${index + 1}]
- Vị trí: ${job.title}
- Công ty: ${job.companyName}
- Địa điểm: ${job.location}
- Mức lương: ${salary}
- Kỹ năng yêu cầu: ${job.requiredSkills.join(', ')}
--------------------------------------------------------------------------------`;
    });

    emailHtml += `
Xem chi tiết và ứng tuyển tại website của chúng tôi.
Chúc bạn tìm được công việc ưng ý!

Trân trọng,
Đội ngũ CareerMatch Korean.
================================================================================
`;

    // In Email ra console log để kiểm thử
    console.log(emailHtml);

    this.logger.log(`✅ ĐÃ GỬI EMAIL THÀNH CÔNG TỚI: ${toEmail}`);
    return { success: true };
  }
}
