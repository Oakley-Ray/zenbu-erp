-- layerframe-ops 初始化 SQL
-- 這個檔案會在 PostgreSQL 容器第一次啟動時自動執行

-- 啟用 UUID 擴充（TypeORM uuid primary key 需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 建立 RLS 用的 session 變數設定函式
-- tenant middleware 會在每個 request 設定 app.tenant_id
-- RLS policy 用 current_setting('app.tenant_id') 取值

-- 範例 RLS policy（之後 migration 會正式建立）：
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation ON users
--   USING (tenant_id::text = current_setting('app.tenant_id', true));
