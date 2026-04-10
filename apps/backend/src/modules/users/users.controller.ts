import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { TenantRole } from '@layerframe/shared-types';
import { JwtPayload } from '@layerframe/shared-types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** 建立使用者 — 僅 super_admin / admin 可操作 */
  @Post()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  create(
    @Body() dto: { email: string; password: string; name: string; role?: TenantRole },
    @Request() req: { user: JwtPayload },
  ) {
    return this.usersService.create({ ...dto, tenantId: req.user.tenantId });
  }

  /** 列出租戶內所有使用者 */
  @Get()
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  findAll(@Request() req: { user: JwtPayload }) {
    return this.usersService.findAllByTenant(req.user.tenantId);
  }

  /** 取得單一使用者 */
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.usersService.findById(id, req.user.tenantId);
  }

  /** 更新使用者 — 僅 super_admin / admin */
  @Patch(':id')
  @Roles(TenantRole.SUPER_ADMIN, TenantRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { name?: string; password?: string; role?: TenantRole; isActive?: boolean },
    @Request() req: { user: JwtPayload },
  ) {
    return this.usersService.update(id, req.user.tenantId, dto);
  }

  /** 停用使用者（軟刪除） */
  @Delete(':id')
  @Roles(TenantRole.SUPER_ADMIN)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.usersService.deactivate(id, req.user.tenantId);
  }
}
