import { TenantRole } from './enums';

/** 登入請求 */
export interface LoginDto {
  email: string;
  password: string;
}

/** 登入回應 */
export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** 建立使用者 */
export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  role?: TenantRole;
}

/** 更新使用者 */
export interface UpdateUserDto {
  name?: string;
  password?: string;
  role?: TenantRole;
  isActive?: boolean;
}

/** 建立租戶 */
export interface CreateTenantDto {
  name: string;
  slug: string;
  customDomain?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
}
