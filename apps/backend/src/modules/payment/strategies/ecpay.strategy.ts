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

export interface EcpayConfig {
  merchantId: string;
  hashKey: string;
  hashIv: string;
  /** 正式 or 測試環境 */
  sandbox: boolean;
}

const SANDBOX_URL = 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';
const PRODUCTION_URL = 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5';

/**
 * ECPay（綠界）金流 Strategy。
 *
 * 流程：
 * 1. 後端組合付款參數 + 產生 CheckMacValue 簽章
 * 2. 回傳 HTML form 讓前端自動 submit 到 ECPay
 * 3. 顧客在 ECPay 頁面付款
 * 4. ECPay POST 回呼到 notifyUrl（webhook）
 * 5. 後端驗證 CheckMacValue 後更新訂單狀態
 */
export class EcpayStrategy implements PaymentProvider {
  readonly providerName = 'ecpay';
  private config: EcpayConfig;

  constructor(config: EcpayConfig) {
    this.config = config;
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const tradeDate = new Date();
    const tradeDateStr = this.formatDate(tradeDate);

    const baseParams: Record<string, string> = {
      MerchantID: this.config.merchantId,
      MerchantTradeNo: params.orderNumber.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20),
      MerchantTradeDate: tradeDateStr,
      PaymentType: 'aio',
      TotalAmount: String(Math.round(params.amount)),
      TradeDesc: encodeURIComponent(params.description),
      ItemName: params.description,
      ReturnURL: params.notifyUrl,
      OrderResultURL: params.returnUrl,
      ChoosePayment: 'ALL',
      EncryptType: '1', // SHA256
      CustomField1: params.orderId,
    };

    // 產生 CheckMacValue
    baseParams['CheckMacValue'] = this.generateCheckMac(baseParams);

    // 組合成自動 submit 的 HTML form
    const actionUrl = this.config.sandbox ? SANDBOX_URL : PRODUCTION_URL;
    const formFields = Object.entries(baseParams)
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${this.escapeHtml(v)}" />`)
      .join('\n');

    const html = `
      <form id="ecpay-form" method="POST" action="${actionUrl}">
        ${formFields}
      </form>
      <script>document.getElementById('ecpay-form').submit();</script>
    `;

    return {
      transactionId: params.orderId,
      type: 'form',
      data: html,
    };
  }

  async verifyCallback(payload: Record<string, unknown>): Promise<PaymentCallbackResult> {
    const data = payload as Record<string, string>;

    // 取出 CheckMacValue 後驗證
    const receivedMac = data['CheckMacValue'];
    const paramsWithoutMac = { ...data };
    delete paramsWithoutMac['CheckMacValue'];

    const expectedMac = this.generateCheckMac(paramsWithoutMac);
    const isValid = receivedMac?.toUpperCase() === expectedMac.toUpperCase();

    const rtnCode = data['RtnCode'];
    const success = isValid && rtnCode === '1';

    return {
      success,
      transactionId: data['CustomField1'] ?? '',
      orderId: data['CustomField1'] ?? '',
      amount: Number(data['TradeAmt'] ?? 0),
      providerTransactionId: data['TradeNo'],
      message: success ? '付款成功' : (data['RtnMsg'] ?? '付款失敗'),
      rawData: data,
    };
  }

  async queryPayment(_transactionId: string): Promise<PaymentQueryResult> {
    // ECPay 查詢 API 需要額外整合，這裡留佔位
    return {
      status: 'pending',
      transactionId: _transactionId,
      amount: 0,
    };
  }

  async refund(_params: RefundParams): Promise<RefundResult> {
    // ECPay 退款需要呼叫 DoAction API，這裡留佔位
    return { success: false, message: 'ECPay 退款功能待整合' };
  }

  // ── 內部方法 ──

  /**
   * CheckMacValue 產生 — ECPay 的簽章機制。
   * 1. 參數按 key 排序
   * 2. 組成 query string
   * 3. 前後加 HashKey / HashIV
   * 4. URL encode → 轉小寫 → SHA256
   */
  private generateCheckMac(params: Record<string, string>): string {
    const sorted = Object.keys(params)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map((k) => `${k}=${params[k]}`)
      .join('&');

    const raw = `HashKey=${this.config.hashKey}&${sorted}&HashIV=${this.config.hashIv}`;
    const encoded = encodeURIComponent(raw)
      .toLowerCase()
      .replace(/%20/g, '+')
      .replace(/%2d/g, '-')
      .replace(/%5f/g, '_')
      .replace(/%2e/g, '.')
      .replace(/%21/g, '!')
      .replace(/%2a/g, '*')
      .replace(/%28/g, '(')
      .replace(/%29/g, ')');

    return crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${y}/${m}/${d} ${h}:${min}:${s}`;
  }

  private escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
