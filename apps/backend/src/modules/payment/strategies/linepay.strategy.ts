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

export interface LinepayConfig {
  channelId: string;
  channelSecret: string;
  sandbox: boolean;
}

const SANDBOX_API = 'https://sandbox-api-pay.line.me';
const PRODUCTION_API = 'https://api-pay.line.me';

/**
 * LINE Pay Strategy。
 *
 * 流程：
 * 1. 後端呼叫 Reserve API 建立付款請求
 * 2. LINE Pay 回傳 redirect URL
 * 3. 顧客導向 LINE Pay 頁面（或 LINE App）付款
 * 4. 付款完成後導回 returnUrl，帶 transactionId
 * 5. 後端呼叫 Confirm API 確認付款
 */
export class LinepayStrategy implements PaymentProvider {
  readonly providerName = 'linepay';
  private config: LinepayConfig;
  private baseUrl: string;

  constructor(config: LinepayConfig) {
    this.config = config;
    this.baseUrl = config.sandbox ? SANDBOX_API : PRODUCTION_API;
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const requestBody = {
      amount: Math.round(params.amount),
      currency: params.currency || 'TWD',
      orderId: params.orderNumber,
      packages: [
        {
          id: params.orderId,
          amount: Math.round(params.amount),
          name: params.description,
          products: [
            {
              name: params.description,
              quantity: 1,
              price: Math.round(params.amount),
            },
          ],
        },
      ],
      redirectUrls: {
        confirmUrl: params.returnUrl,
        cancelUrl: params.returnUrl + '?cancel=true',
      },
    };

    const nonce = crypto.randomUUID();
    const requestUri = '/v3/payments/request';
    const signature = this.generateSignature(requestUri, JSON.stringify(requestBody), nonce);

    const response = await fetch(`${this.baseUrl}${requestUri}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': this.config.channelId,
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json() as {
      returnCode: string;
      returnMessage: string;
      info?: { transactionId: number; paymentUrl: { web: string; app: string } };
    };

    if (data.returnCode !== '0000' || !data.info) {
      throw new Error(`LINE Pay Reserve failed: ${data.returnMessage}`);
    }

    return {
      transactionId: String(data.info.transactionId),
      type: 'redirect',
      data: data.info.paymentUrl.web,
    };
  }

  /**
   * 確認付款 — 前端導回後呼叫此方法。
   * LINE Pay 特殊：callback 不是 POST webhook，而是前端 redirect 帶 transactionId，
   * 後端主動呼叫 Confirm API。
   */
  async verifyCallback(payload: Record<string, unknown>): Promise<PaymentCallbackResult> {
    const transactionId = String(payload['transactionId'] ?? '');
    const orderId = String(payload['orderId'] ?? '');
    const amount = Number(payload['amount'] ?? 0);

    if (!transactionId) {
      return {
        success: false,
        transactionId: '',
        orderId,
        amount,
        message: '缺少 transactionId',
        rawData: payload,
      };
    }

    // Confirm API
    const requestUri = `/v3/payments/${transactionId}/confirm`;
    const requestBody = { amount, currency: 'TWD' };
    const nonce = crypto.randomUUID();
    const signature = this.generateSignature(requestUri, JSON.stringify(requestBody), nonce);

    const response = await fetch(`${this.baseUrl}${requestUri}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': this.config.channelId,
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json() as {
      returnCode: string;
      returnMessage: string;
      info?: unknown;
    };

    const success = data.returnCode === '0000';

    return {
      success,
      transactionId,
      orderId,
      amount,
      providerTransactionId: transactionId,
      message: success ? '付款成功' : data.returnMessage,
      rawData: data as Record<string, unknown>,
    };
  }

  async queryPayment(transactionId: string): Promise<PaymentQueryResult> {
    // LINE Pay 沒有獨立查詢 API，用 Confirm 結果判斷
    return {
      status: 'pending',
      transactionId,
      amount: 0,
    };
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    const requestUri = `/v3/payments/${params.transactionId}/refund`;
    const requestBody = { refundAmount: Math.round(params.amount) };
    const nonce = crypto.randomUUID();
    const signature = this.generateSignature(requestUri, JSON.stringify(requestBody), nonce);

    const response = await fetch(`${this.baseUrl}${requestUri}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': this.config.channelId,
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json() as { returnCode: string; returnMessage: string };
    return {
      success: data.returnCode === '0000',
      refundId: params.transactionId,
      message: data.returnMessage,
    };
  }

  // ── 內部方法 ──

  /**
   * LINE Pay v3 HMAC-SHA256 簽章
   * signature = Base64(HMAC-SHA256(channelSecret, channelSecret + requestUri + requestBody + nonce))
   */
  private generateSignature(requestUri: string, requestBody: string, nonce: string): string {
    const message = this.config.channelSecret + requestUri + requestBody + nonce;
    return crypto
      .createHmac('sha256', this.config.channelSecret)
      .update(message)
      .digest('base64');
  }
}
