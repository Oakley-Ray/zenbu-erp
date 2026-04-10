import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASS', 'postgres'),
        database: config.get<string>('DB_NAME', 'layerframe'),
        entities: [
          path.join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}'),
        ],
        migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
        synchronize: config.get('APP_ENV') === 'development',
        logging: config.get('APP_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
