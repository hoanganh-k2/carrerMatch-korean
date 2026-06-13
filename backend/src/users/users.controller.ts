import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateJobUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Admin: xem tất cả users
  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }

  // Xem profile của mình
  @Get('me')
  getMyProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.findOne(user.userId);
  }

  // Admin: xem user theo id
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // Cập nhật thông tin cơ bản (email, avatarUrl, isActive) của mình
  @Patch('me')
  updateMe(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.userId, dto);
  }

  // Cập nhật profile chi tiết (TOPIK, skills, experience, v.v.)
  @Patch('me/profile')
  updateMyProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateJobUserDto,
  ) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  // Tự vô hiệu hóa tài khoản của mình
  @Delete('me')
  deactivateMe(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.deactivate(user.userId);
  }

  // Admin: đổi role của user
  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(id, role);
  }

  // Admin: kích hoạt lại user
  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  activate(@Param('id') id: string) {
    return this.usersService.setActive(id, true);
  }

  // Admin: deactivate user
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}
