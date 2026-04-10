import { SetMetadata } from '@nestjs/common';

/** 標記公開路由，跳過 JWT 驗證 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
