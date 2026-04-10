/**
 * Demo 資料 Seed Script
 * 用法：npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true}' scripts/seed-demo.ts
 */
import { Client } from 'pg';
import * as crypto from 'crypto';
import * as bcryptModule from 'bcrypt';

const bcrypt = bcryptModule;

const DB = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'layerframe',
};

const TID = '00000000-0000-0000-0000-000000000001';

async function seed() {
  const c = new Client(DB);
  await c.connect();
  console.log('✓ 連接資料庫');

  // ── 0. 清除舊資料 ──
  console.log('→ 清除舊 demo 資料...');
  await c.query(`DELETE FROM order_items WHERE "orderId" IN (SELECT id FROM orders WHERE "tenantId" = $1)`, [TID]);
  await c.query(`DELETE FROM stock_movements WHERE "tenantId" = $1`, [TID]);
  await c.query(`DELETE FROM payment_transactions WHERE "tenantId" = $1`, [TID]);
  await c.query(`DELETE FROM orders WHERE "tenantId" = $1`, [TID]);
  await c.query(`DELETE FROM inventory WHERE "tenantId" = $1`, [TID]);
  await c.query(`DELETE FROM products WHERE "tenantId" = $1`, [TID]);
  await c.query(`DELETE FROM categories WHERE "tenantId" = $1`, [TID]);
  await c.query(`DELETE FROM customers WHERE "tenantId" = $1`, [TID]);
  await c.query(`DELETE FROM daily_sales_snapshots WHERE "tenantId" = $1`, [TID]);
  await c.query(`DELETE FROM carriers WHERE "tenantId" = $1`, [TID]);
  await c.query(`DELETE FROM users WHERE "tenantId" = $1`, [TID]);
  await c.query(`DELETE FROM tenants WHERE id = $1`, [TID]);
  console.log('✓ 清除完成');

  // ── 1. 租戶 ──
  await c.query(`INSERT INTO tenants (id, name, slug, "isActive", theme, config) VALUES ($1, '層構科技 Demo', 'layerframe-demo', true, '{"primaryColor":"#0284c7"}', '{"modules":{"erp":true,"ecommerce":true,"logistics":true,"analytics":true,"payment":true}}') ON CONFLICT (id) DO NOTHING`, [TID]);
  console.log('✓ 租戶');

  // ── 2. Admin ──
  const hash = await bcrypt.hash('demo1234', 12);
  await c.query(`INSERT INTO users (id, "tenantId", email, name, "passwordHash", role, "isActive") VALUES ($1, $2, 'admin@layerframe.com', 'Demo Admin', $3, 'super_admin', true) ON CONFLICT DO NOTHING`, [crypto.randomUUID(), TID, hash]);
  console.log('✓ Admin 帳號');

  // ── 3. 分類 ──
  const catIds: Record<string, string> = {};
  for (const [slug, name] of [['modular', '模組化收納'], ['accessory', '配件'], ['bundle', '組合包']] as const) {
    const id = crypto.randomUUID();
    catIds[slug] = id;
    await c.query(`INSERT INTO categories (id, "tenantId", name, slug, "isActive") VALUES ($1, $2, $3, $4, true) ON CONFLICT DO NOTHING`, [id, TID, name, slug]);
  }
  console.log('✓ 分類');

  // ── 4. 商品 ──
  const products = [
    { name: 'LAYERFRAME 基礎框架 S', sku: 'LF-FRAME-S', price: 1280, cost: 420, cat: 'modular' },
    { name: 'LAYERFRAME 基礎框架 M', sku: 'LF-FRAME-M', price: 1680, cost: 560, cat: 'modular' },
    { name: 'LAYERFRAME 基礎框架 L', sku: 'LF-FRAME-L', price: 2280, cost: 780, cat: 'modular' },
    { name: '層板 - 白橡木紋', sku: 'LF-SHELF-OAK', price: 480, cost: 150, cat: 'accessory' },
    { name: '層板 - 胡桃木紋', sku: 'LF-SHELF-WAL', price: 520, cost: 170, cat: 'accessory' },
    { name: '掛勾配件組（4入）', sku: 'LF-HOOK-4P', price: 320, cost: 85, cat: 'accessory' },
    { name: '磁吸收納盒', sku: 'LF-MAGBOX', price: 580, cost: 190, cat: 'accessory' },
    { name: '入門組合包', sku: 'LF-STARTER', price: 1980, cost: 650, cat: 'bundle' },
    { name: '完整組合包', sku: 'LF-COMPLETE', price: 4280, cost: 1400, cat: 'bundle' },
    { name: '限量聯名款（草稿）', sku: 'LF-COLLAB-01', price: 3680, cost: 1200, cat: 'modular' },
  ];
  const pIds: string[] = [];
  for (const p of products) {
    const id = crypto.randomUUID();
    pIds.push(id);
    const status = p.sku === 'LF-COLLAB-01' ? 'draft' : 'active';
    await c.query(`INSERT INTO products (id, "tenantId", name, sku, price, "costPrice", "categoryId", status, description, images, attributes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'[]','{}') ON CONFLICT DO NOTHING`,
      [id, TID, p.name, p.sku, p.price, p.cost, catIds[p.cat], status, `${p.name} — LAYERFRAME 模組化收納系統`]);
  }
  console.log('✓ 商品 x' + pIds.length);

  // ── 5. 庫存 ──
  const stocks = [150, 120, 80, 200, 180, 300, 160, 50, 30, 0];
  for (let i = 0; i < pIds.length; i++) {
    await c.query(`INSERT INTO inventory (id, "tenantId", "productId", warehouse, quantity, reserved, "safetyStock") VALUES ($1,$2,$3,'main',$4,$5,20) ON CONFLICT DO NOTHING`,
      [crypto.randomUUID(), TID, pIds[i], stocks[i], Math.floor(stocks[i] * 0.1)]);
  }
  console.log('✓ 庫存');

  // ── 6. 客戶 ──
  const custs = [
    { name: '王小明', email: 'ming@example.com', phone: '0912345678', spent: 12680, cnt: 5 },
    { name: '李美玲', email: 'meiling@example.com', phone: '0923456789', spent: 8560, cnt: 3 },
    { name: '張志偉', email: 'zhiwei@example.com', phone: '0934567890', spent: 22400, cnt: 8 },
    { name: '陳雅琪', email: 'yaqi@example.com', phone: '0945678901', spent: 4280, cnt: 1 },
    { name: '林建宏', email: 'jianhong@example.com', phone: '0956789012', spent: 15960, cnt: 6 },
    { name: '黃淑芬', email: 'shufen@example.com', phone: '0967890123', spent: 6780, cnt: 2 },
  ];
  const cIds: string[] = [];
  for (const cu of custs) {
    const id = crypto.randomUUID();
    cIds.push(id);
    await c.query(`INSERT INTO customers (id, "tenantId", name, email, phone, "totalSpent", "orderCount", addresses) VALUES ($1,$2,$3,$4,$5,$6,$7,'[]') ON CONFLICT DO NOTHING`,
      [id, TID, cu.name, cu.email, cu.phone, cu.spent, cu.cnt]);
  }
  console.log('✓ 客戶 x' + cIds.length);

  // ── 7. 訂單 ──
  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];
  const payStats = ['pending', 'success', 'success', 'success', 'success', 'failed'];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const oid = crypto.randomUUID();
    const oNum = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`;
    const si = i % statuses.length;
    const pi = i % pIds.length;
    const ci = i % cIds.length;
    const qty = (i % 3) + 1;
    const up = products[pi].price;
    const sub = up * qty;
    const ship = 150;
    const total = sub + ship;
    const daysAgo = Math.floor(Math.random() * 30);
    const dt = new Date(now.getTime() - daysAgo * 86400000);

    await c.query(`INSERT INTO orders (id, "tenantId", "orderNumber", "customerId", "customerName", subtotal, "shippingFee", discount, "totalAmount", currency, status, "paymentStatus", "shippingAddress", "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,'TWD',$9,$10,$11,$12) ON CONFLICT DO NOTHING`,
      [oid, TID, oNum, cIds[ci], custs[ci].name, sub, ship, total, statuses[si], payStats[si],
        JSON.stringify({ recipient: custs[ci].name, phone: custs[ci].phone, address: '台北市大安區忠孝東路四段100號' }), dt]);

    await c.query(`INSERT INTO order_items (id, "orderId", "productId", "productName", quantity, "unitPrice", subtotal) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
      [crypto.randomUUID(), oid, pIds[pi], products[pi].name, qty, up, sub]);
  }
  console.log('✓ 訂單 x12');

  // ── 8. Analytics 快照 ──
  for (let d = 30; d >= 0; d--) {
    const dt = new Date(now.getTime() - d * 86400000);
    const ds = dt.toISOString().split('T')[0];
    const rev = Math.floor(8000 + Math.random() * 25000);
    const oc = Math.floor(3 + Math.random() * 12);
    await c.query(`INSERT INTO daily_sales_snapshots (id, "tenantId", date, revenue, "orderCount", "averageOrderValue", "newCustomers", "cancelledOrders", "refundAmount", "uniqueCustomers") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9) ON CONFLICT DO NOTHING`,
      [crypto.randomUUID(), TID, ds, rev, oc, Math.round(rev / oc), Math.floor(Math.random() * 5), Math.floor(Math.random() * 2), Math.floor(Math.random() * 3) + 2]);
  }
  console.log('✓ Analytics 快照 x31');

  // ── 9. 物流商 ──
  for (const cr of [
    { code: 'tcat', name: '黑貓宅急便', zones: ['domestic'], model: 'flat_rate', rates: { flatRate: 150 }, div: 5000, min: 150, days: { domestic: '1-2' } },
    { code: 'dhl', name: 'DHL Express', zones: ['asia', 'north_america', 'europe'], model: 'per_kg', rates: { pricePerKg: 280 }, div: 5000, min: 800, days: { asia: '3-5', north_america: '5-7', europe: '5-7' } },
    { code: 'fedex', name: 'FedEx International', zones: ['north_america', 'europe', 'oceania'], model: 'tiered', rates: { tiers: [{ maxKg: 5, price: 1200 }, { maxKg: 10, price: 2000 }, { maxKg: 20, price: 3500 }] }, div: 5000, min: 1200, days: { north_america: '5-7', europe: '7-10', oceania: '7-10' } },
  ]) {
    await c.query(`INSERT INTO carriers (id, "tenantId", code, name, zones, "pricingModel", rates, "volumetricDivisor", "minimumCharge", "estimatedDays", "isActive") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true) ON CONFLICT DO NOTHING`,
      [crypto.randomUUID(), TID, cr.code, cr.name, JSON.stringify(cr.zones), cr.model, JSON.stringify(cr.rates), cr.div, cr.min, JSON.stringify(cr.days)]);
  }
  console.log('✓ 物流商 x3');

  await c.end();

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║  ✅ Demo 資料建立完成！               ║');
  console.log('║                                      ║');
  console.log('║  Email:  admin@layerframe.com         ║');
  console.log('║  密碼:   demo1234                     ║');
  console.log('║  Tenant: ' + TID + '  ║');
  console.log('║                                      ║');
  console.log('║  前端: http://localhost:5173           ║');
  console.log('╚══════════════════════════════════════╝');
}

seed().catch((e) => { console.error('❌', e.message); process.exit(1); });
