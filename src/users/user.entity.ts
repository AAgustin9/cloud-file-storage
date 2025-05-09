import { Role } from '@prisma/client';

export class User {
  userId: string;
  username: string;
  password: string;
  role: Role;
  usedquota: bigint;
}
