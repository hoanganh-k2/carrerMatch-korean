import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class CreateReviewDto {
  companyId: string;
  rating: number;
  reviewText: string;
  isAnonymous?: boolean;
}

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Tạo đánh giá mới cho công ty (Ứng viên)
  async create(candidateUserId: string, dto: CreateReviewDto) {
    // Kiểm tra công ty tồn tại
    const company = await this.prisma.company.findUnique({
      where: { companyId: dto.companyId },
    });
    if (!company) {
      throw new NotFoundException('Công ty không tồn tại');
    }

    // Kiểm tra điểm rating hợp lệ
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Điểm đánh giá phải từ 1 đến 5 sao');
    }

    // Điều kiện: Ứng viên phải từng ứng tuyển vào ít nhất 1 tin tuyển dụng của công ty này
    const hasApplied = await this.prisma.jobApplication.findFirst({
      where: {
        candidateId: candidateUserId,
        job: {
          companyId: dto.companyId,
        },
      },
    });

    if (!hasApplied) {
      throw new ForbiddenException(
        'Bạn chỉ được đánh giá những công ty bạn đã từng ứng tuyển việc làm',
      );
    }

    // Kiểm tra đã đánh giá trước đó chưa
    const existingReview = await this.prisma.companyReview.findUnique({
      where: {
        companyId_candidateId: {
          companyId: dto.companyId,
          candidateId: candidateUserId,
        },
      },
    });

    if (existingReview) {
      throw new BadRequestException(
        'Bạn đã gửi đánh giá cho công ty này trước đó rồi',
      );
    }

    // Tạo review
    return this.prisma.companyReview.create({
      data: {
        companyId: dto.companyId,
        candidateId: candidateUserId,
        rating: dto.rating,
        reviewText: dto.reviewText,
        isAnonymous: dto.isAnonymous ?? false,
      },
    });
  }

  // 2. Lấy danh sách đánh giá của một công ty và điểm trung bình
  async findReviewsByCompany(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { companyId },
    });
    if (!company) {
      throw new NotFoundException('Công ty không tồn tại');
    }

    const reviews = await this.prisma.companyReview.findMany({
      where: { companyId },
      include: {
        candidate: {
          select: {
            email: true,
            jobUser: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mapped reviews để ẩn danh nếu ứng viên yêu cầu
    const mappedReviews = reviews.map((r) => {
      const name = r.isAnonymous
        ? 'Ẩn danh'
        : r.candidate?.jobUser?.fullName || r.candidate?.email || 'Ứng viên';
      return {
        id: r.id,
        rating: r.rating,
        reviewText: r.reviewText,
        isAnonymous: r.isAnonymous,
        reviewerName: name,
        createdAt: r.createdAt,
      };
    });

    // Tính điểm trung bình
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10,
          ) / 10
        : 0;

    return {
      companyName: company.companyName,
      logoUrl: company.logoUrl,
      averageRating,
      totalReviews,
      reviews: mappedReviews,
    };
  }

  // 3. Xóa đánh giá
  async remove(reviewId: string, userId: string, role: string) {
    const review = await this.prisma.companyReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Đánh giá không tồn tại');
    }

    // Chỉ cho phép admin hoặc chính ứng viên viết review đó xóa
    if (role !== 'admin' && review.candidateId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa đánh giá này');
    }

    return this.prisma.companyReview.delete({
      where: { id: reviewId },
    });
  }
}
