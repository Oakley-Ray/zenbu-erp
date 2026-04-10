import { z } from 'zod';

/** 登入 schema */
export const loginSchema = z.object({
  email: z.string().email('Email 格式不正確'),
  password: z.string().min(8, '密碼至少需要 8 個字元'),
});

/** 建立使用者 schema */
export const createUserSchema = z.object({
  email: z.string().email('Email 格式不正確'),
  password: z.string().min(8, '密碼至少需要 8 個字元'),
  name: z.string().min(1, '名稱為必填'),
  role: z
    .enum(['super_admin', 'admin', 'warehouse', 'sales', 'finance', 'viewer'])
    .optional(),
});

/** 建立租戶 schema */
export const createTenantSchema = z.object({
  name: z.string().min(1, '租戶名稱為必填'),
  slug: z
    .string()
    .min(3, 'Slug 至少 3 個字元')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug 只能包含小寫英文、數字和連字號'),
  customDomain: z.string().optional(),
  theme: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      fontFamily: z.string().optional(),
    })
    .optional(),
});

/** UUID schema */
export const uuidSchema = z.string().uuid('無效的 UUID 格式');

/** 分頁 query schema */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
