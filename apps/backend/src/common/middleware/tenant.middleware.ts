import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DataSource } from 'typeorm';

/**
 * Tenant Middleware — 從 request header 取出 tenant_id，
 * 設定 PostgreSQL session 變數供 RLS policy 使用。
 *
 * 原理：每個 request 進來時先執行 SET LOCAL，讓該 connection
 * 在這次 transaction 內只能看到屬於該 tenant 的資料。
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly dataSource: DataSource) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;

    // 公開路由（登入、健康檢查）不需要 tenant context
    const publicPaths = ['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/health'];
    if (publicPaths.some((p) => req.path.startsWith(p))) {
      return next();
    }

    if (!tenantId) {
      throw new BadRequestException('缺少 X-Tenant-ID header');
    }

    // 設定 PostgreSQL session 變數，RLS policy 會用 current_setting('app.tenant_id') 取值
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query(`SET LOCAL app.tenant_id = '${tenantId.replace(/'/g, "''")}'`);
    await queryRunner.release();

    // 把 tenantId 附在 request 上，方便後續取用
    (req as any).tenantId = tenantId;
    next();
  }
}
