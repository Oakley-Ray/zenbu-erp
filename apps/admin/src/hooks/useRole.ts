import { useGetIdentity } from '@refinedev/core';

/** 角色中文對照 */
export const ROLE_LABELS: Record<string, string> = {
  platform_owner: '平台擁有者',
  super_admin: '超級管理員',
  admin: '管理員',
  warehouse: '倉管人員',
  sales: '業務人員',
  finance: '財務人員',
  procurement: '採購人員',
  viewer: '檢視者',
  customer: '顧客',
};

/** 角色 → Badge variant */
export const ROLE_VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'neutral' | 'danger'> = {
  platform_owner: 'danger',
  super_admin: 'danger',
  admin: 'info',
  warehouse: 'warning',
  sales: 'success',
  finance: 'info',
  procurement: 'warning',
  viewer: 'neutral',
  customer: 'neutral',
};

/** 可指派的租戶角色（不含 platform_owner 和 customer） */
export const ASSIGNABLE_ROLES = [
  'super_admin',
  'admin',
  'warehouse',
  'sales',
  'finance',
  'procurement',
  'viewer',
] as const;

type Identity = { id: string; name: string; role: string } | null;

/** 取得當前使用者角色，提供權限判斷工具 */
export function useRole() {
  const { data: identity } = useGetIdentity<Identity>();
  const role = (identity as Identity)?.role ?? '';

  /** 管理員級別（可管理使用者、查看全部功能） */
  const isAdmin = ['platform_owner', 'super_admin', 'admin'].includes(role);

  /** 超級管理員（可停用使用者） */
  const isSuperAdmin = ['platform_owner', 'super_admin'].includes(role);

  /** 檢查是否有指定角色的存取權 */
  function hasAccess(allowed: string[]): boolean {
    if (role === 'platform_owner') return true;
    return allowed.includes(role);
  }

  return { role, isAdmin, isSuperAdmin, hasAccess, identity: identity as Identity };
}
