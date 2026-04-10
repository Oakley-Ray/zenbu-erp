import * as crypto from 'crypto';
import {
  PaymentProvider,
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentCallbackResult,
  PaymentQueryResult,
  RefundParams,
  RefundResult,
} from '../interfaces/payment-provider.interface';

export interface UnipayConfig {
  merchantId: string;
  hashKey: string;
  hashIv: string;
  sandbox: boolean;
}

const SANDBOX_URL = 'https://test-payment.pchomepay.com.tw/api/pay';
const PRODUCTION_URL = 'https://payment.pchomepay.com.tw/api/pay';

const SANDBOX_REFUND_URL = 'https://test-payment.pchomepay.com.tw/api/refund';
const PRODUCTION_REFUND_URL = 'https://payment.pchomepay.com.tw/api/refund';

/**
 * 統一金流（PChomePay 統一數位翰宇）Strategy。
 *
 * 流程：
 * 1. 後端組合付款參數 + 產生 SHA256 簽章
 * 2. 回傳 HTML form 讓前端自動 submit 到統一金付款頁
 * 3. 顧客在統一金頁面付款
 * 4. 統一金 POST 回呼到 notifyUrl（webhook）
 * 5. 後端驗證簽章後更新訂單狀態
 */
export class UnipayStrategy implements PaymentProvider {
  readonly providerName = 'unipay';
  private config: UnipayConfig;

  constructor(config: UnipayConfig) {
    this.config = config;
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const timestamp = this.formatTimestamp(new Date());

    const baseParams: Record<string, string> = {
      MerchantID: this.config.merchantId,
      OrderID: params.orderNumber.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20),
      Amount: String(Math.round(params.amount)),
      Currency: params.currency || 'TWD',
      ItemDesc: params.description,
      ReturnURL: params.returnUrl,
      NotifyURL: params.notifyUrl,
      Timestamp: timestamp,
      CustomField: params.orderId,
    };

    // 產生簽章
    baseParams['CheckCode'] = this.generateCheckCode(baseParams);

    // 組合 HTML form 自動 submit
    const actionUrl = this.config.sandbox ? SANDBOX_URL : PRODUCTION_URL;
    const formFields = Object.entries(baseParams)
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${this.escapeHtml(v)}" />`)
      .join('\n');

    const html = `
      <form id="unipay-form" method="POST" action="${actionUrl}">
        ${formFields}
      </form>
      <script>document.getElementById('unipay-form').submit();</script>
    `;

    return {
      transactionId: params.orderId,
      type: 'form',
      data: html,
    };
  }

  async verifyCallback(payload: Record<string, unknown>): Promise<PaymentCallbackResult> {
    const data = payload as Record<string, string>;

    // 取出 CheckCode 並驗證
    const receivedCode = data['CheckCode'];
    const paramsWithoutCode = { ...data };
    delete paramsWithoutCode['CheckCode'];

    const expectedCode = this.generateCheckCode(paramsWithoutCode);
    const isValid = receivedCode?.toUpperCase() === expectedCode.toUpperCase();

    const status = data['Status'];
    const success = isValid && status === 'SUCCESS';

    return {
      success,
      transactionId: data['CustomField'] ?? '',
      orderId: data['CustomField'] ?? '',
      amount: Number(data['Amount'] ?? 0),
      providerTransactionId: data['TransactionID'],
      message: success ? '付款成功' : (data['Message'] ?? '付款失敗'),
      rawData: data,
    };
  }

  async queryPayment(transactionId: string): Promise<PaymentQueryResult> {
    // 統一金查詢 API 需額外整合，這裡留佔位
    return {
      status: 'pending',
      transactionId,
      amount: 0,
    };
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    const timestamp = this.formatTimestamp(new Date());

    const requestBody: Record<string, string> = {
      MerchantID: this.config.merchantId,
      TransactionID: params.transactionId,
      Amount: String(Math.round(params.amount)),
      Timestamp: timestamp,
    };

    requestBody['CheckCode'] = this.generateCheckCode(requestBody);

    const refundUrl = this.config.sandbox ? SANDBOX_REFUND_URL : PRODUCTION_REFUND_URL;

    const response = await fetch(refundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = (await response.json()) as {
      Status: string;
      Message: string;
      RefundID?: string;
    };

    const success = data.Status === 'SUCCESS';

    return {
      success,
      refundId: data.RefundID,
      message: data.Message ?? (success ? '退款成功' : '退款失敗'),
    };
  }

  // ── 內部方法 ──

  /**
   * CheckCode 簽章 — 統一金的簽章機制。
   * 1. 參數按 key 排序
   * 2. 組成 query string
   * 3. 前後加 HashKey / HashIV
   * 4. SHA256 取 hex 轉大寫
   */
  private generateCheckCode(params: Record<string, string>): string {
    const sorted = Object.keys(params)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map((k) => `${k}=${params[k]}`)
      .join('&');

    const raw = `HashKey=${this.config.hashKey}&${sorted}&HashIV=${this.config.hashIv}`;
    return crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
  }

  private formatTimestamp(date: Date): string {
    return Math.floor(date.getTime() / 1000).toString();
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
