import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private idCounter = 1;

  async findByUsername(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }

  async create(user: Partial<User>): Promise<User | undefined> {
    const newUser: User = {
      id: this.idCounter++,
      username: user.username ? user.username : '',
      password: user.password ? user.password : 'thisIsTheDefaultPassword',
      isAdmin: !!user.isAdmin,
    };
    this.users.push(newUser);
    return newUser;
  }
}
