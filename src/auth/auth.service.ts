import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.usersService.findByUsername(dto.username);
    if (existing) throw new ConflictException('Username already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.usersService.create({
      username: dto.username,
      password: hashedPassword,
      isAdmin: false,
    });

    return { message: 'User registered successfully' };
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.usersService.findByUsername(dto.username);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.userId,
      username: user.username,
      isAdmin: user.role === 'ADMIN',
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h',
      }),
    };
  }
}
