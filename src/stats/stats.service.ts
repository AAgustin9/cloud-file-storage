import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const users = await this.prisma.user.findMany({
      select: {
        userId: true,
        username: true,
        usedquota: true,
        _count: {
          select: {
            files: true,
          },
        },
      },
    });

    const totalFiles = await this.prisma.file.count();
    const totalStorage = users.reduce((acc, user) => acc + user.usedquota, 0);
    const totalUsers = users.length;

    return {
      users: users.map((user) => ({
        userId: user.userId,
        username: user.username,
        usedQuota: user.usedquota,
        fileCount: user._count.files,
      })),
      summary: {
        totalUsers,
        totalFiles,
        totalStorage,
        averageStoragePerUser: totalUsers > 0 ? totalStorage / totalUsers : 0,
      },
    };
  }

  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        username: true,
        usedquota: true,
        _count: {
          select: {
            files: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const recentFiles = await this.prisma.file.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        size: true,
        createdAt: true,
      },
    });


    const maxQuota = 5 * 1024 * 1024 * 1024;
    const quotaPercentage = (user.usedquota / maxQuota) * 100;

    return {
      userId: user.userId,
      username: user.username,
      usedQuota: user.usedquota,
      usedQuotaHuman: this.formatBytes(user.usedquota),
      maxQuota: this.formatBytes(maxQuota),
      quotaPercentage: parseFloat(quotaPercentage.toFixed(2)),
      fileCount: user._count.files,
      recentFiles,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
