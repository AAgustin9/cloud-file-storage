import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async create(user: { username: string; password: string; isAdmin?: boolean }): Promise<User> {
    const created = await this.prisma.user.create({
      data: {
        username: user.username,
        password: user.password,
        role: user.isAdmin ? Role.ADMIN : Role.USER,
      },
    });

    return created;
  }
}
