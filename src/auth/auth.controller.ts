import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.strategy';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

interface AuthenticatedUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto): Promise<{ access_token: string }> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('protected')
  protectedRoute(@Request() req: Request & { user: AuthenticatedUser }): {
    message: string;
    user: AuthenticatedUser;
  } {
    return { message: 'Access granted', user: req.user };
  }
}
