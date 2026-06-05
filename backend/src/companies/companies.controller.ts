import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // Recruiter tạo hồ sơ công ty
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'admin')
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(user.userId, dto);
  }

  // Danh sách tất cả công ty (public)
  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  // Xem công ty của mình (recruiter)
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter')
  getMyCompany(@CurrentUser() user: CurrentUserPayload) {
    return this.companiesService.findByUser(user.userId);
  }

  // Chi tiết một công ty (public)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  // Cập nhật thông tin công ty
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, user.userId, user.role, dto);
  }

  // Admin verify công ty
  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  verify(@Param('id') id: string) {
    return this.companiesService.verify(id);
  }
}
