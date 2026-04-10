import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '@/common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 登入 — 公開路由，不需要 JWT */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() dto: { email: string; password: string },
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.authService.login(dto.email, dto.password, tenantId);
  }

  /** 刷新 token — 公開路由 */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: { refreshToken: string }) {
    return this.authService.refresh(dto.refreshToken);
  }

  /** 登出 — 撤銷 refresh token */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: { refreshToken: string }) {
    return this.authService.logout(dto.refreshToken);
  }
}
