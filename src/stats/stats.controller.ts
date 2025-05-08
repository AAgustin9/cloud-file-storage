import { AdminGuard } from '../auth/guards/admin.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(JwtAuthGuard, AdminGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getStats() {
    return this.statsService.getStats();
  }
}
