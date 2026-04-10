import { DataSource, DataSourceOptions } from 'typeorm';
import * as path from 'path';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASS ?? 'postgres',
  database: process.env.DB_NAME ?? 'layerframe',
  // 自動載入 src/modules/**/entities/*.entity.ts
  entities: [path.join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: process.env.APP_ENV === 'development', // 僅開發環境自動同步 schema
  logging: process.env.APP_ENV === 'development',
};

// TypeORM CLI 用（migration:generate / migration:run）
export default new DataSource(dataSourceOptions);
