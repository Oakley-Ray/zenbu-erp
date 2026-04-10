import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreSetting } from './store-setting.entity';
import { Wishlist } from './wishlist.entity';
import { ProductsService } from '../erp/products/products.service';
import { ProductStatus } from '../erp/products/product.entity';

/**
 * 商店前台服務 — 提供 Storefront 公開 API 使用的方法。
 * 只回傳已上架（active）的商品，不含成本價等敏感資訊。
 */
@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(StoreSetting)
    private readonly settingRepo: Repository<StoreSetting>,
    @InjectRepository(Wishlist)
    private readonly wishlistRepo: Repository<Wishlist>,
    private readonly productsService: ProductsService,
  ) {}

  // ── 商店設定 ──

  async getSettings(tenantId: string): Promise<StoreSetting> {
    let settings = await this.settingRepo.findOne({ where: { tenantId } });
    if (!settings) {
      settings = await this.settingRepo.save(
        this.settingRepo.create({ tenantId }),
      );
    }
    return settings;
  }

  async updateSettings(tenantId: string, dto: Partial<StoreSetting>): Promise<StoreSetting> {
    const settings = await this.getSettings(tenantId);
    Object.assign(settings, dto);
    return this.settingRepo.save(settings);
  }

  // ── 前台商品 API ──

  /** 前台商品列表 — 只顯示 active 狀態 */
  async getPublicProducts(tenantId: string, opts?: { page?: number; limit?: number; categoryId?: string }) {
    return this.productsService.findAllProducts(tenantId, {
      ...opts,
      status: ProductStatus.ACTIVE,
    });
  }

  /** 前台單品詳情（隱藏 costPrice） */
  async getPublicProduct(tenantId: string, id: string) {
    const product = await this.productsService.findProductById(tenantId, id);
    if (product.status !== ProductStatus.ACTIVE) {
      throw new NotFoundException('商品不存在');
    }
    // 隱藏成本價
    const { costPrice, ...publicProduct } = product;
    return publicProduct;
  }

  /** 前台分類列表 */
  async getPublicCategories(tenantId: string) {
    return this.productsService.findAllCategories(tenantId);
  }

  // ── 願望清單 ──

  async addToWishlist(tenantId: string, customerId: string, productId: string): Promise<Wishlist> {
    const existing = await this.wishlistRepo.findOne({
      where: { tenantId, customerId, productId },
    });
    if (existing) return existing;
    return this.wishlistRepo.save(
      this.wishlistRepo.create({ tenantId, customerId, productId }),
    );
  }

  async removeFromWishlist(tenantId: string, customerId: string, productId: string): Promise<void> {
    await this.wishlistRepo.delete({ tenantId, customerId, productId });
  }

  async getWishlist(tenantId: string, customerId: string): Promise<Wishlist[]> {
    return this.wishlistRepo.find({
      where: { tenantId, customerId },
      order: { createdAt: 'DESC' },
    });
  }
}
