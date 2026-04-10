import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditInterceptor } from '@/common/interceptors/audit.interceptor';

@Global() // 全域模組，讓 AuditInterceptor 可以注入 AuditLog Repository
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditInterceptor],
  exports: [AuditInterceptor, TypeOrmModule],
})
export class AuditModule {}
