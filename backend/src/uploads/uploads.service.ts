import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService implements OnModuleInit {
  onModuleInit() {
    const dirs = [
      path.join(process.cwd(), 'uploads'),
      path.join(process.cwd(), 'uploads', 'cvs'),
      path.join(process.cwd(), 'uploads', 'avatars'),
      path.join(process.cwd(), 'uploads', 'logos'),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  getFilePath(subDir: string, filename: string): string {
    return path.join(process.cwd(), 'uploads', subDir, filename);
  }
}
