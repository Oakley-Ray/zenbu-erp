import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TenantRole, PlatformRole, JwtPayload } from '@layerframe/shared-types';

/**
 * RBAC Guard — 檢查使用者角色是否在允許清單中。
 * 搭配 @Roles() decorator 使用。
 * platform_owner 擁有最高權限，自動通過所有檢查。
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      (TenantRole | PlatformRole)[]
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    // 沒有設定 @Roles() 的路由，任何登入使用者都可以存取
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) throw new ForbiddenException('未登入');

    // platform_owner 自動通過
    if (user.role === PlatformRole.PLATFORM_OWNER) return true;

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('權限不足');
    }

    return true;
  }
}
