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

export interface ShoplineConfig {
  merchantId: string;
  apiKey: string;
  secretKey: string;
  sandbox: boolean;
}

const SANDBOX_API = 'https://sandbox-api.shoplinepay.com';
const PRODUCTION_API = 'https://api.shoplinepay.com';

/**
 * Shopline Payment Strategy。
 *
 * 流程：
 * 1. 後端呼叫 Create Order API 建立付款請求
 * 2. Shopline 回傳 payment URL
 * 3. 前端導向 Shopline 付款頁面
 * 4. 付款完成後 Shopline POST webhook 通知
 * 5. 後端用 HMAC-SHA256 驗簽後更新訂單狀態
 */
export class ShoplineStrategy implements PaymentProvider {
  readonly providerName = 'shopline';
  private config: ShoplineConfig;
  private baseUrl: string;

  constructor(config: ShoplineConfig) {
    this.config = config;
    this.baseUrl = config.sandbox ? SANDBOX_API : PRODUCTION_API;
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const requestBody = {
      merchant_id: this.config.merchantId,
      order_id: params.orderNumber,
      amount: Math.round(params.amount),
      currency: params.currency || 'TWD',
      description: params.description,
      return_url: params.returnUrl,
      notify_url: params.notifyUrl,
      custom_field: params.orderId,
    };

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature(requestBody, timestamp);

    const response = await fetch(`${this.baseUrl}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
      body: JSON.stringify(requestBody),
    });

    const data = (await response.json()) as {
      success: boolean;
      data?: { transaction_id: string; payment_url: string };
      message?: string;
    };

    if (!data.success || !data.data) {
      throw new Error(`Shopline Payment failed: ${data.message ?? 'Unknown error'}`);
    }

    return {
      transactionId: data.data.transaction_id,
      type: 'redirect',
      data: data.data.payment_url,
    };
  }

  async verifyCallback(payload: Record<string, unknown>): Promise<PaymentCallbackResult> {
    const data = payload as Record<string, string>;

    // 驗證 HMAC 簽章
    const receivedSignature = data['signature'];
    const timestamp = data['timestamp'];

    const paramsForVerify = { ...data };
    delete paramsForVerify['signature'];

    const expectedSignature = this.generateSignature(paramsForVerify, timestamp);
    let isValid = false;
    if (receivedSignature && expectedSignature) {
      try {
        isValid = crypto.timingSafeEqual(
          Buffer.from(receivedSignature),
          Buffer.from(expectedSignature),
        );
      } catch {
        isValid = false;
      }
    }

    const status = data['status'];
    const success = isValid && status === 'paid';

    return {
      success,
      transactionId: data['custom_field'] ?? '',
      orderId: data['custom_field'] ?? '',
      amount: Number(data['amount'] ?? 0),
      providerTransactionId: data['transaction_id'],
      message: success ? '付款成功' : (data['message'] ?? '付款失敗'),
      rawData: data,
    };
  }

  async queryPayment(transactionId: string): Promise<PaymentQueryResult> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature({ transaction_id: transactionId }, timestamp);

    const response = await fetch(
      `${this.baseUrl}/v1/payments/${transactionId}`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': this.config.apiKey,
          'X-Timestamp': timestamp,
          'X-Signature': signature,
        },
      },
    );

    const data = (await response.json()) as {
      success: boolean;
      data?: { status: string; amount: number; transaction_id: string };
    };

    if (!data.success || !data.data) {
      return { status: 'pending', transactionId, amount: 0 };
    }

    const statusMap: Record<string, PaymentQueryResult['status']> = {
      paid: 'success',
      failed: 'failed',
      refunded: 'refunded',
    };

    return {
      status: statusMap[data.data.status] ?? 'pending',
      transactionId,
      amount: data.data.amount,
      providerTransactionId: data.data.transaction_id,
    };
  }

  async refund(params: RefundParams): Promise<RefundResult> {
    const requestBody = {
      transaction_id: params.transactionId,
      amount: Math.round(params.amount),
      reason: params.reason ?? '',
    };

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature(requestBody, timestamp);

    const response = await fetch(
      `${this.baseUrl}/v1/payments/${params.transactionId}/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
          'X-Timestamp': timestamp,
          'X-Signature': signature,
        },
        body: JSON.stringify(requestBody),
      },
    );

    const data = (await response.json()) as {
      success: boolean;
      data?: { refund_id: string };
      message?: string;
    };

    return {
      success: data.success,
      refundId: data.data?.refund_id,
      message: data.message ?? (data.success ? '退款成功' : '退款失敗'),
    };
  }

  // ── 內部方法 ──

  /**
   * HMAC-SHA256 簽章。
   * 將 payload JSON + timestamp 用 secretKey 做 HMAC。
   */
  private generateSignature(payload: Record<string, unknown>, timestamp: string): string {
    const message = timestamp + JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(message)
      .digest('hex');
  }
}
