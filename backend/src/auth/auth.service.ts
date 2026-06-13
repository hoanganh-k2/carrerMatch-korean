import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly frontendUrl =
    process.env.FRONTEND_URL ?? 'http://localhost:5173';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // Hash token để lưu DB (không lưu token thô)
  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    // 1. Kiểm tra email đã tồn tại chưa
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role: Role = dto.role ?? 'candidate';

    // 3. Tạo User account (kèm token xác minh email)
    const verifyTokenRaw = crypto.randomBytes(32).toString('hex');
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role,
        emailVerifyToken: this.hashToken(verifyTokenRaw),
      },
    });

    // Gửi email xác minh (không chặn nếu lỗi)
    void this.mailService.sendVerifyEmail(
      user.email,
      `${this.frontendUrl}/verify-email?token=${verifyTokenRaw}`,
    );

    // 4. Tạo profile theo role
    if (role === 'candidate') {
      await this.prisma.jobUser.create({
        data: {
          userId: user.id,
          fullName: dto.fullName,
        },
      });
    } else if (role === 'recruiter') {
      // Recruiter cần tạo Company riêng qua POST /companies sau khi đăng ký
      // Tạo JobUser profile cơ bản để lưu tên
      await this.prisma.jobUser.create({
        data: {
          userId: user.id,
          fullName: dto.fullName,
        },
      });
    }

    // 5. Trả về JWT
    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    // 1. Tìm user theo email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // 3. Trả về JWT
    return this.generateTokens(user.id, user.email, user.role);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        jobUser: {
          select: {
            fullName: true,
            topikLevel: true,
            yearsExperience: true,
            openToWork: true,
            profileCompleteness: true,
          },
        },
        company: {
          select: {
            companyId: true,
            companyName: true,
            logoUrl: true,
            isVerified: true,
          },
        },
      },
    });
    return user;
  }

  // Đổi mật khẩu (đã đăng nhập)
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Người dùng không tồn tại');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { message: 'Đổi mật khẩu thành công' };
  }

  // Quên mật khẩu: tạo token, gửi email. Luôn trả 200 để tránh dò email.
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user && user.isActive) {
      const tokenRaw = crypto.randomBytes(32).toString('hex');
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: this.hashToken(tokenRaw),
          resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 phút
        },
      });
      void this.mailService.sendPasswordResetEmail(
        user.email,
        `${this.frontendUrl}/reset-password?token=${tokenRaw}`,
      );
    }

    return {
      message:
        'Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.',
    };
  }

  // Đặt lại mật khẩu bằng token
  async resetPassword(dto: ResetPasswordDto) {
    const hashed = this.hashToken(dto.token);
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: hashed,
        resetTokenExpiry: { gt: new Date() },
      },
    });
    if (!user) {
      throw new BadRequestException(
        'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });
    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  // Xác minh email bằng token
  async verifyEmail(token: string) {
    const hashed = this.hashToken(token);
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: hashed },
    });
    if (!user) {
      throw new BadRequestException('Liên kết xác minh không hợp lệ');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });
    return { message: 'Xác minh email thành công' };
  }

  // Gửi lại email xác minh (đã đăng nhập)
  async resendVerifyEmail(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Người dùng không tồn tại');
    if (user.isEmailVerified) {
      return { message: 'Email đã được xác minh' };
    }
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken: this.hashToken(tokenRaw) },
    });
    void this.mailService.sendVerifyEmail(
      user.email,
      `${this.frontendUrl}/verify-email?token=${tokenRaw}`,
    );
    return { message: 'Đã gửi lại email xác minh' };
  }

  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return {
      accessToken,
      tokenType: 'Bearer',
      user: { id: userId, email, role },
    };
  }
}
