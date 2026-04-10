import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RefreshToken } from './refresh-token.entity';
import { UsersService } from '../users/users.service';
import { JwtPayload } from '@layerframe/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly usersService: UsersService,
  ) {}

  /** 登入：驗證密碼 → 簽發 access + refresh token */
  async login(email: string, password: string, tenantId: string) {
    const user = await this.usersService.findByEmail(email, tenantId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('帳號或密碼錯誤');
    }

    return this.issueTokens(user.id, tenantId, user.role);
  }

  /** Refresh Token Rotation：舊 token 作廢，簽發新的一組 */
  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const record = await this.refreshTokenRepo.findOne({ where: { tokenHash } });

    if (!record || record.isRevoked || record.expiresAt < new Date()) {
      // 如果 token 已被用過（isRevoked），可能是 token 被偷 → 撤銷該使用者所有 token
      if (record?.isRevoked) {
        await this.revokeAllTokens(record.userId);
      }
      throw new ForbiddenException('Refresh token 無效或已過期');
    }

    // 標記舊 token 為已使用
    record.isRevoked = true;
    await this.refreshTokenRepo.save(record);

    const user = await this.usersService.findById(record.userId, record.tenantId);
    return this.issueTokens(user.id, record.tenantId, user.role);
  }

  /** 登出：撤銷指定 refresh token */
  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.refreshTokenRepo.update({ tokenHash }, { isRevoked: true });
  }

  /** 撤銷某使用者的所有 refresh token（強制登出所有裝置） */
  async revokeAllTokens(userId: string) {
    await this.refreshTokenRepo.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  /** 清除過期的 refresh token（可排程執行） */
  async cleanExpiredTokens() {
    await this.refreshTokenRepo.delete({ expiresAt: LessThan(new Date()) });
  }

  // ── 內部方法 ──

  private async issueTokens(userId: string, tenantId: string, role: string) {
    const payload: JwtPayload = { sub: userId, tenantId, role: role as any };

    const privateKey = this.config.get<string>('JWT_PRIVATE_KEY');
    if (!privateKey) throw new Error('JWT_PRIVATE_KEY 未設定');

    // 簽發 access token（RS256，短效期）
    const accessToken = this.jwtService.sign(payload, {
      algorithm: 'RS256',
      privateKey: Buffer.from(privateKey, 'base64').toString('utf-8'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
    });

    // 產生不透明 refresh token（隨機 bytes，不是 JWT）
    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    // 計算過期時間
    const refreshExpiry = this.config.get('JWT_REFRESH_EXPIRY', '7d');
    const expiresAt = new Date();
    const days = parseInt(refreshExpiry);
    expiresAt.setDate(expiresAt.getDate() + (isNaN(days) ? 7 : days));

    // 存入資料庫
    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        tokenHash,
        userId,
        tenantId,
        expiresAt,
      }),
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 分鐘（秒）
    };
  }

  /** SHA-256 hash refresh token，避免明文存資料庫 */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
