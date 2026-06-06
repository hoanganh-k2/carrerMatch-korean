import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto, AssignPermissionDto } from './dto/permission.dto';

@Injectable()
export class RolesPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ========== PERMISSIONS CRUD ==========

  async createPermission(dto: CreatePermissionDto) {
    const existing = await this.prisma.permission.findUnique({
      where: { name: dto.name },
    });
    if (existing)
      throw new ConflictException(`Permission "${dto.name}" đã tồn tại`);
    return this.prisma.permission.create({ data: dto });
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async removePermission(permissionId: string) {
    const perm = await this.prisma.permission.findUnique({
      where: { permissionId },
    });
    if (!perm)
      throw new NotFoundException(`Permission "${permissionId}" không tồn tại`);
    return this.prisma.permission.delete({ where: { permissionId } });
  }

  // ========== USER PERMISSIONS (ASSIGN/REVOKE) ==========

  async assignPermissionToUser(userId: string, dto: AssignPermissionDto) {
    // Kiểm tra user tồn tại
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User "${userId}" không tồn tại`);

    // Kiểm tra permission tồn tại
    const perm = await this.prisma.permission.findUnique({
      where: { permissionId: dto.permissionId },
    });
    if (!perm)
      throw new NotFoundException(
        `Permission "${dto.permissionId}" không tồn tại`,
      );

    // Tránh duplicate
    const existing = await this.prisma.userPermission.findUnique({
      where: {
        userId_permissionId: { userId, permissionId: dto.permissionId },
      },
    });
    if (existing) throw new ConflictException('User đã có permission này');

    return this.prisma.userPermission.create({
      data: { userId, permissionId: dto.permissionId },
      include: { permission: true },
    });
  }

  async revokePermissionFromUser(userId: string, permissionId: string) {
    const userPerm = await this.prisma.userPermission.findUnique({
      where: { userId_permissionId: { userId, permissionId } },
    });
    if (!userPerm) throw new NotFoundException('User không có permission này');
    return this.prisma.userPermission.delete({
      where: { userId_permissionId: { userId, permissionId } },
    });
  }

  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User "${userId}" không tồn tại`);
    return this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });
  }

  // ========== SEED DEFAULT PERMISSIONS ==========

  async seedDefaultPermissions() {
    const defaultPermissions = [
      {
        name: 'user:read',
        resource: 'user',
        action: 'read',
        description: 'Xem thông tin user',
      },
      {
        name: 'user:manage',
        resource: 'user',
        action: 'manage',
        description: 'Quản lý tất cả users',
      },
      {
        name: 'job:create',
        resource: 'job',
        action: 'create',
        description: 'Tạo tin tuyển dụng',
      },
      {
        name: 'job:read',
        resource: 'job',
        action: 'read',
        description: 'Xem tin tuyển dụng',
      },
      {
        name: 'job:update',
        resource: 'job',
        action: 'update',
        description: 'Sửa tin tuyển dụng',
      },
      {
        name: 'job:delete',
        resource: 'job',
        action: 'delete',
        description: 'Xóa tin tuyển dụng',
      },
      {
        name: 'company:verify',
        resource: 'company',
        action: 'verify',
        description: 'Xác minh công ty',
      },
      {
        name: 'company:manage',
        resource: 'company',
        action: 'manage',
        description: 'Quản lý tất cả công ty',
      },
      {
        name: 'application:read',
        resource: 'application',
        action: 'read',
        description: 'Xem đơn ứng tuyển',
      },
      {
        name: 'application:manage',
        resource: 'application',
        action: 'manage',
        description: 'Quản lý đơn ứng tuyển',
      },
      {
        name: 'resume:read',
        resource: 'resume',
        action: 'read',
        description: 'Xem CV ứng viên',
      },
    ];

    const results: Array<{
      permissionId: string;
      name: string;
      resource: string;
      action: string;
      description: string | null;
    }> = [];
    for (const perm of defaultPermissions) {
      const created = await this.prisma.permission.upsert({
        where: { name: perm.name },
        create: perm,
        update: {},
      });
      results.push(created);
    }
    return {
      message: `Đã seed ${results.length} permissions mặc định`,
      permissions: results,
    };
  }
}
