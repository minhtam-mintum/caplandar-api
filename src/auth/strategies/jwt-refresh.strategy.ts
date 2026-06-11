import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    const opts: StrategyOptionsWithRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET') as string,
      ignoreExpiration: false,
      passReqToCallback: true,
    };
    super(opts);
  }

  validate(req: Request, payload: JwtPayload) {
    if (!payload.sub) throw new UnauthorizedException();
    const authHeader = (req.headers.authorization as string) ?? '';
    const refreshToken = authHeader.replace(/^Bearer\s+/i, '');
    return { userId: payload.sub, refreshToken };
  }
}
