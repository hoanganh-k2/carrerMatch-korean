import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadsService } from './uploads.service';

const createMulterOptions = (
  subDir: string,
  allowedMimeTypes: string[],
  maxSize: number,
) => ({
  storage: diskStorage({
    destination: `./uploads/${subDir}`,
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          `Chỉ chấp nhận các loại file: ${allowedMimeTypes.join(', ')}`,
        ),
        false,
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: maxSize,
  },
});

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  // 1. Upload CV - dành cho candidate
  @Post('cv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('candidate', 'admin')
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMulterOptions('cvs', ['application/pdf'], 5 * 1024 * 1024), // PDF, max 5MB
    ),
  )
  uploadCv(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file CV để tải lên');
    }
    return {
      message: 'Tải lên CV thành công',
      url: `/uploads/file/cvs/${file.filename}`,
    };
  }

  // 2. Upload Avatar - dành cho mọi user đăng nhập
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMulterOptions(
        'avatars',
        ['image/jpeg', 'image/png'],
        2 * 1024 * 1024,
      ), // JPG/PNG, max 2MB
    ),
  )
  uploadAvatar(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn ảnh đại diện để tải lên');
    }
    return {
      message: 'Tải lên ảnh đại diện thành công',
      url: `/uploads/file/avatars/${file.filename}`,
    };
  }

  // 3. Upload Logo - dành cho recruiter và admin
  @Post('logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'admin')
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMulterOptions(
        'logos',
        ['image/jpeg', 'image/png'],
        2 * 1024 * 1024,
      ), // JPG/PNG, max 2MB
    ),
  )
  uploadLogo(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn ảnh logo để tải lên');
    }
    return {
      message: 'Tải lên logo thành công',
      url: `/uploads/file/logos/${file.filename}`,
    };
  }

  // 4. Upload JD (mô tả công việc) - dành cho recruiter và admin
  @Post('jd')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('recruiter', 'admin')
  @UseInterceptors(
    FileInterceptor(
      'file',
      createMulterOptions(
        'jds',
        [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        5 * 1024 * 1024,
      ), // PDF/DOC/DOCX, max 5MB
    ),
  )
  uploadJd(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file JD để tải lên');
    }
    return {
      message: 'Tải lên JD thành công',
      url: `/uploads/file/jds/${file.filename}`,
    };
  }

  // 5. Stream file ra ngoài cho client (Public)
  @Get('file/:folder/:filename')
  serveFile(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Res() res: any,
  ) {
    // Validate folder
    if (!['cvs', 'avatars', 'logos', 'jds'].includes(folder)) {
      throw new BadRequestException('Thư mục file không hợp lệ');
    }

    const filePath = this.uploadsService.getFilePath(folder, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File không tồn tại');
    }

    res.sendFile(filePath);
  }
}
