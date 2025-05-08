import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UsersService {
  private users: User[] = [];

  async findByUsername(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }

  async create(user: Partial<User>): Promise<User | undefined> {
    const newUser: User = {
      id: uuid(),
      username: user.username ? user.username : '',
      password: user.password ? user.password : 'thisIsTheDefaultPassword',
      isAdmin: !!user.isAdmin,
    };
    this.users.push(newUser);
    return newUser;
  }
}
