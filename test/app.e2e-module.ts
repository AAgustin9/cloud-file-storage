import { Module } from '@nestjs/common';
import { AuthModule } from '../src/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../src/prisma/prisma.module';
import { UsersModule } from '../src/users/users.module';
import { FilesModule } from '../src/files/files.module';
import { StatsModule } from '../src/stats/stats.module';
import { MAX_MONTHLY_BYTES_TEST } from '../src/utils/constants';

import * as constants from '../src/utils/constants';
(constants as any).MAX_MONTHLY_BYTES = MAX_MONTHLY_BYTES_TEST;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    FilesModule,
    StatsModule,
  ],
})
export class AppE2eModule {}
