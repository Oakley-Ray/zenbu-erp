import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AuditModule } from './modules/audit/audit.module';
import { ErpModule } from './modules/erp/erp.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { EcommerceModule } from './modules/ecommerce/ecommerce.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PaymentModule } from './modules/payment/payment.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // 環境變數 — 從 .env 檔讀取，在整個 app 中可注入 ConfigService
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate Limiting — 每 60 秒最多 100 個 request（防暴力破解）
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // 資料庫
    DatabaseModule,

    // 功能模組
    TenantsModule,
    AuthModule,
    UsersModule,
    AuditModule,
    ErpModule,
    LogisticsModule,
    EcommerceModule,
    AnalyticsModule,
    PaymentModule,
    NotificationsModule,
    UploadsModule,
    RealtimeModule,
  ],
  controllers: [HealthController],
  providers: [
    // 全域 Guard（執行順序：JWT → Roles → Throttler）
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // 全域 Interceptor — 稽核日誌
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },

    // 全域 Exception Filter — 統一錯誤格式
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Tenant Middleware — 所有 /api/v1 路由都經過
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
