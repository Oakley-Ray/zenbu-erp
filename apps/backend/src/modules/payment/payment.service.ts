import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentTransaction } from './payment-transaction.entity';
import { PaymentConfig } from './payment-config.entity';
import { PaymentProvider as PaymentProviderInterface } from './interfaces/payment-provider.interface';
import { EcpayStrategy, EcpayConfig } from './strategies/ecpay.strategy';
import { LinepayStrategy, LinepayConfig } from './strategies/linepay.strategy';
import { ShoplineStrategy, ShoplineConfig } from './strategies/shopline.strategy';
import { UnipayStrategy, UnipayConfig } from './strategies/unipay.strategy';
import { OrdersService } from '../erp/orders/orders.service';
import { PaymentProvider, PaymentStatus } from '@layerframe/shared-types';
import { encrypt, decrypt } from './utils/encryption';

@Injectable()
export class PaymentService {
  private encryptionKey: string;

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly txRepo: Repository<PaymentTransaction>,
    @InjectRepository(PaymentConfig)
    private readonly configRepo: Repository<PaymentConfig>,
    private readonly ordersService: OrdersService,
    private readonly config: ConfigService,
  ) {
    this.encryptionKey = this.config.get<string>('ENCRYPTION_KEY', '');
  }

  // ══════════════════════════════════
  // 付款流程
  // ══════════════════════════════════

  /** 建立付款 — 前端呼叫取得付款資訊 */
  async createPayment(
    tenantId: string,
    orderId: string,
    provider: PaymentProvider,
    returnUrl: string,
    notifyUrl: string,
  ) {
    // 1. 取得訂單
    const order = await this.ordersService.findById(tenantId, orderId);

    // 2. 取得金流商設定並建立 strategy
    const strategy = await this.getStrategy(tenantId, provider);

    // 3. 產生交易 ID
    const transactionId = crypto.randomUUID();

    // 4. 呼叫金流商
    const result = await strategy.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.totalAmount),
      currency: order.currency,
      description: `訂單 ${order.orderNumber}`,
      returnUrl,
      notifyUrl,
    });

    // 5. 儲存交易記錄
    await this.txRepo.save(
      this.txRepo.create({
        tenantId,
        transactionId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        provider,
        amount: Number(order.totalAmount),
        currency: order.currency,
        status: PaymentStatus.PENDING,
      }),
    );

    return {
      transactionId,
      paymentType: result.type,
      paymentData: result.data,
    };
  }

  /** 處理金流商回呼（webhook） */
  async handleCallback(tenantId: string, provider: PaymentProvider, payload: Record<string, unknown>) {
    const strategy = await this.getStrategy(tenantId, provider);
    const result = await strategy.verifyCallback(payload);

    // 找到對應的交易記錄
    const tx = await this.txRepo.findOne({
      where: { tenantId, orderId: result.orderId },
      order: { createdAt: 'DESC' },
    });

    if (!tx) {
      throw new NotFoundException('找不到對應的交易記錄');
    }

    // 更新交易狀態
    tx.status = result.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
    tx.providerTransactionId = result.providerTransactionId;
    tx.rawResponse = result.rawData;
    if (!result.success) tx.failReason = result.message;
    await this.txRepo.save(tx);

    // 更新訂單付款狀態
    const orderPaymentStatus = result.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
    await this.ordersService.updatePaymentStatus(tenantId, tx.orderId, orderPaymentStatus);

    return { success: result.success, message: result.message };
  }

  /** LINE Pay Confirm — 前端導回後呼叫 */
  async confirmLinePay(
    tenantId: string,
    lineTransactionId: string,
    orderId: string,
    amount: number,
  ) {
    return this.handleCallback(tenantId, PaymentProvider.LINEPAY, {
      transactionId: lineTransactionId,
      orderId,
      amount,
    });
  }

  /** 退款 */
  async refund(tenantId: string, transactionId: string, amount?: number) {
    const tx = await this.txRepo.findOne({ where: { tenantId, transactionId } });
    if (!tx) throw new NotFoundException('交易記錄不存在');
    if (tx.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('只有付款成功的交易才能退款');
    }

    const refundAmount = amount ?? Number(tx.amount);
    const strategy = await this.getStrategy(tenantId, tx.provider);
    const result = await strategy.refund({
      transactionId: tx.providerTransactionId ?? tx.transactionId,
      amount: refundAmount,
    });

    if (result.success) {
      tx.status = PaymentStatus.REFUNDED;
      tx.refundAmount = refundAmount;
      await this.txRepo.save(tx);
      await this.ordersService.updatePaymentStatus(tenantId, tx.orderId, PaymentStatus.REFUNDED);
    }

    return result;
  }

  /** 查詢交易記錄 */
  async findTransactions(tenantId: string, orderId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (orderId) where['orderId'] = orderId;
    return this.txRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  // ══════════════════════════════════
  // 金流設定管理（租戶 Admin 用）
  // ══════════════════════════════════

  async saveConfig(
    tenantId: string,
    provider: PaymentProvider,
    rawConfig: Record<string, string>,
    isSandbox = true,
  ) {
    if (!this.encryptionKey) throw new BadRequestException('ENCRYPTION_KEY 未設定');

    const encrypted = encrypt(JSON.stringify(rawConfig), this.encryptionKey);

    let config = await this.configRepo.findOne({ where: { tenantId, provider } });
    if (!config) {
      config = this.configRepo.create({ tenantId, provider });
    }
    config.encryptedConfig = encrypted;
    config.isSandbox = isSandbox;
    config.isActive = true;
    return this.configRepo.save(config);
  }

  async getConfigStatus(tenantId: string) {
    const configs = await this.configRepo.find({ where: { tenantId } });
    return configs.map((c) => ({
      provider: c.provider,
      isActive: c.isActive,
      isSandbox: c.isSandbox,
      updatedAt: c.updatedAt,
    }));
  }

  // ══════════════════════════════════
  // 內部方法
  // ══════════════════════════════════

  private async getStrategy(tenantId: string, provider: PaymentProvider): Promise<PaymentProviderInterface> {
    const config = await this.configRepo.findOne({ where: { tenantId, provider, isActive: true } });
    if (!config) {
      throw new BadRequestException(`金流商 ${provider} 未設定或未啟用`);
    }

    const decrypted = JSON.parse(decrypt(config.encryptedConfig, this.encryptionKey));

    switch (provider) {
      case PaymentProvider.ECPAY:
        return new EcpayStrategy({
          merchantId: decrypted.merchantId,
          hashKey: decrypted.hashKey,
          hashIv: decrypted.hashIv,
          sandbox: config.isSandbox,
        });

      case PaymentProvider.LINEPAY:
        return new LinepayStrategy({
          channelId: decrypted.channelId,
          channelSecret: decrypted.channelSecret,
          sandbox: config.isSandbox,
        });

      case PaymentProvider.SHOPLINE:
        return new ShoplineStrategy({
          merchantId: decrypted.merchantId,
          apiKey: decrypted.apiKey,
          secretKey: decrypted.secretKey,
          sandbox: config.isSandbox,
        });

      case PaymentProvider.UNIPAY:
        return new UnipayStrategy({
          merchantId: decrypted.merchantId,
          hashKey: decrypted.hashKey,
          hashIv: decrypted.hashIv,
          sandbox: config.isSandbox,
        });

      default:
        throw new BadRequestException(`不支援的金流商: ${provider}`);
    }
  }
}
