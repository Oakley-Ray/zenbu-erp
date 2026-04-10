import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
} from '@nestjs/common';
import { Roles } from '@/common/decorators/roles.decorator';
import { StoreService } from '../store.service';
import { TenantRole, JwtPayload } from '@layerframe/shared-types';

/** 商店管理 API — 後台管理員設定商店外觀、政策等 */
@Controller('admin/store')
@Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
export class StoreAdminController {
  constructor(private readonly storeService: StoreService) {}

  @Get('settings')
  getSettings(@Request() req: { user: JwtPayload }) {
    return this.storeService.getSettings(req.user.tenantId);
  }

  @Patch('settings')
  updateSettings(
    @Body() dto: Record<string, unknown>,
    @Request() req: { user: JwtPayload },
  ) {
    return this.storeService.updateSettings(req.user.tenantId, dto);
  }
}
