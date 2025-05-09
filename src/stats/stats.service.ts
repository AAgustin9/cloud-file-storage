import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GlobalStats } from './stats.interfaces';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<GlobalStats> {
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
    const totalStorage = users.reduce((acc, user) => acc + Number(user.usedquota), 0);
    const totalUsers = users.length;

    return {
      users: users.map((user) => ({
        userId: user.userId,
        username: user.username,
        usedQuota: Number(user.usedquota),
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
}
