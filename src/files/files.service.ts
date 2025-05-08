import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './services/storage.service';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FilesService {
  private MAX_MONTHLY_BYTES = 5 * 1024 * 1024 * 1024;

  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  async uploadFile(file: Express.Multer.File, userId: string): Promise<string> {
    const key = `${uuid()}-${file.originalname}`;
    const url = await this.storageService.upload(file, key);

    await this.prisma.file.create({
      data: {
        id: key,
        name: file.originalname,
        size: file.size,
        userId,
      },
    });

    return url;
  }

  async delete(fileKey: string, userId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileKey },
    });
    if (!file) {
      throw new NotFoundException('File not found');
    }
    if (file.userId !== userId) {
      throw new ForbiddenException('Cannot delete files of other users');
    }

    await this.storageService.delete(fileKey);

    await this.prisma.file.delete({
      where: { id: fileKey },
    });
  }

  async getFile(fileKey: string, userId: string): Promise<string> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileKey },
    });
    if (!file) {
      throw new NotFoundException('File not found');
    }
    if (file.userId !== userId) {
      throw new ForbiddenException('Cannot access files of other users');
    }

    return this.storageService.getFile(fileKey);
  }
}
