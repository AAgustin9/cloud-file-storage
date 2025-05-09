import { AdminGuard } from '../auth/guards/admin.guard';
import { Controller, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { StatsService } from './stats.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GlobalStats } from './stats.interfaces';

@ApiTags('stats')
@ApiBearerAuth()
@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get global storage statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns global storage statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden - Only admins can access this endpoint' })
  @UseGuards(AdminGuard)
  async getStats(): Promise<GlobalStats> {
    return this.statsService.getStats();
  }
}
