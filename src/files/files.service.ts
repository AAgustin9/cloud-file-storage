import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './services/storage.service';
import { v4 as uuid } from 'uuid';
import { MAX_MONTHLY_BYTES } from '../utils/constants';

@Injectable()
export class FilesService {
  private MAX_MONTHLY_BYTES = MAX_MONTHLY_BYTES;

  constructor(
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  async uploadFile(file: Express.Multer.File, userId: string): Promise<string> {
    if (!userId) {
      throw new NotFoundException('User ID is missing or invalid');
    }

    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (Number(user.usedquota) + file.size > Number(this.MAX_MONTHLY_BYTES)) {
      throw new ForbiddenException(`Cannot upload file: quota exceeded`);
    }

    const key = `${uuid()}-${file.originalname}`;
    const url = await this.storageService.upload(file, key);

    await this.prisma.$transaction([
      this.prisma.file.create({
        data: {
          id: key,
          name: file.originalname,
          size: file.size,
          userId,
        },
      }),
      this.prisma.user.update({
        where: { userId },
        data: {
          usedquota: {
            increment: file.size,
          },
        },
      }),
    ]);

    return url;
  }

  async delete(fileKey: string, userId: string): Promise<void> {
    if (!userId) {
      throw new NotFoundException('User ID is missing or invalid');
    }

    const file = await this.prisma.file.findUnique({
      where: { id: fileKey },
    });

    if (!file) {
      throw new NotFoundException(`File with key ${fileKey} not found in database`);
    }

    if (file.userId !== userId) {
      throw new ForbiddenException('Cannot delete files of other users');
    }

    try {
      await this.storageService.delete(fileKey);

      await this.prisma.$transaction([
        this.prisma.file.delete({
          where: { id: fileKey },
        }),
        this.prisma.user.update({
          where: { userId },
          data: {
            usedquota: {
              decrement: file.size,
            },
          },
        }),
      ]);
    } catch (error) {
      console.error(`Error deleting file ${fileKey}: ${error.message}`);
      throw new Error(`Failed to delete file from storage: ${error.message}`);
    }
  }

  async getFile(fileKey: string, userId: string): Promise<string> {
    if (!userId) {
      throw new NotFoundException('User ID is missing or invalid');
    }

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
