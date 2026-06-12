import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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

    // 3. Tạo User account
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role,
      },
    });

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
        isActive: true,
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
