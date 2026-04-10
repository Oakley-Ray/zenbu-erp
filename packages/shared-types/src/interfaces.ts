import { TenantRole, PlatformRole } from './enums';

/** JWT Payload — Access Token 解碼後的內容 */
export interface JwtPayload {
  sub: string;        // user id
  tenantId: string;
  role: TenantRole | PlatformRole;
  iat?: number;
  exp?: number;
}

/** 租戶品牌主題配置 */
export interface TenantTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily?: string;
  logoUrl?: string;
}

/** 租戶功能開關 */
export interface TenantConfig {
  modules: {
    erp: boolean;
    logistics: boolean;
    ecommerce: boolean;
    analytics: boolean;
  };
  features: {
    offlineSync: boolean;
    mfa: boolean;
    customDomain: boolean;
  };
}

/** API 分頁回應 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** API 錯誤回應 */
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

/** 材積重計算輸入 */
export interface VolumetricWeightInput {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  divisor?: number;  // 預設 5000（國際標準）
}
