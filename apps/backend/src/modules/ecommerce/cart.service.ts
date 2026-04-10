import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { ProductsService } from '../erp/products/products.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly itemRepo: Repository<CartItem>,
    private readonly productsService: ProductsService,
  ) {}

  /** 取得或建立購物車 */
  async getOrCreate(tenantId: string, identity: { customerId?: string; sessionId?: string }): Promise<Cart> {
    if (!identity.customerId && !identity.sessionId) {
      throw new BadRequestException('需要 customerId 或 sessionId');
    }

    const where = identity.customerId
      ? { tenantId, customerId: identity.customerId }
      : { tenantId, sessionId: identity.sessionId };

    let cart = await this.cartRepo.findOne({ where, relations: ['items'] });
    if (!cart) {
      cart = await this.cartRepo.save(this.cartRepo.create({ tenantId, ...identity, items: [] }));
      cart.items = [];
    }
    return cart;
  }

  /** 加入商品 — 如果已存在就增加數量 */
  async addItem(
    tenantId: string,
    identity: { customerId?: string; sessionId?: string },
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    if (quantity < 1) throw new BadRequestException('數量至少為 1');

    const cart = await this.getOrCreate(tenantId, identity);
    const product = await this.productsService.findProductById(tenantId, productId);

    const existing = cart.items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
      // 更新價格快照
      existing.unitPrice = Number(product.price);
      await this.itemRepo.save(existing);
    } else {
      const item = this.itemRepo.create({
        cartId: cart.id,
        productId: product.id,
        productName: product.name,
        productImage: product.images[0],
        unitPrice: Number(product.price),
        quantity,
      });
      await this.itemRepo.save(item);
    }

    return this.getOrCreate(tenantId, identity);
  }

  /** 更新商品數量 */
  async updateItemQuantity(
    tenantId: string,
    identity: { customerId?: string; sessionId?: string },
    productId: string,
    quantity: number,
  ): Promise<Cart> {
    const cart = await this.getOrCreate(tenantId, identity);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw new NotFoundException('購物車中找不到此商品');

    if (quantity <= 0) {
      await this.itemRepo.remove(item);
    } else {
      item.quantity = quantity;
      await this.itemRepo.save(item);
    }

    return this.getOrCreate(tenantId, identity);
  }

  /** 移除商品 */
  async removeItem(
    tenantId: string,
    identity: { customerId?: string; sessionId?: string },
    productId: string,
  ): Promise<Cart> {
    const cart = await this.getOrCreate(tenantId, identity);
    const item = cart.items.find((i) => i.productId === productId);
    if (item) await this.itemRepo.remove(item);
    return this.getOrCreate(tenantId, identity);
  }

  /** 清空購物車 */
  async clear(tenantId: string, identity: { customerId?: string; sessionId?: string }): Promise<void> {
    const cart = await this.getOrCreate(tenantId, identity);
    await this.itemRepo.delete({ cartId: cart.id });
  }

  /** 合併訪客購物車到登入帳號（登入後呼叫） */
  async mergeCarts(tenantId: string, sessionId: string, customerId: string): Promise<Cart> {
    const guestCart = await this.cartRepo.findOne({
      where: { tenantId, sessionId },
      relations: ['items'],
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreate(tenantId, { customerId });
    }

    // 逐一加入到登入帳號的購物車
    for (const item of guestCart.items) {
      await this.addItem(tenantId, { customerId }, item.productId, item.quantity);
    }

    // 刪除訪客購物車
    await this.itemRepo.delete({ cartId: guestCart.id });
    await this.cartRepo.remove(guestCart);

    return this.getOrCreate(tenantId, { customerId });
  }

  /** 計算購物車摘要 */
  getCartSummary(cart: Cart) {
    const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = cart.items.reduce(
      (sum, i) => sum + Number(i.unitPrice) * i.quantity,
      0,
    );
    return { itemCount, subtotal, items: cart.items };
  }
}
