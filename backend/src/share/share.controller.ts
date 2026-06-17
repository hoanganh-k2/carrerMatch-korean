import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Endpoint serve HTML kèm Open Graph meta cho bot mạng xã hội (Facebook/Zalo...).
 * Bot không chạy JavaScript nên SPA không đủ — cần trang HTML có sẵn <meta og:*>.
 * Người dùng thật mở link sẽ được redirect sang trang thật trên frontend.
 */
@Controller('share')
export class ShareController {
  constructor(private readonly prisma: PrismaService) {}

  private get frontendUrl(): string {
    return process.env.FRONTEND_URL ?? 'http://localhost:5173';
  }

  // URL gốc của chính backend (để build link tuyệt đối cho ảnh upload)
  private backendBase(req: Request): string {
    return `${req.protocol}://${req.get('host')}`;
  }

  // Logo lưu dạng "/uploads/file/logos/..." -> cần URL tuyệt đối cho OG image
  private resolveImage(logoUrl: string | null | undefined, req: Request): string {
    if (logoUrl && /^https?:\/\//i.test(logoUrl)) return logoUrl;
    if (logoUrl) return `${this.backendBase(req)}${logoUrl}`;
    return `${this.frontendUrl}/favicon.ico`; // fallback thương hiệu KBRIDGE
  }

  @Get('jobs/:jobId')
  async shareJob(
    @Param('jobId') jobId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const job = await this.prisma.jobPosting
      .findUnique({
        where: { jobId },
        include: { company: { select: { companyName: true, logoUrl: true } } },
      })
      .catch(() => null);

    if (!job) {
      return this.sendHtml(res, {
        title: 'KBRIDGE - Sàn tìm việc IT Tiếng Hàn',
        description:
          'Tìm việc BrSE, Comtor, Dev tiếng Hàn bằng AI Semantic Search.',
        image: `${this.frontendUrl}/favicon.ico`,
        url: `${this.frontendUrl}/jobs`,
        redirect: `${this.frontendUrl}/jobs`,
      });
    }

    const companyName = job.company?.companyName ?? 'KBRIDGE';
    const salary = formatSalary(job.salaryMin, job.salaryMax);
    const desc = `${salary} · ${job.location}. ${oneLine(job.description)}`;

    return this.sendHtml(res, {
      title: `${job.title} – ${companyName}`,
      description: truncate(desc, 180),
      image: this.resolveImage(job.company?.logoUrl, req),
      url: `${this.frontendUrl}/jobs/${jobId}`,
      redirect: `${this.frontendUrl}/jobs/${jobId}`,
    });
  }

  @Get('companies/:companyId')
  async shareCompany(
    @Param('companyId') companyId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const company = await this.prisma.company
      .findUnique({
        where: { companyId },
        select: {
          companyName: true,
          logoUrl: true,
          industry: true,
          location: true,
          description: true,
        },
      })
      .catch(() => null);

    if (!company) {
      return this.sendHtml(res, {
        title: 'KBRIDGE - Doanh nghiệp tuyển dụng IT Tiếng Hàn',
        description: 'Khám phá các doanh nghiệp công nghệ Hàn Quốc trên KBRIDGE.',
        image: `${this.frontendUrl}/favicon.ico`,
        url: `${this.frontendUrl}/companies`,
        redirect: `${this.frontendUrl}/companies`,
      });
    }

    const parts = [company.industry, company.location].filter(Boolean).join(' · ');
    const desc = [parts, oneLine(company.description ?? '')]
      .filter(Boolean)
      .join('. ');

    return this.sendHtml(res, {
      title: `${company.companyName} | KBRIDGE`,
      description:
        truncate(desc, 180) ||
        `Việc làm IT tiếng Hàn tại ${company.companyName} trên KBRIDGE.`,
      image: this.resolveImage(company.logoUrl, req),
      url: `${this.frontendUrl}/companies/${companyId}`,
      redirect: `${this.frontendUrl}/companies/${companyId}`,
    });
  }

  // Thẻ "Mức độ sẵn sàng thị trường Hàn" — stateless, điểm nằm trong query
  @Get('readiness')
  shareReadiness(
    @Query('score') scoreRaw: string,
    @Query('name') nameRaw: string,
    @Res() res: Response,
  ) {
    const score = clampScore(scoreRaw);
    const subject = oneLine(nameRaw || '').slice(0, 40) || 'Tôi';
    const rankTitle = readinessRankTitle(score);
    const redirect = `${this.frontendUrl}/readiness?score=${score}`;

    return this.sendHtml(res, {
      title: `${subject} sẵn sàng ${score}% cho thị trường Hàn 🇰🇷 — ${rankTitle}`,
      description:
        'Bạn được bao nhiêu %? Thử ngay "Mức độ sẵn sàng thị trường Hàn" trên KBRIDGE và khoe với bạn bè nhé!',
      image: `${this.frontendUrl}/favicon.ico`,
      url: redirect,
      redirect,
    });
  }

  private sendHtml(
    res: Response,
    data: {
      title: string;
      description: string;
      image: string;
      url: string;
      redirect: string;
    },
  ) {
    res.type('html').send(renderOgHtml(data));
  }
}

// ==================== Helpers ====================

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function oneLine(str: string): string {
  return (str || '').replace(/\s+/g, ' ').trim();
}

function clampScore(raw: string): number {
  const n = parseInt(raw, 10);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

// Danh hiệu dí dỏm theo bậc — PHẢI đồng bộ với frontend lib/readiness.ts
function readinessRankTitle(score: number): string {
  if (score >= 85) return 'Oppa tổng tài đang chờ ký HĐ 🔥';
  if (score >= 70) return 'Chỉ còn thiếu mỗi vé máy bay ✈️';
  if (score >= 50) return 'Tiềm năng làm rể/dâu Hàn Quốc 💪';
  if (score >= 30) return 'Mới thuộc mỗi câu 안녕하세요 😅';
  return 'Đang ở tập 1 của phim Hàn 🍿';
}

function truncate(str: string, max: number): string {
  const s = oneLine(str);
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function formatSalary(min: number | null, max: number | null): string {
  const m = (v: number) => `${(v / 1_000_000).toFixed(0)}M`;
  if (min && max) return `${m(min)} - ${m(max)} VND`;
  if (min) return `Từ ${m(min)} VND`;
  if (max) return `Lên đến ${m(max)} VND`;
  return 'Lương thỏa thuận';
}

function renderOgHtml(data: {
  title: string;
  description: string;
  image: string;
  url: string;
  redirect: string;
}): string {
  const title = escapeHtml(data.title);
  const description = escapeHtml(data.description);
  const image = escapeHtml(data.image);
  const url = escapeHtml(data.url);
  const redirect = escapeHtml(data.redirect);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />

  <!-- Open Graph -->
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="KBRIDGE" />
  <meta property="og:locale" content="vi_VN" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />

  <!-- Người dùng thật: nhảy sang trang thật trên SPA -->
  <meta http-equiv="refresh" content="0; url=${redirect}" />
  <link rel="canonical" href="${url}" />
</head>
<body>
  <p>Đang chuyển tới KBRIDGE… Nếu không tự chuyển, hãy <a href="${redirect}">bấm vào đây</a>.</p>
  <script>window.location.replace(${JSON.stringify(data.redirect)});</script>
</body>
</html>`;
}
