/**
 * PaymentProvider 介面 — Strategy Pattern 核心。
 * 新增金流商（如 Stripe、TapPay）只需實作此介面，
 * 不用改動 PaymentService 的邏輯。
 */
export interface PaymentProvider {
  /** 金流商識別碼 */
  readonly providerName: string;

  /**
   * 建立付款 — 產生前端需要的付款資訊。
   * ECPay：回傳一個 HTML form 讓前端自動 submit
   * LinePay：回傳一個 redirect URL 導向 LinePay 付款頁
   */
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;

  /**
   * 驗證回呼 — 金流商通知付款結果時，驗證簽章/資料完整性。
   * 回傳標準化的付款結果。
   */
  verifyCallback(payload: Record<string, unknown>): Promise<PaymentCallbackResult>;

  /**
   * 查詢付款狀態 — 主動向金流商查詢交易結果。
   */
  queryPayment(transactionId: string): Promise<PaymentQueryResult>;

  /**
   * 退款
   */
  refund(params: RefundParams): Promise<RefundResult>;
}

export interface CreatePaymentParams {
  /** 訂單編號 */
  orderId: string;
  orderNumber: string;
  /** 付款金額 */
  amount: number;
  currency: string;
  /** 商品描述 */
  description: string;
  /** 付款完成後導向的前端 URL */
  returnUrl: string;
  /** 金流商回呼的後端 URL（webhook） */
  notifyUrl: string;
  /** 額外參數 */
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentResult {
  /** 交易識別碼（存入 PaymentTransaction） */
  transactionId: string;
  /** 付款方式：form（HTML 表單自動送出）、redirect（重定向 URL）、qrcode */
  type: 'form' | 'redirect' | 'qrcode';
  /** form 類型：完整 HTML；redirect 類型：URL */
  data: string;
}

export interface PaymentCallbackResult {
  success: boolean;
  transactionId: string;
  orderId: string;
  amount: number;
  /** 金流商的交易編號 */
  providerTransactionId?: string;
  message?: string;
  rawData: Record<string, unknown>;
}

export interface PaymentQueryResult {
  status: 'pending' | 'success' | 'failed' | 'refunded';
  transactionId: string;
  amount: number;
  providerTransactionId?: string;
}

export interface RefundParams {
  transactionId: string;
  amount: number;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  message?: string;
}
