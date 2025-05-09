import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from './user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create({
      username: createUserDto.username,
      password: createUserDto.password,
      isAdmin: false,
    });
  }
}
