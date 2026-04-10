import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@layerframe/shared-types';

/**
 * JWT RS256 策略 — 用公鑰驗證 access token。
 * RS256 比 HS256 安全：私鑰只在後端簽發，公鑰可以分發給任何需要驗證的服務。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const publicKey = config.get<string>('JWT_PUBLIC_KEY');
    if (!publicKey) {
      throw new Error('JWT_PUBLIC_KEY 環境變數未設定');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKey: Buffer.from(publicKey, 'base64').toString('utf-8'),
    });
  }

  /** Passport 驗證通過後，回傳的物件會被附在 request.user 上 */
  validate(payload: JwtPayload): JwtPayload {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload;
  }
}
