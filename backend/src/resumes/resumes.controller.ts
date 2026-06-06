import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ResumesService } from './resumes.service';
import {
  CreateResumeDto,
  UpdateResumeDto,
  CreateWorkExperienceDto,
  CreateEducationDto,
  CreateCertificationDto,
} from './dto/resume.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Controller('resumes')
@UseGuards(JwtAuthGuard)
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  // Tạo CV mới
  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateResumeDto,
  ) {
    return this.resumesService.create(user.userId, dto);
  }

  // Xem tất cả CV của mình
  @Get('me')
  findMyResumes(@CurrentUser() user: CurrentUserPayload) {
    return this.resumesService.findAllByUser(user.userId);
  }

  // Xem một CV cụ thể
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.resumesService.findOne(id, user.userId, user.role);
  }

  // Cập nhật CV
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateResumeDto,
  ) {
    return this.resumesService.update(id, user.userId, dto);
  }

  // Xóa CV
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.resumesService.remove(id, user.userId);
  }

  // ========== Work Experience ==========

  @Post(':id/experiences')
  addExperience(
    @Param('id') resumeId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateWorkExperienceDto,
  ) {
    return this.resumesService.addExperience(resumeId, user.userId, dto);
  }

  @Delete('experiences/:expId')
  removeExperience(
    @Param('expId') expId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.resumesService.removeExperience(expId, user.userId);
  }

  // ========== Education ==========

  @Post(':id/educations')
  addEducation(
    @Param('id') resumeId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateEducationDto,
  ) {
    return this.resumesService.addEducation(resumeId, user.userId, dto);
  }

  @Delete('educations/:eduId')
  removeEducation(
    @Param('eduId') eduId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.resumesService.removeEducation(eduId, user.userId);
  }

  // ========== Certification ==========

  @Post(':id/certifications')
  addCertification(
    @Param('id') resumeId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCertificationDto,
  ) {
    return this.resumesService.addCertification(resumeId, user.userId, dto);
  }

  @Delete('certifications/:certId')
  removeCertification(
    @Param('certId') certId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.resumesService.removeCertification(certId, user.userId);
  }
}
