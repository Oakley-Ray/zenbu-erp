import { SetMetadata } from '@nestjs/common';
import { TenantRole, PlatformRole } from '@layerframe/shared-types';

export const ROLES_KEY = 'roles';

/** 標記哪些角色可以存取此路由 */
export const Roles = (...roles: (TenantRole | PlatformRole)[]) =>
  SetMetadata(ROLES_KEY, roles);
