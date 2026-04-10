/** 平台級角色（跨租戶） */
export enum PlatformRole {
  PLATFORM_OWNER = 'platform_owner',
}

/** 租戶內角色 */
export enum TenantRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  WAREHOUSE = 'warehouse',
  SALES = 'sales',
  FINANCE = 'finance',
  PROCUREMENT = 'procurement',
  VIEWER = 'viewer',
  CUSTOMER = 'customer',
}

/** 訂單狀態機 */
export enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

/** 付款狀態 */
export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/** 付款方式 */
export enum PaymentProvider {
  ECPAY = 'ecpay',
  LINEPAY = 'linepay',
  SHOPLINE = 'shopline',
  UNIPAY = 'unipay',
}

/** 出貨狀態 */
export enum ShipmentStatus {
  PENDING = 'pending',
  PICKED = 'picked',
  PACKED = 'packed',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
}

/** 物流報價狀態 */
export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

/** 庫存異動類型 */
export enum StockMovementType {
  IN = 'in',
  OUT = 'out',
  ADJUST = 'adjust',
  TRANSFER = 'transfer',
}

/** 稽核日誌動作 */
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
}

// ─── 採購管理 (Procurement) ───

/** 供應商狀態 */
export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLACKLISTED = 'blacklisted',
}

/** 採購訂單狀態機 */
export enum PurchaseOrderStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ORDERED = 'ordered',
  PARTIAL_RECEIVED = 'partial_received',
  RECEIVED = 'received',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

/** PO 審核層級（依金額） */
export enum ApprovalLevel {
  MANAGER = 'manager',       // < 50,000
  DIRECTOR = 'director',     // 50,000 ~ 200,000
  VP = 'vp',                 // > 200,000
}

/** RFQ 狀態 */
export enum RfqStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  QUOTED = 'quoted',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

/** 品質檢驗類型 */
export enum InspectionType {
  EXEMPT = 'exempt',
  SAMPLING = 'sampling',
  FULL = 'full',
}

/** 檢驗結果 */
export enum InspectionResult {
  PASS = 'pass',
  CONDITIONAL_ACCEPT = 'conditional_accept',
  FAIL = 'fail',
}

/** 不合格處置方式 */
export enum DispositionType {
  RETURN = 'return',
  SPECIAL_ACCEPT = 'special_accept',
  SCRAP = 'scrap',
}

/** 退貨原因分類 */
export enum ReturnReason {
  QUALITY_DEFECT = 'quality_defect',
  SPEC_MISMATCH = 'spec_mismatch',
  QUANTITY_ERROR = 'quantity_error',
  TRANSPORT_DAMAGE = 'transport_damage',
}

/** 索賠狀態 */
export enum ClaimStatus {
  PENDING = 'pending',
  NEGOTIATING = 'negotiating',
  AGREED = 'agreed',
  OFFSET = 'offset',
  DISPUTED = 'disputed',
}

/** 收貨單狀態 */
export enum GoodsReceiptStatus {
  DRAFT = 'draft',
  INSPECTING = 'inspecting',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}
