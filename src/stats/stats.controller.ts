import { AdminGuard } from '../auth/guards/admin.guard';
import { Controller, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.strategy';
import { StatsService } from './stats.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

interface AuthRequest extends Request {
  user: {
    sub: string;
    username: string;
    isAdmin: boolean;
  };
}

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
  async getStats() {
    return this.statsService.getStats();
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get your personal storage statistics' })
  @ApiResponse({ status: 200, description: 'Returns your personal storage statistics' })
  async getMyStats(@Req() req: AuthRequest) {
    return this.statsService.getUserStats(req.user.sub);
  }
}
