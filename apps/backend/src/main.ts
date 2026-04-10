import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 安全 headers
  app.use(helmet());

  // CORS — 從環境變數讀取白名單
  const origins = process.env.CORS_ORIGINS?.split(',') ?? [
    'http://localhost:5173',
  ];
  app.enableCors({ origin: origins, credentials: true });

  // 全域驗證 pipe — 自動擋掉不合規的 request body
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 移除 DTO 沒定義的欄位
      forbidNonWhitelisted: true, // 有多餘欄位直接報錯
      transform: true, // 自動轉型（string → number 等）
    }),
  );

  // 全域路徑前綴
  app.setGlobalPrefix('api/v1');

  const port = process.env.APP_PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}/api/v1`);
}
bootstrap();
