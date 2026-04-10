import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@/modules/audit/audit-log.entity';
import { AuditAction, JwtPayload } from '@layerframe/shared-types';

/**
 * Audit Interceptor — 自動記錄所有寫入操作（POST/PATCH/PUT/DELETE）。
 * 讀取操作（GET）不記錄，避免日誌量過大。
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // 只記錄寫入操作
    if (method === 'GET') return next.handle();

    const user: JwtPayload | undefined = request.user;
    const action = this.methodToAction(method);
    const resource = context.getClass().name.replace('Controller', '').toLowerCase();
    const resourceId = request.params?.id;

    return next.handle().pipe(
      tap((responseData) => {
        // 非同步寫入，不阻塞 response
        this.auditRepo
          .save(
            this.auditRepo.create({
              tenantId: user?.tenantId ?? request.tenantId,
              userId: user?.sub,
              action,
              resource,
              resourceId,
              newValue: method !== 'DELETE' ? responseData : undefined,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
            }),
          )
          .catch((err) => {
            // 稽核日誌寫入失敗不應影響業務流程，只 log 錯誤
            console.error('Audit log write failed:', err.message);
          });
      }),
    );
  }

  private methodToAction(method: string): AuditAction {
    switch (method) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PATCH':
      case 'PUT':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.CREATE;
    }
  }
}
