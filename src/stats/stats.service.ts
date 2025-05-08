import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const users = await this.prisma.user.findMany({
      where: {
        usedquota: {
          gt: 0,
        },
        files: {
          some: {
            createdAt: {
              gte: startOfDay,
            },
          },
        },
      },
      select: {
        userId: true,
        username: true,
        usedquota: true,
      },
    });

    return users.map(user => ({
      userId: user.userId,
      username: user.username,
      totalBytesUsedToday: user.usedquota,
    }));
  }
}
