import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  username: string;
  isAdmin: boolean;
}

@Injectable()
export class JwtAuthGuard extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      ignoreExpiration: false,
    });
  }

  async validate(payload: JwtPayload): Promise<{ id: string; username: string; isAdmin: boolean }> {
    return { id: payload.sub, username: payload.username, isAdmin: payload.isAdmin };
  }
}
